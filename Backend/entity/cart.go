package entity

import "gorm.io/gorm"

type Cart struct {
	gorm.Model
	SummaryPrice float32
	EmployeeID   uint
	Employee     Employee `gorm:"foreignKey:EmployeeID"`
	CouponID     uint
	Coupon       Coupon        `gorm:"foreignKey:CouponID"`
	CartProduct  []CartProduct `gorm:"foreignKey:CartID"`
}
