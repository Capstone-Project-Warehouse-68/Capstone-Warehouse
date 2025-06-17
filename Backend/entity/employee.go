package entity

import "gorm.io/gorm"

type Employee struct {
	gorm.Model
	FirstName         string
	LastName          string
	NationalID        string
	Email             string
	Password          string
	BankTypeID        uint
	BankType          BankType `gorm:"foreignKey:BankTypeID"`
	BankAccountNumber string
	RoleID            uint
	Role              Role `gorm:"foreignKey:RoleID"`

	Cart      []Cart      `gorm:"foreignKey:EmployeeID"`
	OrderBill []OrderBill `gorm:"foreignKey:EmployeeID"`
}
