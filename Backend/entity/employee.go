package entity

import "gorm.io/gorm"

type Employee struct {
	gorm.Model
	FirstName         string `valid:"required~FirstName is required"`
	LastName          string `valid:"required~LastName is required"`
	EMPCode        	  string `gorm:"uniqueIndex;not null" valid:"required~EMPCode is required"`
	PhoneNumber		  string `valid:"required~PhoneNumber is required"`
	Email             string `valid:"required~Email is required, email~Email is invalid"`
	Profile			  string `gorm:"type:longtext" valid:"required~Profile is required"`
	Password          string `valid:"required~Password is required"`
	BankAccountNumber string `valid:"required~BankAccountNumber is required"`
	Line              string `valid:"required~Line is required"`
	
	BankTypeID        uint		`valid:"required~BankTypeID is required"`
	BankType          BankType 	`gorm:"foreignKey:BankTypeID"`
	
	RoleID            uint	`valid:"required~RoleID is required"`
	Role              Role 	`gorm:"foreignKey:RoleID"`

	Cart      []Cart      `gorm:"foreignKey:EmployeeID"`
	OrderBill []OrderBill `gorm:"foreignKey:EmployeeID"`
}
