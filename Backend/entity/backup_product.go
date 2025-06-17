package entity

import (
	"gorm.io/gorm"
)

type BackupProduct struct {
	gorm.Model
	SupplyProductCode string
	ProductCode       string
	ProductName       string
	Description       string
	Picture           string
	Quantity          int
	UnitPerQuantityID uint
	UnitPerQuantity   UnitPerQuantity `gorm:"foreignKey:UnitPerQuantityID"`
	LimitQuantity     int
	SalePrice         float32
	CategoryID        uint
	Category          Category `gorm:"foreignKey:CategoryID"`
	ShelfID           uint
	Shelf             Shelf `gorm:"foreignKey:ShelfID"`

	OrderProduct        []OrderProduct  `gorm:"foreignKey:ProductID"`
	ProductOfBillByID   []ProductOfBill `gorm:"foreignKey:ProductID"`
	ProductOfBillByCode []ProductOfBill `gorm:"foreignKey:SupplyProductCode"`
	CartProduct         []CartProduct   `gorm:"foreignKey:ProductID"`
}
