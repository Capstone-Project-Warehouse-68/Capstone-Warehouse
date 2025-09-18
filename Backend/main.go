package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/controller"
	"github.com/project_capstone/WareHouse/middlewares"
)

const PORT = "8000"

func main() {
	// open connection database
	config.ConnectionDB()

	// Generate databases
	config.SetupDatabase()

	r := gin.Default()
	r.Use(CORSMiddleware())

	router := r.Group("/")
	{
		router.Use(middlewares.Authorizes())

		r.POST("/CreateEmployee", controller.CreateEmployee)
		r.PATCH("/UpdateEmployee/:id", controller.UpdateEmployee)
		r.PATCH("/Employee/:id/EmergencyResetPassword", controller.EmergencyResetPassword)
		r.DELETE("/DeleteEmployee/:id", controller.DeleteEmployee)
		r.GET("/GetAllEmployees", controller.GetAllEmployees)
		r.GET("/GetEmployeeById/:id", controller.GetEmployeeByID)
		r.POST("/CheckEmail/:email", controller.CheckEmail)
		r.POST("/CheckPhone/:phoneNumber", controller.CheckPhone)

		r.GET("/GetRoles", controller.GetRole)
		r.GET("/GetBankTypes", controller.GetBankType)

		r.GET("/GetNumberRole", controller.GetNumberRole)
		r.PATCH("/UpdateNumberRole/:id", controller.UpdateNumberRole)

		r.POST("/CreateProduct", controller.CreateProduct)
		r.POST("/signin", controller.SignIn)
		router.Use(middlewares.Authorizes())
	}

	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// Run the server
	r.Run("localhost:" + PORT)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
