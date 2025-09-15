package controller

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

func GetUnitPerQuantity(c *gin.Context) {
	var unit []entity.UnitPerQuantity

	db := config.DB()
	results := db.Find(&unit)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, unit)
}

func CreateUnitPerQuantity(c *gin.Context) {
	var unit entity.UnitPerQuantity

	// ดึงข้อมูลจาก body ของ request
	if err := c.ShouldBindJSON(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if _, err := govalidator.ValidateStruct(unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	if err := db.Create(&unit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ส่งแค่ข้อความสำเร็จ ไม่ต้องส่งข้อมูล unit กลับ
	c.JSON(http.StatusOK, gin.H{
		"message": "สร้างหน่วยสินค้าเรียบร้อย",
	})
}

func UpdateUnitPerQuantity(c *gin.Context) {
	id := c.Param("id") // รับ ID จาก URL

	var unit entity.UnitPerQuantity
	db := config.DB()

	// ตรวจสอบว่ามี Category ที่ต้องการแก้ไขหรือไม่
	if err := db.First(&unit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบหน่วยสินค้านี้"})
		return
	}

	// Bind JSON สำหรับข้อมูลใหม่
	if err := c.ShouldBindJSON(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate struct
	if _, err := govalidator.ValidateStruct(unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update ข้อมูล
	if err := db.Save(&unit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusOK)
}
