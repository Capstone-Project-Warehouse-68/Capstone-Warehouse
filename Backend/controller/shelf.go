package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"github.com/asaskevich/govalidator"
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

type ShelfRequest struct {
    ShelfName string `json:"ShelfName" valid:"required~ShelfName is required"`
    ZoneID    uint   `json:"ZoneID" valid:"required~ZoneID is required"`
}

func CreateShelf(c *gin.Context) {
    var req ShelfRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if _, err := govalidator.ValidateStruct(req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    db := config.DB()

    // ตรวจสอบ ZoneID
    var zone entity.Zone
    if err := db.First(&zone, req.ZoneID).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Zone not found"})
        return
    }

    shelf := entity.Shelf{
        ShelfName: req.ShelfName,
        ZoneID:    req.ZoneID,
    }

    if err := db.Create(&shelf).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, shelf)
}

func UpdateShelf(c *gin.Context) {
    id := c.Param("id")
    var shelf entity.Shelf
    db := config.DB()

    if err := db.First(&shelf, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Shelf not found"})
        return
    }

    var req ShelfRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if _, err := govalidator.ValidateStruct(req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Update fields
    shelf.ShelfName = req.ShelfName
    shelf.ZoneID = req.ZoneID

    if err := db.Save(&shelf).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, shelf)
}
