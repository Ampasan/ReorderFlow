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

func NewEmailSender(cfg *Config) utils.EmailSender {
	useResend := cfg.EmailProvider == "resend" || (cfg.EmailProvider == "auto" && cfg.ResendAPIKey != "")
	if useResend && cfg.ResendAPIKey == "" {
		utils.Logger.Warn("EMAIL_PROVIDER=resend tanpa RESEND_API_KEY, fallback ke SMTP")
		useResend = false
	}

	if useResend {
		utils.Logger.Info("email provider configured", "provider", "resend", "from", cfg.ResendFrom)
		return utils.NewResendSender(cfg.ResendAPIKey, cfg.ResendFrom)
	}

	utils.Logger.Info("email provider configured", "provider", "smtp", "host", cfg.SMTPHost, "port", cfg.SMTPPort)
	return utils.NewSMTPSender(NewSMTPConfig(cfg))
}
