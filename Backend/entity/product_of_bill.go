package entity

import "gorm.io/gorm"

type ProductOfBill struct {
	gorm.Model
	ProductID        uint
	ProductByID      Product `gorm:"foreignKey:ProductID"`
	ProductCode      string
	BillID           uint
	Bill             Bill `gorm:"foreignKey:BillID"`
	ManufacturerCode string
	Quantity         int // Quantity ที่บิลนั้นนำเข้า
	PricePerPiece    float32
	Discount         float32
	SumPriceProduct  float64
}
