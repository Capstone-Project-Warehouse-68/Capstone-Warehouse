package controller

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

func GetSupply(c *gin.Context) {
	var supply []entity.Supply
 
	db := config.DB()
	results := db.Find(&supply)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, supply)
}

func CreateSupply(c *gin.Context) {
	var supply entity.Supply

	// Bind JSON
	if err := c.ShouldBindJSON(&supply); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate struct ด้วย govalidator
	if _, err := govalidator.ValidateStruct(supply); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Save to DB
	db := config.DB()
	if err := db.Create(&supply).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusCreated)
}

// UpdateSupply แก้ไขข้อมูล Supply
func UpdateSupply(c *gin.Context) {
	id := c.Param("id") // รับ ID จาก URL

	var supply entity.Supply

	db := config.DB()
	// ตรวจสอบว่ามี Supply ที่ต้องการแก้ไขหรือไม่
	if err := db.First(&supply, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบริษัทสั่งซื้อนี้"})
		return
	}

	// Bind JSON สำหรับข้อมูลใหม่
	if err := c.ShouldBindJSON(&supply); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate struct
	if _, err := govalidator.ValidateStruct(supply); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update ข้อมูล
	if err := db.Save(&supply).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusOK)
}

