package controller

import (
	"net/http"
	// "time"

	// "github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)



type getSupplyResponse struct {
	ID         uint   `json:"ID"`
	SupplyName string `json:"SupplyName"`
}

func GetSupply(c *gin.Context) {
	var supplies []entity.Supply

	db := config.DB()
	results := db.Find(&supplies)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	// map เฉพาะ field ที่ต้องการ
	var response []getSupplyResponse
	for _, s := range supplies {
		response = append(response, getSupplyResponse{
			ID:         s.ID,
			SupplyName: s.SupplyName,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}
