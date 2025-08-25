package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"net/http"
	"time"
)

type BillResponse struct {
	ID           uint      `json:"ID"`
	Title        string    `json:"Title"`
	SupplyName     string      `json:"SupplyName"`
	DateImport   time.Time `json:"DateImport"`
	SummaryPrice float32   `json:"SummaryPrice"`
	EmployeeID   uint      `json:"EmployeeID"`
}

func GetAllBill(c *gin.Context) {
	var bills []entity.Bill

	db := config.DB()
	results := db.Preload("Supply").Preload("Employee").Find(&bills)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, bills)
}

// func CreateBill(c *gin.Context) {
// 	var Billdata BillResponse

// 	if err := c.ShouldBindJSON(&Billdata); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "เกิดข้อผิดพลาดในการส่งข้อมูลใบสั่งซื้อ",
// 		})
// 		return
// 	}

// 	db := config.DB()

// 	if Billdata.SupplyID == 0 {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "ไม่พบข้อมูลบริษัทที่สั่งซื้อ",
// 		})
// 		return
// 	}

// 	BillCreate := entity.Bill{
// 		SupplyID:     Billdata.SupplyID,
// 		DateImport:   Billdata.DateImport,
// 		SummaryPrice: Billdata.SummaryPrice,
// 	}

// 	if err := db.Create(&BillCreate).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"status": http.StatusInternalServerError,
// 			"error":  "ไม่สามารถเพิ่มข้อมูลสินค้าได้",
// 		})
// 		return
// 	}

// 	c.JSON(http.StatusCreated, gin.H{
// 		"data": BillCreate,
// 	})

// }

func UpdateBill(c *gin.Context) {
	var Billdata BillResponse
	BillID := c.Param("id")

	db := config.DB()
	result := db.First(&Billdata, BillID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลใบสั่งซื้อ"})
		return
	}

	if err := c.ShouldBindJSON(&Billdata); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูล"})
		return
	}

	result = db.Save(&Billdata)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "แก้ไขข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "แก้ไขข้อมูลใบสั่งซื้อสำเร็จ"})
}
