package entity

import (
	"gorm.io/gorm"
)

type Shelf struct {
	gorm.Model
	ShelfName string 	`valid:"required~ShelfName is required"`
	ZoneID    uint		`valid:"required~ZoneID is required"`
	Zone      Zone      `gorm:"foreignKey:ZoneID"`
	Product   []Product `gorm:"foreignKey:ShelfID"`
}
