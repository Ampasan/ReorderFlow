package model

import "time"

const (
	RoleAdmin   = "admin"
	RoleManager = "manager"
)

type User struct {
	ID           int64     `gorm:"primaryKey;column:id" json:"id"`
	Email        string    `gorm:"column:email;type:varchar(150);not null;uniqueIndex" json:"email"`
	PasswordHash string    `gorm:"column:password_hash;type:varchar(255);not null" json:"-"`
	Nama         string    `gorm:"column:nama;type:varchar(150)" json:"nama"`
	Role         string    `gorm:"column:role;type:varchar(30);not null;default:admin" json:"role"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"created_at"`
}

func (User) TableName() string { return "users" }

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
