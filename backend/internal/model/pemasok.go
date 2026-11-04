package model

import "time"

type Pemasok struct {
	ID        int64     `gorm:"primaryKey;column:id" json:"id"`
	Nama      string    `gorm:"column:nama;type:varchar(150);not null" json:"nama"`
	Email     string    `gorm:"column:email;type:varchar(150);not null" json:"email"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Pemasok) TableName() string { return "pemasok" }
