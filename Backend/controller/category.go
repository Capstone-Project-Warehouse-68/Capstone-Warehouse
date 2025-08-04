package controller

import (
	"net/http"
	// "time"

	// "github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	// "github.com/project_capstone/WareHouse/entity"
)

type getCategoryResponse struct {
	ID          uint      `json:"id"`
	CategoryName string `json:"category_name"`
}


func GetCategory(c *gin.Context) {
	db := config.DB()
	var categories []getCategoryResponse
	query := `
			SELECT id, category_name FROM categories	
	`
	if err := db.Raw(query).Scan(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ดึงข้อมูลล้มเหลว: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
    "data": categories,
	})

}