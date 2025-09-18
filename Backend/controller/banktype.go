package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

func GetBankType(c *gin.Context) {
	var banktype []entity.BankType

	db := config.DB()
	results := db.Find(&banktype)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, banktype)
}

func CreateBankType(c *gin.Context) {
	var banks []entity.BankType
	if err := c.ShouldBindJSON(&banks); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	for _, bank := range banks {
		var existing entity.BankType
		if err := db.Where("bank_type_name = ?", bank.BankTypeName).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "BankTypeName นี้มีอยู่แล้ว"})
			return
		}
	}

	if err := db.Create(&banks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusCreated)
}

func UpdateBankType(c *gin.Context) {
	id := c.Param("id")
	var bank entity.BankType

	db := config.DB()
	if err := db.First(&bank, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบธนาคาร"})
		return
	}

	var input entity.BankType
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing entity.BankType
	if err := db.Where("bank_type_name = ? AND id <> ?", input.BankTypeName, id).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ชื่อธนาคารนี้มีอยู่แล้ว"})
		return
	}

	bank.BankTypeName = input.BankTypeName
	bank.BankTypePicture = input.BankTypePicture

	if err := db.Save(&bank).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, bank)
}
