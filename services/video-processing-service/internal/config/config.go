package config

import (
	"os"
	"strings"
)

type Config struct {
	KafkaBrokers      []string
	AWSRegion         string
	AWSS3Bucket       string
	AWSAccessKeyID    string
	AWSSecretKey      string
	EtcdEndpoints     []string
	MaxConcurrentJobs int
	TempDir           string
}

func Load() *Config {
	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "localhost:9092"
	}

	etcdEndpoints := os.Getenv("ETCD_ENDPOINTS")
	if etcdEndpoints == "" {
		etcdEndpoints = "localhost:2379"
	}

	return &Config{
		KafkaBrokers:      strings.Split(kafkaBrokers, ","),
		AWSRegion:         getEnv("AWS_REGION", "us-east-1"),
		AWSS3Bucket:       getEnv("AWS_S3_BUCKET", "video-platform-storage"),
		AWSAccessKeyID:    os.Getenv("AWS_ACCESS_KEY_ID"),
		AWSSecretKey:      os.Getenv("AWS_SECRET_ACCESS_KEY"),
		EtcdEndpoints:     strings.Split(etcdEndpoints, ","),
		MaxConcurrentJobs: 5,
		TempDir:           "/tmp/video-processing",
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}