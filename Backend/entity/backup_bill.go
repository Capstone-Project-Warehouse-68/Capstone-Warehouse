package entity

import (
	"time"

	"gorm.io/gorm"
)

type BackupBill struct {
	gorm.Model
	SupplyID     uint
	Supply       Supply `gorm:"foreignKey:SupplyID"`
	DateImport   time.Time
	SummaryPrice float32

	ProductOfBill []ProductOfBill `gorm:"foreignKey:BillID"`
}
