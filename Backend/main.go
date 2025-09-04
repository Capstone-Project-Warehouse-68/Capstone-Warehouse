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
	r.POST("/signin", controller.SignIn)

	router := r.Group("/")
	router.Use(middlewares.Authorizes())
	{		
		router.POST("/CreateEmployee", controller.CreateEmployee)
		router.PATCH("/UpdateEmployee/:id", controller.UpdateEmployee)
		router.DELETE("/DeleteEmployee/:id", controller.DeleteEmployee)
		router.GET("/GetAllEmployees", controller.GetAllEmployees)
		router.GET("/GetEmployeeById/:id",controller.GetEmployeeByID)
		
		router.GET("/getAllBill", controller.GetAllBill)
		router.GET("/Getunitperquantity", controller.GetUnitPerQuantity)
		router.GET("/GetCategory", controller.GetCategory)
		router.GET("/Getshelf", controller.GetShelf)
		router.GET("/GetshelfByzone/:id", controller.GetShelfByZoneID)
		router.GET("/Getzone", controller.GetZone)
		router.GET("/GetSupply", controller.GetSupply)
		router.POST("/CreateProduct", controller.CreateProduct)
		router.POST("/CreateProductWithBill", controller.CreateBillWithProducts)
		router.PATCH("/Updatebillwithproduct", controller.UpdateBillWithProducts)
		router.DELETE("/deletebillwithproduct/:id", controller.DeleteBill)
		router.GET("/GetLimitQuantity",controller.GetLimitQuantity)
		router.PATCH("/UpdateLimitQuantity", controller.UpdateLimitQuantity)
		router.GET("/notifications", controller.GetLowStockProducts)
		router.GET("/GetShowProduct", controller.GetShowProduct)
		router.GET("/GetProductsforShowlist", controller.GetProductsforShowlist)
		router.GET("/GetCategoryApi", controller.GetCategoryApi)
		router.GET("/GetProductPDF", controller.GetProductPDF)
		router.POST("/AddOrderBillWithProducts", controller.AddOrderBillWithProducts)
		router.GET("/GetAllOrderBills", controller.GetAllOrderBills)
		// r.PATCH("/UpdateOrderBill:id",controller.UpdateOrderBill)
		router.GET("/GetDashboardSummary", controller.GetDashboardSummary)
		router.GET("/GetDashboardSupplier", controller.GetDashboardSupplier)
		router.GET("/GetDashboardTrend", controller.GetDashboardTrend)
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
 