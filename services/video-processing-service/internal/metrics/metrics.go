package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	VideoProcessingTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "video_processing_total",
			Help: "Total number of video processing jobs",
		},
		[]string{"status"},
	)

	VideoProcessingDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "video_processing_duration_seconds",
			Help:    "Duration of video processing in seconds",
			Buckets: prometheus.ExponentialBuckets(1, 2, 10),
		},
		[]string{"quality"},
	)

	FFmpegProcessingFailures = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "ffmpeg_processing_failures_total",
			Help: "Total number of FFmpeg processing failures",
		},
	)

	VideoSegmentsCreated = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "video_segments_created_total",
			Help: "Total number of video segments created",
		},
		[]string{"quality"},
	)

	StorageUploadDuration = promauto.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "storage_upload_duration_seconds",
			Help:    "Duration of storage uploads in seconds",
			Buckets: prometheus.ExponentialBuckets(0.1, 2, 10),
		},
	)
)

func Init() {
	// Metrics are automatically registered via promauto
}