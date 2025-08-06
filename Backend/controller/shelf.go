package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

func GetShelf(c *gin.Context) {
	var shelf []entity.Shelf

	db := config.DB()
	results := db.Preload("Zone").Find(&shelf)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, shelf)
}

func GetShelfByZoneID(c *gin.Context) {
	zoneID := c.Param("id")
	var shelf []entity.Shelf

	db := config.DB()
	results := db.Model(&entity.Shelf{}).Select("id, shelf_name").Where("zone_id = ?", zoneID).Find(&shelf)

	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	if len(shelf) == 0 { 
        c.JSON(http.StatusNoContent, gin.H{"message": "ไม่มีข้อมูล Major สำหรับ facultyID ที่ระบุ"})
        return
    }

	c.JSON(http.StatusOK, shelf)
}
