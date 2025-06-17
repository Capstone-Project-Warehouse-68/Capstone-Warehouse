package entity

import "gorm.io/gorm"

type BankType struct {
	gorm.Model
	BankTypeName string
	Employee     []Employee `gorm:"foreignKey:BankTypeID"`
	Supply       []Supply   `gorm:"foreignKey:BankTypeID"`
}
