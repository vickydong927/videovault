package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/videoplatform/video-processing-service/internal/config"
	"github.com/videoplatform/video-processing-service/internal/handler"
	"github.com/videoplatform/video-processing-service/internal/kafka"
	"github.com/videoplatform/video-processing-service/internal/metrics"
	"github.com/videoplatform/video-processing-service/internal/service"
	"github.com/videoplatform/video-processing-service/internal/storage"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize metrics
	metrics.Init()

	// Initialize storage clients
	s3Client := storage.NewS3Client(cfg)
	etcdClient := storage.NewEtcdClient(cfg)
	defer etcdClient.Close()

	// Initialize Kafka producer
	kafkaProducer := kafka.NewProducer(cfg)
	defer kafkaProducer.Close()

	// Initialize services
	videoService := service.NewVideoProcessingService(s3Client, etcdClient, kafkaProducer, cfg)

	// Initialize Kafka consumer for video upload events
	kafkaConsumer := kafka.NewConsumer(cfg, videoService)
	go kafkaConsumer.Start()
	defer kafkaConsumer.Close()

	// Setup HTTP server
	router := gin.Default()

	// Health check endpoints
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	router.GET("/ready", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ready"})
	})

	// Metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// API endpoints
	api := router.Group("/api")
	{
		videoHandler := handler.NewVideoHandler(videoService)
		api.POST("/videos/upload", videoHandler.UploadVideo)
		api.GET("/videos/:id/status", videoHandler.GetProcessingStatus)
	}

	// Start server
	srv := &http.Server{
		Addr:    ":8081",
		Handler: router,
	}

	go func() {
		log.Printf("Video Processing Service starting on port 8081")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}