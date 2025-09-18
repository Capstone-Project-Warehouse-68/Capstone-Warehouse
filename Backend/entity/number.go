package entity

import "gorm.io/gorm"

type Number struct {
	gorm.Model
	Numb 			  int
	// RoleID         uint	`valid:"required~RoleID is required"`
	RoleID 			  uint  `gorm:"uniqueIndex;not null" valid:"required~RoleID is required"`
	Role              Role 	`gorm:"foreignKey:RoleID"`
}
