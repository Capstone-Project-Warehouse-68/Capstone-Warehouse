package entity

import "gorm.io/gorm"

type ProductOfBill struct {
	gorm.Model
	SupplyProductCode uint
	ProductByCode     Product `gorm:"foreignKey:SupplyProductCode"`
	ProductID         uint
	ProductByID       Product `gorm:"foreignKey:ProductID"`
	ManufacturerCode  string
	Quantity          int
	PricePerPiece     float32
	Discount          float32
	UnitPerQuantityID uint
	UnitPerQuantity   UnitPerQuantity `gorm:"foreignKey:UnitPerQuantityID"`
}
