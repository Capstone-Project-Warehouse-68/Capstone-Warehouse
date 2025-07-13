package entity

import "gorm.io/gorm"

type UnitPerQuantity struct {
	gorm.Model
	NameOfUnit    string		  `valid:"required~NameOfUnit is required"`
	Product       []Product       `gorm:"foreignKey:UnitPerQuantityID"`
	ProductOfBill []ProductOfBill `gorm:"foreignKey:UnitPerQuantityID"`
	OrderProduct  []OrderProduct  `gorm:"foreignKey:UnitPerQuantityID"`
}
