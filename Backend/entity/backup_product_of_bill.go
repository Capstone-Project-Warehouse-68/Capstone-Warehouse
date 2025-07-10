package entity

import "gorm.io/gorm"

type BackupProductOfBill struct {
	gorm.Model
	SupplyProductCode uint
	ProductByCode     Product `gorm:"foreignKey:SupplyProductCode"`
	ProductID         uint
	ProductByID       Product `gorm:"foreignKey:ProductID"`
	BillID         uint
	Bill       Bill `gorm:"foreignKey:BillID"`
	ManufacturerCode  string
	Quantity          int
	PricePerPiece     float32
	Discount          float32
	UnitPerQuantityID uint
	UnitPerQuantity   UnitPerQuantity `gorm:"foreignKey:UnitPerQuantityID"`
}
