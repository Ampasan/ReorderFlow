package utils

import (
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"mime"
	"net"
	"net/smtp"
	"net/textproto"
	"strings"
	"time"
)

const (
	smtpDialTimeout = 10 * time.Second
	smtpSendTimeout = 15 * time.Second
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

type permanentSMTPError struct {
	err error
}

func (e *permanentSMTPError) Error() string   { return e.err.Error() }
func (e *permanentSMTPError) Unwrap() error   { return e.err }
func (e *permanentSMTPError) Permanent() bool { return true }

func NewEmailSender(cfg SMTPConfig) *EmailSender {
	return &EmailSender{
		cfg:  cfg,
		auth: smtp.PlainAuth("", cfg.Email, cfg.Password, cfg.Host),
	}
}

func (s *EmailSender) Send(to, subject, htmlBody string) error {
	if strings.TrimSpace(to) == "" {
		return &permanentSMTPError{errors.New("alamat email tujuan kosong")}
	}
	msg := s.buildMessage(to, subject, htmlBody, "", nil)
	return s.sendMail(to, msg)
}

func (s *EmailSender) SendWithAttachment(to, subject, htmlBody, filename string, attachment []byte) error {
	if strings.TrimSpace(to) == "" {
		return &permanentSMTPError{errors.New("alamat email tujuan kosong")}
	}
	msg := s.buildMessage(to, subject, htmlBody, filename, attachment)
	return s.sendMail(to, msg)
}

func (s *EmailSender) addr() string {
	return fmt.Sprintf("%s:%d", s.cfg.Host, s.cfg.Port)
}

func (s *EmailSender) sendMail(to string, msg []byte) error {
	conn, err := net.DialTimeout("tcp", s.addr(), smtpDialTimeout)
	if err != nil {
		return fmt.Errorf("dial smtp: %w", err)
	}
	defer conn.Close()

	if err := conn.SetDeadline(time.Now().Add(smtpSendTimeout)); err != nil {
		return err
	}

	client, err := smtp.NewClient(conn, s.cfg.Host)
	if err != nil {
		return fmt.Errorf("smtp client: %w", err)
	}
	defer client.Close()

	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{ServerName: s.cfg.Host}); err != nil {
			return fmt.Errorf("starttls: %w", err)
		}
	}

	if err := client.Auth(s.auth); err != nil {
		return classifySMTPError(err)
	}
	if err := client.Mail(s.cfg.Email); err != nil {
		return classifySMTPError(err)
	}
	if err := client.Rcpt(to); err != nil {
		return classifySMTPError(err)
	}

	writer, err := client.Data()
	if err != nil {
		return classifySMTPError(err)
	}
	if _, err := writer.Write(msg); err != nil {
		_ = writer.Close()
		return fmt.Errorf("smtp write: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("smtp close data: %w", err)
	}

	_ = client.Quit()
	return nil
}

func classifySMTPError(err error) error {
	var protocolErr *textproto.Error
	if errors.As(err, &protocolErr) && protocolErr.Code >= 500 {
		return &permanentSMTPError{err}
	}
	return err
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
