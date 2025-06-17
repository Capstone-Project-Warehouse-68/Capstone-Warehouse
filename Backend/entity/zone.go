package entity

import (
	"gorm.io/gorm"
)

type Zone struct {
	gorm.Model
	ZoneName string
	Shelf    []Shelf `gorm:"foreignKey:ZoneID"`
}
