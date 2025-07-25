package entity

import (
	"gorm.io/gorm"
)

type Product struct {
	gorm.Model
	SupplyProductCode string	`valid:"required~SupplyProductCode is required"`
	ProductCode       string	`valid:"required~ProductCode is required"`
	ProductName       string	`valid:"required~ProductName is required"`
	Description       string	`valid:"required~Description is required"`
	Picture           string	
	Quantity          int		`valid:"required~Quantity is required"`
	UnitPerQuantityID uint		`valid:"required~UnitPerQuantityID is required"`
	UnitPerQuantity   UnitPerQuantity `gorm:"foreignKey:UnitPerQuantityID"`
	LimitQuantity     int		`valid:"required~LimitQuantity is required"`
	SalePrice         float32	`valid:"required~SalePrice is required"`
	CategoryID        uint		`valid:"required~CategoryID is required"`
	Category          Category `gorm:"foreignKey:CategoryID"`
	ShelfID           uint		`valid:"required~ShelfID is required"`
	Shelf             Shelf `gorm:"foreignKey:ShelfID"`

	OrderProduct        []OrderProduct  `gorm:"foreignKey:ProductID"`
	ProductOfBillByID   []ProductOfBill `gorm:"foreignKey:ProductID"`
	ProductOfBillByCode []ProductOfBill `gorm:"foreignKey:SupplyProductCode"`
	CartProduct         []CartProduct   `gorm:"foreignKey:ProductID"`
}
