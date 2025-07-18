package entity

import "gorm.io/gorm"

type Supply struct {
	gorm.Model
	SupplyName        string	`valid:"required~SupplyName is required"`
	Address           string	`valid:"required~Address is required"`
	PhoneNumberSale   string	`valid:"required~PhoneNumberSale is required"`
	SaleName          string	`valid:"required~SaleName is required"`
	BankTypeID        uint		`valid:"required~BankTypeID is required"`
	BankType          BankType `gorm:"foreignKey:BankTypeID"`
	BankAccountNumber string	`valid:"required~BankAccountNumber is required"`
	LineIDSale        string	`valid:"required~LineIDSale is required"`

	OrderBill []OrderBill `gorm:"foreignKey:SupplyID"`
	Bill      []Bill      `gorm:"foreignKey:SupplyID"`
}
