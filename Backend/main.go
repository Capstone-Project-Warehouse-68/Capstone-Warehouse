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
	err := godotenv.Load(".env")
	if err != nil {
		log.Println("No .env file found or failed to load")
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

		r.GET("/download-template", controller.DownloadTemplate)

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

		r.GET("/getAllBill", controller.GetAllBill)
		r.GET("/Getunitperquantity", controller.GetUnitPerQuantity)
		r.GET("/GetCategory", controller.GetCategory)
		r.GET("/Getshelf", controller.GetShelf)
		r.GET("/GetshelfByzone/:id", controller.GetShelfByZoneID)
		r.GET("/Getzone", controller.GetZone)
		r.GET("/GetSupply", controller.GetSupply)

		r.POST("/CreateProduct", controller.CreateProduct)
		r.POST("/CreateProductWithBill", controller.CreateBillWithProducts)
		r.PATCH("/Updatebillwithproduct/:id", controller.UpdateBillWithProducts)
		r.DELETE("/deletebillwithproduct/:id", controller.DeleteBill)

		r.POST("/createunitquantity", controller.CreateUnitPerQuantity)
		r.PATCH("/updateUnitPerQuantity/:id", controller.UpdateUnitPerQuantity)
		r.POST("/CreateCategory", controller.CreateCategory)
		r.PATCH("/UpdateCategory/:id", controller.UpdateCategory)
		r.POST("/createbanktype", controller.CreateBankType)
		r.GET("/getBankType", controller.GetBankType)
		r.PATCH("/updateBank/:id", controller.UpdateBankType)
		r.POST("/CreateSupply", controller.CreateSupply)
		r.PATCH("/UpdateSupply/:id", controller.UpdateSupply)
		r.GET("/getbillalldata/:id", controller.GetBillAllDataByBillID)
		r.GET("/getBillDeleted", controller.GetBillDeleted)

		r.PATCH("/restoreBill", controller.RestoreBills)

		controller.StartHardDeleteScheduler()

		r.POST("/signin", controller.SignIn)
		r.GET("/GetLimitQuantity",controller.GetLimitQuantity)
		r.PATCH("/UpdateLimitQuantity", controller.UpdateLimitQuantity)
		r.GET("/notifications", controller.GetLowStockProducts)
		r.GET("/GetShowProduct", controller.GetShowProduct)
		r.GET("/GetProductsforShowlist", controller.GetProductsforShowlist)
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
