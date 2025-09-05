package controller

import (
	"net/http"

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
