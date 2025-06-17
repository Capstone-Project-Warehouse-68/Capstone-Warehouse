package entity

import (
	"gorm.io/gorm"
)

type Shelf struct {
	gorm.Model
	ShelfName string
	ZoneID    uint
	Zone      Zone      `gorm:"foreignKey:ZoneID"`
	Product   []Product `gorm:"foreignKey:ShelfID"`
}
