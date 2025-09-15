package entity

import "gorm.io/gorm"

type ProductOfBill struct {
	gorm.Model
	ProductID         uint
	ProductByID       Product `gorm:"foreignKey:ProductID"`
	BillID         uint
	Bill       Bill `gorm:"foreignKey:BillID"`
	ManufacturerCode  string
	PricePerPiece     float32
	Discount          float32
}
	