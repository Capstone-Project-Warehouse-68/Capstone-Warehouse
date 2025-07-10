package controller

import (
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"github.com/gin-gonic/gin"
	"net/http"
	"gorm.io/gorm"
)

type OrderProduct struct{
	SupplyId uint `json:"supply_id"`
	EmployeeId uint `json:"employee_id"`
	Description string `json:"description "`
	ProductId uint `json:"Product_id"`
	Unit_Per_Quantity_Id uint `json:"unit_per_quantity_id "`
	Quantity int `json:"quantity"`
}

func AddOrderProduct(c *gin.Context) {
	db := config.DB()
	var OrderProductAPI OrderProduct

	// Bind JSON
	if err := c.ShouldBindJSON(&OrderProductAPI); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เกิดข้อผิดพลาดในการผูกข้อมูล"})
		return
	}

	// Check Supply
	var supply entity.Supply
	if err := db.Where("id = ?", OrderProductAPI.SupplyId).First(&supply).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลบริษัทขายส่ง"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// Check Employee
	var employee entity.Employee
	if err := db.Where("id = ?", OrderProductAPI.EmployeeId).First(&employee).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลพนักงาน"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// Check Product
	var product entity.Product
	if err := db.Where("id = ?", OrderProductAPI.ProductId).First(&product).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลสินค้า"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// สร้าง OrderBill
	orderBill := entity.OrderBill{
		Description: OrderProductAPI.Description,
		SupplyID:    OrderProductAPI.SupplyId,
		EmployeeID:  OrderProductAPI.EmployeeId,
	}
	if err := db.Create(&orderBill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง OrderBill ได้"})
		return
	}

	// สร้าง OrderProduct
	orderProduct := entity.OrderProduct{
		ProductID:         OrderProductAPI.ProductId,
		UnitPerQuantityID: OrderProductAPI.Unit_Per_Quantity_Id,
		Quantity:          OrderProductAPI.Quantity,
		OrderBillID:       orderBill.ID,
	}
	if err := db.Create(&orderProduct).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง OrderProduct ได้"})
		return
	}

	// สำเร็จ
	c.JSON(http.StatusOK, gin.H{
		"message":       "เพิ่มคำสั่งซื้อสำเร็จ",
		"order_bill_id": orderBill.ID,
	})
}
