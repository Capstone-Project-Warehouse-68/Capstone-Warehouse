package entity

import "gorm.io/gorm"

type Category struct {
	gorm.Model
	CategoryName string
	Product      []Product `gorm:"foreignKey:CategoryID"`
}
