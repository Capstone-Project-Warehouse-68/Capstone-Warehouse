package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

func GetCategory(c *gin.Context) {
	var category []entity.Category
 
	db := config.DB()
	results := db.Find(&category)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, category)
}

type getCategoryResponse struct {
	ID          uint      `json:"id"`
	CategoryName string `json:"category_name"`
}


func GetCategoryApi(c *gin.Context) {
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