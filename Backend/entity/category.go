package entity

import "gorm.io/gorm"

type Category struct {
	gorm.Model
	CategoryName string		`valid:"required~CateGoryName is required"`
	Product      []Product `gorm:"foreignKey:CategoryID"`
}
