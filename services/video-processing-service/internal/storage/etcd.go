package storage

import (
	"context"
	"time"

	"github.com/videoplatform/video-processing-service/internal/config"
	clientv3 "go.etcd.io/etcd/client/v3"
)

type EtcdClient struct {
	client *clientv3.Client
}

func NewEtcdClient(cfg *config.Config) *EtcdClient {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   cfg.EtcdEndpoints,
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		panic(err)
	}

	return &EtcdClient{client: cli}
}

func (e *EtcdClient) Put(ctx context.Context, key, value string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := e.client.Put(ctx, key, value)
	return err
}

func (e *EtcdClient) Get(ctx context.Context, key string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	resp, err := e.client.Get(ctx, key)
	if err != nil {
		return "", err
	}

	if len(resp.Kvs) == 0 {
		return "", nil
	}

	return string(resp.Kvs[0].Value), nil
}

func (e *EtcdClient) Delete(ctx context.Context, key string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := e.client.Delete(ctx, key)
	return err
}

func (e *EtcdClient) Close() error {
	return e.client.Close()
}