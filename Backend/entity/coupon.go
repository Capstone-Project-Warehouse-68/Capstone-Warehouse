package entity

import "gorm.io/gorm"

type Coupon struct {
	gorm.Model
	Code     string
	Discount float32
	Cart     []Cart `gorm:"foreignKey:CouponID"`
}
