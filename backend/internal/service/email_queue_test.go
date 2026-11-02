package service

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestEmailQueueRunsTask(t *testing.T) {
	q := NewEmailQueue()
	done := make(chan struct{})
	q.Enqueue(EmailTask{
		Name: "test",
		Send: func(ctx context.Context) error {
			close(done)
			return nil
		},
	})

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("email task did not run")
	}

	if err := q.Stop(context.Background()); err != nil {
		t.Fatalf("stop queue: %v", err)
	}
}

func TestEmailQueueCallsOnFailure(t *testing.T) {
	q := NewEmailQueue()
	failed := make(chan error, 1)
	q.Enqueue(EmailTask{
		Name: "test failure",
		Send: func(ctx context.Context) error {
			return errors.New("boom")
		},
		OnFailure: func(err error) {
			failed <- err
		},
	})

	select {
	case err := <-failed:
		if err == nil {
			t.Fatal("expected failure callback error")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("failure callback did not run")
	}

	if err := q.Stop(context.Background()); err != nil {
		t.Fatalf("stop queue: %v", err)
	}
}

func TestEmailQueueStopDrainsQueuedTasks(t *testing.T) {
	q := NewEmailQueue()
	done := make(chan struct{})
	q.Enqueue(EmailTask{
		Name: "queued",
		Send: func(ctx context.Context) error {
			close(done)
			return nil
		},
	})

	if err := q.Stop(context.Background()); err != nil {
		t.Fatalf("stop queue: %v", err)
	}

	select {
	case <-done:
	default:
		t.Fatal("queued task was not drained")
	}
}
