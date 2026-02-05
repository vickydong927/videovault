package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/videoplatform/video-processing-service/internal/models"
)

type VideoService interface {
	ProcessVideo(event *models.VideoUploadEvent) error
}

type VideoHandler struct {
	service VideoService
}

func NewVideoHandler(service VideoService) *VideoHandler {
	return &VideoHandler{service: service}
}

func (h *VideoHandler) UploadVideo(c *gin.Context) {
	var event models.VideoUploadEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Process video asynchronously
	go func() {
		if err := h.service.ProcessVideo(&event); err != nil {
			// Log error but don't block response
		}
	}()

	c.JSON(http.StatusAccepted, gin.H{
		"message":  "Video processing started",
		"video_id": event.VideoID,
	})
}

func (h *VideoHandler) GetProcessingStatus(c *gin.Context) {
	videoID := c.Param("id")

	// This would fetch from etcd in a real implementation
	// For now, return a mock response
	status := models.ProcessingStatus{
		VideoID:  videoID,
		Status:   "processing",
		Progress: 50,
		Message:  "Transcoding in progress",
	}

	c.JSON(http.StatusOK, status)
}