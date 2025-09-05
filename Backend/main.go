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
		r.DELETE("/DeleteEmployee/:id", controller.DeleteEmployee)
		r.GET("/GetAllEmployees", controller.GetAllEmployees)
		r.GET("/GetEmployeeById/:id",controller.GetEmployeeByID)
		
		r.GET("/getAllBill", controller.GetAllBill)
		r.GET("/Getunitperquantity", controller.GetUnitPerQuantity)
		r.GET("/GetCategory", controller.GetCategory)
		r.GET("/Getshelf", controller.GetShelf)
		r.GET("/GetshelfByzone/:id", controller.GetShelfByZoneID)
		r.GET("/Getzone", controller.GetZone)
		r.GET("/GetSupply", controller.GetSupply)
		r.POST("/CreateProduct", controller.CreateProduct)
		r.POST("/CreateProductWithBill", controller.CreateBillWithProducts)
		r.PATCH("/Updatebillwithproduct", controller.UpdateBillWithProducts)
		r.DELETE("/deletebillwithproduct/:id", controller.DeleteBill)
		r.POST("/createunitquantity", controller.CreateUnitPerQuantity)
		r.POST("/createbanktype", controller.CreateBankType)
		r.GET("/getBankType", controller.GetBankType)
		r.DELETE("/deleteBank/:id", controller.DeleteBankType)
		r.PATCH("/updateBank/:id", controller.UpdateBankType)
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
 