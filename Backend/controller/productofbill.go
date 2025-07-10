package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

type ProductOfBillResponse struct {
	ID                uint    `json:"ID"`
	SupplyProductCode uint    `json:"SupplyProductCode"`
	ProductID         uint    `json:"ProductID"`
	BillID            uint    `json:"BillID"`
	ManufacturerCode  string  `json:"ManufacturerCode"`
	Quantity          int     `json:"Quantity"`
	PricePerPiece     float32 `json:"PricePerPiece"`
	Discount          float32 `json:"Discount"`
	UnitPerQuantityID uint    `json:"UnitPerQuantityID"`
}

func CreateProductOfBill(c *gin.Context) {
	var ProductOfBilldata ProductOfBillResponse

	if err := c.ShouldBindJSON(&ProductOfBilldata); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ข้อมูลสินค้าในใบสั่งซื้อไม่ถูกต้อง",
		})
		return
	}

	db := config.DB()

	if ProductOfBilldata.UnitPerQuantityID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ไม่พบข้อมูลหน่วย",
		})
		return
	}

	if ProductOfBilldata.SupplyProductCode == 0&ProductOfBilldata.ProductID {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ไม่พบข้อมูลสินค้า",
		})
		return
	}

	if ProductOfBilldata.BillID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ไม่พบข้อมูลใบสั่งซื้อสินค้า",
		})
		return
	}

	ProductOfBill := entity.ProductOfBill{
		SupplyProductCode: ProductOfBilldata.SupplyProductCode,
		ProductID:         ProductOfBilldata.ProductID,
		BillID:            ProductOfBilldata.BillID,
		ManufacturerCode:  ProductOfBilldata.ManufacturerCode,
		Quantity:          ProductOfBilldata.Quantity,
		PricePerPiece:     ProductOfBilldata.PricePerPiece,
		Discount:          ProductOfBilldata.Discount,
		UnitPerQuantityID: ProductOfBilldata.UnitPerQuantityID,
	}

	if err := db.Create(&ProductOfBill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": http.StatusInternalServerError,
			"error":  "ไม่สามารถเพิ่มข้อมูลสินค้าในใบสั่งซื้อได้",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{})

}

func UpdateProductOfBill(c *gin.Context) {
	var ProductOfBilldata ProductOfBillResponse
	ProductID := c.Param("id")

	db := config.DB()
	result := db.First(&ProductOfBilldata, ProductID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลสินค้า"})
		return
	}

	if err := c.ShouldBindJSON(&ProductOfBilldata); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	result = db.Save(&ProductOfBilldata)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "แก้ไขข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "แก้ไขข้อมูลสินค้าสำเร็จ"})
}
