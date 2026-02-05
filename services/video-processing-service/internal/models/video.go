package models

import (
	"time"
)

type VideoUploadEvent struct {
	VideoID     string    `json:"video_id"`
	UserID      string    `json:"user_id"`
	FileName    string    `json:"file_name"`
	FileSize    int64     `json:"file_size"`
	S3Key       string    `json:"s3_key"`
	UploadedAt  time.Time `json:"uploaded_at"`
}

type ProcessingStatus struct {
	VideoID    string    `json:"video_id"`
	Status     string    `json:"status"` // pending, processing, completed, failed
	Progress   int       `json:"progress"`
	Message    string    `json:"message"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type VideoQuality struct {
	Resolution string `json:"resolution"` // 1080p, 720p, 480p, 360p
	Bitrate    string `json:"bitrate"`
	Codec      string `json:"codec"`
}

type VideoSegment struct {
	SegmentID  string `json:"segment_id"`
	VideoID    string `json:"video_id"`
	Quality    string `json:"quality"`
	Sequence   int    `json:"sequence"`
	Duration   float64 `json:"duration"`
	S3Key      string `json:"s3_key"`
	NodeID     string `json:"node_id"`
}