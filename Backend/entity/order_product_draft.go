package entity

import "gorm.io/gorm"

type OrderProductDraft struct {
    gorm.Model
	ProductDraftName string
	SupplyDraftName string
	UnitDrafName string
    Quantity         int
    CategoryName     string

    OrderProduct []OrderProduct `gorm:"foreignKey:OrderProductDraftID"`
}
