package utils

import (
	"encoding/base64"
	"fmt"
	"mime"
	"net/smtp"
	"strings"
)

type SMTPConfig struct {
	Host         string
	Port         int
	Email        string
	Password     string
	ManagerEmail string
}

type EmailSender struct {
	cfg  SMTPConfig
	auth smtp.Auth
}

func NewEmailSender(cfg SMTPConfig) *EmailSender {
	return &EmailSender{
		cfg:  cfg,
		auth: smtp.PlainAuth("", cfg.Email, cfg.Password, cfg.Host),
	}
}

func (s *EmailSender) Send(to, subject, htmlBody string) error {
	msg := s.buildMessage(to, subject, htmlBody, "", nil)
	return smtp.SendMail(s.addr(), s.auth, s.cfg.Email, []string{to}, msg)
}

func (s *EmailSender) SendWithAttachment(to, subject, htmlBody, filename string, attachment []byte) error {
	msg := s.buildMessage(to, subject, htmlBody, filename, attachment)
	return smtp.SendMail(s.addr(), s.auth, s.cfg.Email, []string{to}, msg)
}

func (s *EmailSender) addr() string {
	return fmt.Sprintf("%s:%d", s.cfg.Host, s.cfg.Port)
}

func (s *EmailSender) buildMessage(to, subject, htmlBody, filename string, attachment []byte) []byte {
	var b strings.Builder

	subject = mime.QEncoding.Encode("UTF-8", subject)

	fmt.Fprintf(&b, "From: ReorderFlow <%s>\r\n", s.cfg.Email)
	fmt.Fprintf(&b, "To: <%s>\r\n", to)
	fmt.Fprintf(&b, "Subject: %s\r\n", subject)
	b.WriteString("MIME-Version: 1.0\r\n")

	if attachment == nil {
		b.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
		b.WriteString("\r\n")
		b.WriteString(htmlBody)
		return []byte(b.String())
	}

	const boundary = "reorderflow-boundary"
	fmt.Fprintf(&b, "Content-Type: multipart/mixed; boundary=\"%s\"\r\n", boundary)
	b.WriteString("\r\n")

	fmt.Fprintf(&b, "--%s\r\n", boundary)
	b.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	b.WriteString("\r\n")
	b.WriteString(htmlBody)
	b.WriteString("\r\n")

	fmt.Fprintf(&b, "--%s\r\n", boundary)
	fmt.Fprintf(&b, "Content-Type: application/pdf; name=\"%s\"\r\n", filename)
	fmt.Fprintf(&b, "Content-Disposition: attachment; filename=\"%s\"\r\n", filename)
	b.WriteString("Content-Transfer-Encoding: base64\r\n")
	b.WriteString("\r\n")
	b.WriteString(base64.StdEncoding.EncodeToString(attachment))
	b.WriteString("\r\n")
	fmt.Fprintf(&b, "--%s--\r\n", boundary)

	return []byte(b.String())
}
