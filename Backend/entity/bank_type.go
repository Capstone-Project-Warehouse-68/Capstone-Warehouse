package entity

import "gorm.io/gorm"

type BankType struct {
	gorm.Model
	BankTypePicture string     `gorm:"type:longtext" json:"BankTypePicture"`
	BankTypeName    string     `gorm:"uniqueIndex" json:"BankTypeName"`
	Employee        []Employee `gorm:"foreignKey:BankTypeID"`
	Supply          []Supply   `gorm:"foreignKey:BankTypeID"`
}
