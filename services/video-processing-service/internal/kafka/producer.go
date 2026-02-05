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

type Producer struct {
	writer *kafka.Writer
}

func NewProducer(cfg *config.Config) *Producer {
	w := &kafka.Writer{
		Addr:         kafka.TCP(cfg.KafkaBrokers...),
		Topic:        "video-processing-status",
		Balancer:     &kafka.LeastBytes{},
		WriteTimeout: 10 * time.Second,
		ReadTimeout:  10 * time.Second,
	}

	return &Producer{writer: w}
}

func (p *Producer) PublishProcessingStatus(status *models.ProcessingStatus) error {
	data, err := json.Marshal(status)
	if err != nil {
		return err
	}

	err = p.writer.WriteMessages(context.Background(), kafka.Message{
		Key:   []byte(status.VideoID),
		Value: data,
	})

	if err != nil {
		log.Printf("Failed to publish processing status: %v", err)
		return err
	}

	return nil
}

func (p *Producer) Close() error {
	return p.writer.Close()
}