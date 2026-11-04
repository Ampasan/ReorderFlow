package config

import "reorderflow-backend/internal/utils"

func NewSMTPConfig(cfg *Config) utils.SMTPConfig {
	return utils.SMTPConfig{
		Host:         cfg.SMTPHost,
		Port:         cfg.SMTPPort,
		Email:        cfg.SMTPEmail,
		Password:     cfg.SMTPPassword,
		ManagerEmail: cfg.ManagerEmail,
	}
}
