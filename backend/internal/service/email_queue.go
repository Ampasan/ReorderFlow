package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"reorderflow-backend/internal/utils"
)

const (
	emailQueueWorkers = 2
	emailQueueBuffer  = 64
	emailTaskTimeout  = 2 * time.Minute
)

type EmailTask struct {
	Name      string
	Send      func(ctx context.Context) error
	OnFailure func(err error)
}

func (t EmailTask) run() {
	defer func() {
		if r := recover(); r != nil {
			err := fmt.Errorf("panic: %v", r)
			utils.Logger.Error("email task panic", "task", t.Name, "error", r)
			if t.OnFailure != nil {
				t.OnFailure(err)
			}
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), emailTaskTimeout)
	defer cancel()

	if err := t.Send(ctx); err != nil {
		utils.Logger.Error("email task failed", "task", t.Name, "error", err)
		if t.OnFailure != nil {
			t.OnFailure(err)
		}
		return
	}
	utils.Logger.Info("email task sent", "task", t.Name)
}

type EmailQueue struct {
	mu     sync.Mutex
	tasks  chan EmailTask
	closed bool
	wg     sync.WaitGroup
}

func NewEmailQueue() *EmailQueue {
	q := &EmailQueue{tasks: make(chan EmailTask, emailQueueBuffer)}
	q.wg.Add(emailQueueWorkers)
	for i := 0; i < emailQueueWorkers; i++ {
		go q.worker()
	}
	return q
}

func (q *EmailQueue) Enqueue(task EmailTask) {
	q.mu.Lock()
	defer q.mu.Unlock()

	if q.closed {
		go task.run()
		return
	}

	select {
	case q.tasks <- task:
	default:
		utils.Logger.Warn("email queue full, sending immediately", "task", task.Name)
		go task.run()
	}
}

func (q *EmailQueue) Stop(ctx context.Context) error {
	q.mu.Lock()
	if !q.closed {
		q.closed = true
		close(q.tasks)
	}
	q.mu.Unlock()

	done := make(chan struct{})
	go func() {
		q.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (q *EmailQueue) worker() {
	defer q.wg.Done()
	for task := range q.tasks {
		task.run()
	}
}
