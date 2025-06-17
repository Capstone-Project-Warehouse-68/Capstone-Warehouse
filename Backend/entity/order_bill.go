package entity

import "gorm.io/gorm"

type OrderBill struct {
	gorm.Model
	Description  string
	SupplyID     uint
	Supply       Supply `gorm:"foreignKey:EmployeeID"`
	EmployeeID   uint
	Employee     Employee       `gorm:"foreignKey:EmployeeID"`
	OrderProduct []OrderProduct `gorm:"foreignKey:OrderBillID"`
}
