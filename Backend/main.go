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

		router.GET("/download-template", controller.DownloadTemplate)

		router.POST("/CreateEmployee", controller.CreateEmployee)
		router.PATCH("/UpdateEmployee/:id", controller.UpdateEmployee)
		router.PATCH("/Employee/:id/EmergencyResetPassword", controller.EmergencyResetPassword)
		router.DELETE("/DeleteEmployee/:id", controller.DeleteEmployee)
		router.GET("/GetAllEmployees", controller.GetAllEmployees)
		router.GET("/GetEmployeeById/:id", controller.GetEmployeeByID)
		router.POST("/CheckEmail/:email", controller.CheckEmail)
		router.POST("/CheckPhone/:phoneNumber", controller.CheckPhone)

		router.GET("/GetRoles", controller.GetRole)
		router.GET("/GetBankTypes", controller.GetBankType)

		router.GET("/GetNumberRole", controller.GetNumberRole)
		router.PATCH("/UpdateNumberRole/:id", controller.UpdateNumberRole)

		router.GET("/getAllBill", controller.GetAllBill)
		router.GET("/Getunitperquantity", controller.GetUnitPerQuantity)
		router.GET("/GetCategory", controller.GetCategory)
		router.GET("/Getshelf", controller.GetShelf)
		router.GET("/GetshelfByzone/:id", controller.GetShelfByZoneID)
		router.GET("/Getzone", controller.GetZone)
		router.GET("/GetSupply", controller.GetSupply)

		router.POST("/CreateProductWithBill", controller.CreateBillWithProducts)
		router.PATCH("/Updatebillwithproduct/:id", controller.UpdateBillWithProducts)
		router.DELETE("/deletebillwithproduct/:id", controller.DeleteBill)

		router.POST("/createunitquantity", controller.CreateUnitPerQuantity)
		router.PATCH("/updateUnitPerQuantity/:id", controller.UpdateUnitPerQuantity)
		router.POST("/CreateCategory", controller.CreateCategory)
		router.PATCH("/UpdateCategory/:id", controller.UpdateCategory)
		router.POST("/createbanktype", controller.CreateBankType)
		router.GET("/getBankType", controller.GetBankType)
		router.PATCH("/updateBank/:id", controller.UpdateBankType)
		router.POST("/CreateSupply", controller.CreateSupply)
		router.PATCH("/UpdateSupply/:id", controller.UpdateSupply)
		router.GET("/getbillalldata/:id", controller.GetBillAllDataByBillID)
		router.GET("/getBillDeleted", controller.GetBillDeleted)

		router.PATCH("/restoreBill", controller.RestoreBills)
		router.PATCH("/updateproduct/:id", controller.UpdateProduct)

		router.POST("/calculate-price", controller.CalculatePriceHandler)

		router.GET("/getproductofbillbyid/:id", controller.GetProductOfBillByProductID)

		controller.StartHardDeleteScheduler()

		r.POST("/signin", controller.SignIn)
		router.GET("/GetLimitQuantity",controller.GetLimitQuantity)
		router.PATCH("/UpdateLimitQuantity", controller.UpdateLimitQuantity)
		router.GET("/notifications", controller.GetLowStockProducts)
		router.GET("/GetShowProduct", controller.GetShowProduct)
		router.GET("/GetProductsforShowlist", controller.GetProductsforShowlist)
		router.GET("/GetProductPDF", controller.GetProductPDF)
		router.POST("/AddOrderBillWithProducts", controller.AddOrderBillWithProducts)
		router.GET("/GetAllOrderBills", controller.GetAllOrderBills)
		router.DELETE("/DeleteOrderBill/:id",controller.DeleteOrderBill)
		router.GET("/GetDashboardSummary", controller.GetDashboardSummary)
		router.GET("/GetDashboardSupplier", controller.GetDashboardSupplier)
		router.GET("/GetDashboardTrend", controller.GetDashboardTrend)
		router.GET("/GetCategoryApi",controller.GetCategoryApi)

		router.POST("/CreateZone", controller.CreateZone)
		router.PATCH("/UpdateZone/:id", controller.UpdateZone)
		router.POST("/CreateShelf", controller.CreateShelf)
		router.PATCH("/UpdateShelf/:id", controller.UpdateShelf)
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
