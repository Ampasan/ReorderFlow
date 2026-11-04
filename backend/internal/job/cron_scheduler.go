package job

import (
	"time"

	"github.com/robfig/cron"

	"reorderflow-backend/internal/utils"
)

type Scheduler struct {
	cron *cron.Cron
}

func NewScheduler(run func()) *Scheduler {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		loc = time.Local
	}

	c := cron.NewWithLocation(loc)
	if err := c.AddFunc("0 0 8 * * *", run); err != nil {
		utils.Logger.Error("register cron job failed", "error", err)
	}

	return &Scheduler{cron: c}
}

func (s *Scheduler) Start() {
	s.cron.Start()
	utils.Logger.Info("cron scheduler started, daily scan at 08:00 WIB")
}

func (s *Scheduler) Stop() {
	s.cron.Stop()
}
