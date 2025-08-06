package controller

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

func GetRole(c *gin.Context) {
	var Role []entity.Role
 
	db := config.DB()
	results := db.Find(&Role)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, Role)
}