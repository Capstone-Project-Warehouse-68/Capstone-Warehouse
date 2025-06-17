package entity

import "gorm.io/gorm"

type CartProduct struct {
	gorm.Model

	CartID        uint
	Cart          Cart `gorm:"foreignKey:CartID"`
	ProductID     uint
	Product       Product `gorm:"foreignKey:ProductID"`
	Quantity      int
	PricePerPiece float32
}
