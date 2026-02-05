package storage

import (
	"fmt"
	"io"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/videoplatform/video-processing-service/internal/config"
	"github.com/videoplatform/video-processing-service/internal/metrics"
)

type S3Client struct {
	svc      *s3.S3
	uploader *s3manager.Uploader
	bucket   string
}

func NewS3Client(cfg *config.Config) *S3Client {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String(cfg.AWSRegion),
		Credentials: credentials.NewStaticCredentials(
			cfg.AWSAccessKeyID,
			cfg.AWSSecretKey,
			"",
		),
	}))

	return &S3Client{
		svc:      s3.New(sess),
		uploader: s3manager.NewUploader(sess),
		bucket:   cfg.AWSS3Bucket,
	}
}

func (c *S3Client) UploadFile(localPath, s3Key string) error {
	start := time.Now()
	defer func() {
		metrics.StorageUploadDuration.Observe(time.Since(start).Seconds())
	}()

	file, err := os.Open(localPath)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	_, err = c.uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(s3Key),
		Body:   file,
	})

	if err != nil {
		return fmt.Errorf("failed to upload to S3: %w", err)
	}

	return nil
}

func (c *S3Client) DownloadFile(s3Key, localPath string) error {
	file, err := os.Create(localPath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	downloader := s3manager.NewDownloaderWithClient(c.svc)
	_, err = downloader.Download(file, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(s3Key),
	})

	if err != nil {
		return fmt.Errorf("failed to download from S3: %w", err)
	}

	return nil
}

func (c *S3Client) GetPresignedURL(s3Key string, expiration time.Duration) (string, error) {
	req, _ := c.svc.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(s3Key),
	})

	urlStr, err := req.Presign(expiration)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return urlStr, nil
}