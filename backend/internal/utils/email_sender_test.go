package utils

import (
	"errors"
	"net/textproto"
	"testing"
)

func TestClassifySMTPErrorMarks5xxPermanent(t *testing.T) {
	err := classifySMTPError(&textproto.Error{Code: 535, Msg: "auth rejected"})
	if !isPermanent(err) {
		t.Fatal("5xx SMTP error should be permanent")
	}
}

func TestClassifySMTPErrorKeeps4xxTransient(t *testing.T) {
	err := classifySMTPError(&textproto.Error{Code: 451, Msg: "try again"})
	if isPermanent(err) {
		t.Fatal("4xx SMTP error should stay retryable")
	}
}

func TestClassifySMTPErrorKeepsPlainErrorsTransient(t *testing.T) {
	err := classifySMTPError(errors.New("network timeout"))
	if isPermanent(err) {
		t.Fatal("plain error should stay retryable")
	}
}

func isPermanent(err error) bool {
	var permanent interface{ Permanent() bool }
	return errors.As(err, &permanent) && permanent.Permanent()
}
