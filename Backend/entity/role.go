package entity

import "gorm.io/gorm"

type Role struct {
	gorm.Model
	RoleName string
	RoleNickName string
	Employee []Employee `gorm:"foreignKey:RoleID"`
	Number []Number `gorm:"foreignKey:RoleID"`
}
