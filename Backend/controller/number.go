package controller

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

func GetNumberRole(c *gin.Context) {
	var Number []entity.Number
 
	db := config.DB()
	results := db.Preload("Role").Find(&Number)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, Number)
}

func UpdateNumberRole(c *gin.Context) {
	RoleID := c.Param("id")
	var Number entity.Number

	db := config.DB()
	result := db.First(&Number, RoleID)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่มีข้อมูลลำดับงาน"})
		return
	}

	if err := c.ShouldBindJSON(&Number); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูลลำดับงาน"})
		return
	}

	result = db.Save(&Number)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูลลำดับงาน"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "บันทึกลำดับงานเสร็จสิ้น"})
}