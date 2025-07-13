package entity

import (
	"gorm.io/gorm"
)

type Zone struct {
	gorm.Model
	ZoneName string		`valid:"required~ZoneName is required"`
	Shelf    []Shelf 	`gorm:"foreignKey:ZoneID"`
}
