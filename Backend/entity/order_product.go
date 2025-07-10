package entity

import "gorm.io/gorm"

type OrderProduct struct {
	gorm.Model
	ProductID         uint
	Product           Product `gorm:"foreignKey:ProductID"`
	UnitPerQuantityID uint
	UnitPerQuantity   UnitPerQuantity `gorm:"foreignKey:UnitPerQuantityID"`
	Quantity          int
	OrderBillID       uint
	OrderBill         OrderBill `gorm:"foreignKey:OrderBillID"`
}
