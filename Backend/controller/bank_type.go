package controller

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

func GetBankType(c *gin.Context) {
	var BankType []entity.BankType
 
	db := config.DB()
	results := db.Find(&BankType)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, BankType)
}