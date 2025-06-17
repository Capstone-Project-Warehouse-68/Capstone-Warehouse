package entity

import "gorm.io/gorm"

type UnitPerQuantity struct {
	gorm.Model
	NameOfUnit    string
	Product       []Product       `gorm:"foreignKey:UnitPerQuantityID"`
	ProductOfBill []ProductOfBill `gorm:"foreignKey:UnitPerQuantityID"`
	OrderProduct  []OrderProduct  `gorm:"foreignKey:UnitPerQuantityID"`
}
