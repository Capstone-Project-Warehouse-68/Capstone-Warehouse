package entity

import "gorm.io/gorm"

type Supply struct {
	gorm.Model
	SupplyName        string
	Address           string
	PhoneNumberSale   string
	SaleName          string
	BankTypeID        uint
	BankType          BankType `gorm:"foreignKey:BankTypeID"`
	BankAccountNumber string
	LineIDSale        string

	OrderBill []OrderBill `gorm:"foreignKey:SupplyID"`
	Bill      []Bill      `gorm:"foreignKey:SupplyID"`
}
