package entity

import (
	"time"

	"gorm.io/gorm"
)

type Bill struct {
	gorm.Model
	SupplyID     uint		`valid:"required~SupplyID is required"`
	Supply       Supply `gorm:"foreignKey:SupplyID"`
	DateImport   time.Time	`valid:"required~DateImport is required"`
	SummaryPrice float32	`valid:"required~SummaryPrice is required"`

	ProductOfBill []ProductOfBill `gorm:"foreignKey:BillID"`
}
