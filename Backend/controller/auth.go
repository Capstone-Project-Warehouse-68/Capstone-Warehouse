package controller

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"github.com/project_capstone/WareHouse/services"
)

type (
	Authen struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
)

func SignIn(c *gin.Context) {
	var payload Authen
	var employee entity.Employee

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	employeeFound := config.DB().Where("email = ?", payload.Email).First(&employee).Error == nil

	if !employeeFound  {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ email นี้ในระบบ"})
		return
	}

	var err error
	if employeeFound {
		err = bcrypt.CompareHashAndPassword([]byte(employee.Password), []byte(payload.Password))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสผ่านไม่ถูกต้อง (employee)"})
			return
		}

		jwtWrapper := services.JwtWrapper{
			SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
			Issuer:          "AuthService",
			ExpirationHours: 24,
		}

		signedToken, err := jwtWrapper.GenerateToken(employee.Email)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
			return
		}

		expirationTime := time.Now().Add(time.Hour * time.Duration(jwtWrapper.ExpirationHours)).Unix()

		c.JSON(http.StatusOK, gin.H{
			"token_type":      "Bearer",
			"role":				employee.RoleID,
			"token":           	signedToken,
			"employeeID":      	employee.ID,
			"token_expiration": expirationTime,
		})
	}
}