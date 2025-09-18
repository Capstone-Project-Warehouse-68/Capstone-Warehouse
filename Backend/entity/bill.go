package entity

import (
	"time"

	"gorm.io/gorm"
)

type Bill struct {
	gorm.Model
	Title        string    `valid:"required~Title is required"`
	SupplyID   uint    `valid:"required~SupplyID is required"`
	Supply       Supply    `gorm:"foreignKey:SupplyID"`
	DateImport   time.Time `valid:"required~DateImport is required"`
	SummaryPrice float32   `valid:"required~SummaryPrice is required"`

	EmployeeID uint     `valid:"required~EmployeeID is required"`
	Employee   Employee `gorm:"foreignKey:EmployeeID"`

	ProductOfBill []ProductOfBill `gorm:"foreignKey:BillID"`
}
