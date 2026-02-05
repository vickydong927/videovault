package kafka

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/videoplatform/video-processing-service/internal/config"
	"github.com/videoplatform/video-processing-service/internal/models"
)

type VideoProcessor interface {
	ProcessVideo(event *models.VideoUploadEvent) error
}

type Consumer struct {
	reader    *kafka.Reader
	processor VideoProcessor
}

func NewConsumer(cfg *config.Config, processor VideoProcessor) *Consumer {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        cfg.KafkaBrokers,
		Topic:          "video-upload-events",
		GroupID:        "video-processing-group",
		MinBytes:       10e3,
		MaxBytes:       10e6,
		CommitInterval: time.Second,
	})

	return &Consumer{
		reader:    r,
		processor: processor,
	}
}

func (c *Consumer) Start() {
	log.Println("Starting Kafka consumer for video upload events")

	for {
		m, err := c.reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Error reading message: %v", err)
			continue
		}

		var event models.VideoUploadEvent
		if err := json.Unmarshal(m.Value, &event); err != nil {
			log.Printf("Error unmarshaling event: %v", err)
			continue
		}

		log.Printf("Received video upload event: %s", event.VideoID)

		// Process video asynchronously
		go func(e models.VideoUploadEvent) {
			if err := c.processor.ProcessVideo(&e); err != nil {
				log.Printf("Error processing video %s: %v", e.VideoID, err)
			}
		}(event)
	}
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}