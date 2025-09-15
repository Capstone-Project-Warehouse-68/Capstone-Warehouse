package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/controller"
	"github.com/project_capstone/WareHouse/middlewares"
	"github.com/joho/godotenv"
	"log"
)

const PORT = "8000"

func main() {
	// โหลด .env จาก folder ปัจจุบัน (Backend/)
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found (using container environment variables)")
	}
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
		r.POST("/signin", controller.SignIn)
		r.GET("/GetLimitQuantity",controller.GetLimitQuantity)
		r.PATCH("/UpdateLimitQuantity", controller.UpdateLimitQuantity)
		r.GET("/notifications", controller.GetLowStockProducts)
		r.GET("/GetShowProduct", controller.GetShowProduct)
		r.GET("/GetProductsforShowlist", controller.GetProductsforShowlist)
		r.GET("/GetCategoryApi", controller.GetCategoryApi)
		r.GET("/GetProductPDF", controller.GetProductPDF)
		r.POST("/AddOrderBillWithProducts", controller.AddOrderBillWithProducts)
		r.GET("/GetAllOrderBills", controller.GetAllOrderBills)
		r.DELETE("/DeleteOrderBill/:id",controller.DeleteOrderBill)
		// r.PATCH("/UpdateOrderBill:id",controller.UpdateOrderBill)
		r.GET("/GetDashboardSummary", controller.GetDashboardSummary)
		r.GET("/GetDashboardSupplier", controller.GetDashboardSupplier)
		r.GET("/GetDashboardTrend", controller.GetDashboardTrend)
		router.Use(middlewares.Authorizes())
	}

	r.GET("/", func(c *gin.Context) {
        c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
    })

    // Run the server
    r.Run("0.0.0.0:" + PORT)
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
 