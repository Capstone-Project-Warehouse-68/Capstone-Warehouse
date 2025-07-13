package entity

import "gorm.io/gorm"

type Coupon struct {
	gorm.Model
	Code     string		`valid:"required~code is required"`
	Discount float32	`valid:"required~discount is required"`
	Cart     []Cart 	`gorm:"foreignKey:CouponID"`
}
