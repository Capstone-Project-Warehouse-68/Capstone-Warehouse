package entity

import "gorm.io/gorm"

type OrderProduct struct {
	gorm.Model
	ProductID         uint
	Product           Product `gorm:"foreignKey:ProductID"`
	UnitPerQuantityID uint
	UnitPerQuantity   UnitPerQuantity `gorm:"foreignKey:UnitPerQuantityID"`
	Quantity          int
	OrderBillID       uint
	OrderBill         OrderBill `gorm:"foreignKey:OrderBillID"`

    //กรณีสินค้าตัวใหม่ที่เพิ่มลงในใบสั่งซื้อ
	StatusDraft bool `gorm:"default:false"`
	OrderProductDraftID uint
	OrderProductDraft OrderProductDraft `gorm:"foreignkey:OrderProductDraftID"`
}
