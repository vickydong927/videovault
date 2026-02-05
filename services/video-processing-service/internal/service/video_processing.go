package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/videoplatform/video-processing-service/internal/config"
	"github.com/videoplatform/video-processing-service/internal/kafka"
	"github.com/videoplatform/video-processing-service/internal/metrics"
	"github.com/videoplatform/video-processing-service/internal/models"
	"github.com/videoplatform/video-processing-service/internal/storage"
)

type VideoProcessingService struct {
	s3Client      *storage.S3Client
	etcdClient    *storage.EtcdClient
	kafkaProducer *kafka.Producer
	config        *config.Config
}

func NewVideoProcessingService(
	s3 *storage.S3Client,
	etcd *storage.EtcdClient,
	kafka *kafka.Producer,
	cfg *config.Config,
) *VideoProcessingService {
	return &VideoProcessingService{
		s3Client:      s3,
		etcdClient:    etcd,
		kafkaProducer: kafka,
		config:        cfg,
	}
}

func (s *VideoProcessingService) ProcessVideo(event *models.VideoUploadEvent) error {
	start := time.Now()
	log.Printf("Starting video processing for video_id: %s", event.VideoID)

	// Update status to processing
	s.updateStatus(event.VideoID, "processing", 0, "Starting video processing")

	// Download video from S3
	localPath := filepath.Join(s.config.TempDir, event.VideoID, event.FileName)
	if err := os.MkdirAll(filepath.Dir(localPath), 0755); err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}

	if err := s.s3Client.DownloadFile(event.S3Key, localPath); err != nil {
		s.updateStatus(event.VideoID, "failed", 0, fmt.Sprintf("Failed to download video: %v", err))
		metrics.VideoProcessingTotal.WithLabelValues("failed").Inc()
		return err
	}

	s.updateStatus(event.VideoID, "processing", 10, "Video downloaded, starting transcoding")

	// Transcode to multiple qualities
	qualities := []models.VideoQuality{
		{Resolution: "1080p", Bitrate: "5000k", Codec: "libx264"},
		{Resolution: "720p", Bitrate: "2500k", Codec: "libx264"},
		{Resolution: "480p", Bitrate: "1000k", Codec: "libx264"},
		{Resolution: "360p", Bitrate: "500k", Codec: "libx264"},
	}

	for i, quality := range qualities {
		if err := s.transcodeAndSegment(event.VideoID, localPath, quality); err != nil {
			log.Printf("Failed to transcode %s: %v", quality.Resolution, err)
			metrics.FFmpegProcessingFailures.Inc()
			continue
		}
		progress := 10 + ((i + 1) * 80 / len(qualities))
		s.updateStatus(event.VideoID, "processing", progress, fmt.Sprintf("Transcoded %s", quality.Resolution))
	}

	// Cleanup temp files
	os.RemoveAll(filepath.Join(s.config.TempDir, event.VideoID))

	// Update status to completed
	s.updateStatus(event.VideoID, "completed", 100, "Video processing completed")
	metrics.VideoProcessingTotal.WithLabelValues("success").Inc()
	metrics.VideoProcessingDuration.WithLabelValues("all").Observe(time.Since(start).Seconds())

	log.Printf("Video processing completed for video_id: %s (duration: %v)", event.VideoID, time.Since(start))
	return nil
}

func (s *VideoProcessingService) transcodeAndSegment(videoID, inputPath string, quality models.VideoQuality) error {
	start := time.Now()
	outputDir := filepath.Join(s.config.TempDir, videoID, quality.Resolution)
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return err
	}

	outputPattern := filepath.Join(outputDir, "segment_%03d.ts")
	playlistPath := filepath.Join(outputDir, "playlist.m3u8")

	// FFmpeg command for DASH/HLS segmentation
	cmd := exec.Command("ffmpeg",
		"-i", inputPath,
		"-c:v", quality.Codec,
		"-b:v", quality.Bitrate,
		"-c:a", "aac",
		"-b:a", "128k",
		"-f", "hls",
		"-hls_time", "10",
		"-hls_list_size", "0",
		"-hls_segment_filename", outputPattern,
		playlistPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("FFmpeg error: %s", string(output))
		return fmt.Errorf("ffmpeg failed: %w", err)
	}

	// Upload segments to S3 and distribute across storage nodes
	files, err := filepath.Glob(filepath.Join(outputDir, "*.ts"))
	if err != nil {
		return err
	}

	for i, file := range files {
		segmentID := uuid.New().String()
		s3Key := fmt.Sprintf("videos/%s/%s/segment_%03d.ts", videoID, quality.Resolution, i)
		
		if err := s.s3Client.UploadFile(file, s3Key); err != nil {
			log.Printf("Failed to upload segment %s: %v", file, err)
			continue
		}

		// Store segment metadata in etcd
		segment := models.VideoSegment{
			SegmentID: segmentID,
			VideoID:   videoID,
			Quality:   quality.Resolution,
			Sequence:  i,
			S3Key:     s3Key,
			NodeID:    s.selectStorageNode(segmentID),
		}

		segmentJSON, _ := json.Marshal(segment)
		s.etcdClient.Put(context.Background(), fmt.Sprintf("/segments/%s", segmentID), string(segmentJSON))
		metrics.VideoSegmentsCreated.WithLabelValues(quality.Resolution).Inc()
	}

	// Upload playlist
	playlistS3Key := fmt.Sprintf("videos/%s/%s/playlist.m3u8", videoID, quality.Resolution)
	s.s3Client.UploadFile(playlistPath, playlistS3Key)

	metrics.VideoProcessingDuration.WithLabelValues(quality.Resolution).Observe(time.Since(start).Seconds())
	return nil
}

func (s *VideoProcessingService) selectStorageNode(segmentID string) string {
	// Consistent hashing to select storage node
	// This is a simplified version - in production, use proper consistent hashing
	nodes := []string{"node-1", "node-2", "node-3", "node-4"}
	hash := 0
	for _, c := range segmentID {
		hash += int(c)
	}
	return nodes[hash%len(nodes)]
}

func (s *VideoProcessingService) updateStatus(videoID, status string, progress int, message string) {
	statusUpdate := models.ProcessingStatus{
		VideoID:   videoID,
		Status:    status,
		Progress:  progress,
		Message:   message,
		UpdatedAt: time.Now(),
	}

	statusJSON, _ := json.Marshal(statusUpdate)
	s.etcdClient.Put(context.Background(), fmt.Sprintf("/processing-status/%s", videoID), string(statusJSON))

	// Publish status update to Kafka
	s.kafkaProducer.PublishProcessingStatus(&statusUpdate)
}