package controller

import (
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

type Limituantity struct {
	ProductID     uint `json:"product_id"`
	LimitQuantity uint `json:"limit_quantity"`
}

func CreateProduct(c *gin.Context) {
	var Productdata ProductResponse

	if err := c.ShouldBindJSON(&Productdata); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "เกิดข้อผิดพลาดในการส่งข้อมูลสินค้า",
		})
		return
	}

	db := config.DB()

	if Productdata.UnitPerQuantityID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ไม่พบข้อมูลหน่วย",
		})
		return
	}

	if Productdata.CategoryID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ไม่พบข้อมูลประเภทสินค้า",
		})
		return
	}

	if Productdata.ShelfID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ไม่พบข้อมูลตำแหน่งของสินค้า",
		})
		return
	}

	Product := entity.Product{
		SupplyProductCode: Productdata.SupplyProductCode,
		ProductCode:       Productdata.ProductCode,
		ProductName:       Productdata.ProductName,
		Description:       Productdata.Description,
		Picture:           Productdata.Picture,
		Quantity:          Productdata.Quantity,
		UnitPerQuantityID: Productdata.UnitPerQuantityID,
		LimitQuantity:     Productdata.LimitQuantity,
		SalePrice:         Productdata.SalePrice,
		CategoryID:        Productdata.CategoryID,
		ShelfID:           Productdata.ShelfID,
	}

	if ok, err := govalidator.ValidateStruct(Product); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Create(&Product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": http.StatusInternalServerError,
			"error":  "ไม่สามารถเพิ่มข้อมูลสินค้าได้",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": Product,
	})

}

func UpdateProduct(c *gin.Context) {
	var Productdata ProductResponse
	ProductID := c.Param("id")

	db := config.DB()
	result := db.First(&Productdata, ProductID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลสินค้า"})
		return
	}

	if err := c.ShouldBindJSON(&Productdata); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูล"})
		return
	}

	result = db.Save(&Productdata)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "แก้ไขข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "แก้ไขข้อมูลสินค้าสำเร็จ"})
}

// func Delete(c *gin.Context) {
// 	ProductID := c.Param("id")

// 	db := config.DB()
// 	tx := db.Begin()

// 	var product entity.Product

// 	// ดึงข้อมูล Lecturer ก่อนลบ
// 	if err := tx.Where("id = ?", ProductID).First(&product).Error; err != nil {
// 		tx.Rollback()
// 		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลสินค้า"})
// 		return
// 	}

// 	if err := tx.Where("product_id = ?", ProductID).Delete(&entity.ProductOfBill{}).Error; err != nil {
// 		tx.Rollback()
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบข้อมูลในตาราง ProductOfBill ได้"})
// 		return
// 	}

// 	if err := tx.Where("product_id = ?", ProductID).Delete(&entity.Bill{}).Error; err != nil {
// 		tx.Rollback()
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบข้อมูลใบสั่ง:nhvได้"})
// 		return
// 	}

// 	if err := tx.Where("id = ?", ProductID).Delete(&entity.Product{}).Error; err != nil {
// 		tx.Rollback()
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบข้อมูลสินค้าได้"})
// 		return
// 	}

// 	// บันทึกลง BackupProduct (หรือ BackupLecturer ถ้าชื่อตารางนั้น)
// 	backup := entity.BackupProduct{
// 		LecturerID:   lecturer.ID,
// 		Name:         lecturer.Name,
// 		Email:        lecturer.Email,
// 		DeletedAt:    time.Now(), // หรือใช้ gorm.DeletedAt
// 		// เพิ่ม field อื่น ๆ ตามที่ BackupProduct มี
// 	}

// 	if err := tx.Create(&backup).Error; err != nil {
// 		tx.Rollback()
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลสำรองได้"})
// 		return
// 	}

// 	tx.Commit()

// 	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลอาจารย์สำเร็จ (Soft Delete พร้อมสำรองข้อมูล)"})
// }

func UpdateLimitQuantity(c *gin.Context) {
	db := config.DB()
	var LimituantityAPI Limituantity

	if err := c.ShouldBindJSON(&LimituantityAPI); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	var product entity.Product
	if err := db.First(&product, LimituantityAPI.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบสินค้า"})
		return
	}

	// อัปเดตค่า LimitQuantity
	product.LimitQuantity = int(LimituantityAPI.LimitQuantity)
	if err := db.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดต LimitQuantity ได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": 200,
		"message":        "อัปเดต LimitQuantity สำเร็จ",
		"product_id":     product.ID,
		"limit_quantity": product.LimitQuantity,
	})
}


func GetLimitQuantity(c *gin.Context) {
	type LimitQuantity struct {
		ProductID        uint      `json:"product_id"`
		LimitQuantity    uint      `json:"limit_quantity"`
		ProductCode      string    `json:"product_code"`
		ProductName      string    `json:"product_name"`
		SupplierName     string    `json:"supplier_name"`
		UnitPerQuantity  string    `json:"unit_per_quantity"`
		ProductUpdatedAt time.Time `json:"product_updated_at"`
		Quantity          uint		`json:"quantity"`
		CategoryName     string    `json:"category_name"`

	}
	db := config.DB()
	var limitQuantities []LimitQuantity
	
	query := `
			SELECT 
				p.id AS product_id,
				p.product_code AS product_code,
				p.product_name AS product_name,
				s.supply_name AS supplier_name,
				p.limit_quantity AS limit_quantity,
				upq.name_of_unit AS unit_per_quantity,
				p.updated_at AS product_updated_at,
				p.quantity AS quantity,
				c.category_name AS category_name
			FROM 
				products p
			JOIN 
				product_of_bills pob ON pob.product_id = p.id
			JOIN 
				bills b ON pob.bill_id = b.id
			JOIN 
				supplies s ON b.supply_id = s.id
			JOIN 
				unit_per_quantities upq ON p.unit_per_quantity_id = upq.id
			INNER JOIN
				categories c ON p.category_id = c.id
			GROUP BY
				p.id, p.product_code, p.product_name, s.supply_name, p.limit_quantity, upq.name_of_unit, p.created_at, p.quantity ,c.category_name
	`

	if err := db.Raw(query).Scan(&limitQuantities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ดึงข้อมูลล้มเหลว: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
    "data": limitQuantities,
	})
}


func GetLowStockProducts(c *gin.Context) {
	db := config.DB()

	var products []entity.Product

	if err := db.Preload("UnitPerQuantity").Where("quantity < limit_quantity").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลสินค้าได้"})
		return
	}

	// ส่งเฉพาะข้อมูลที่จำเป็น
	var notifications []map[string]interface{}
	for _, p := range products {
		notifications = append(notifications, map[string]interface{}{
			"product_id":   p.ID,
			"product_name": p.ProductName,
			"quantity":     p.Quantity,
		})
	}

	c.JSON(http.StatusOK, notifications)
}


func GetShowProduct(c *gin.Context) {
	type ShowProductResponse struct {
		ID                uint    `json:"ID"`
		ProductCode       string  `json:"ProductCode"`
		ProductName       string  `json:"ProductName"`
		Quantity          int     `json:"Quantity"`
		NameOfUnit	   string  `json:"NameOfUnit"`
		SupplyProductCode string  `json:"SupplyProductCode"`
		SupplyName	   string  `json:"SupplyName"`
		Shelf        string  `json:"Shelf"`
		Zone 	  string  `json:"Zone"`
		UpdatedAt        time.Time `json:"UpdatedAt"`
		Description       string  `json:"Description"`
	}
	db := config.DB()

	var products []ShowProductResponse

	query := `
	SELECT 
		p.id,
		p.product_code,
		p.product_name,
		p.quantity,
		u.name_of_unit,
		p.supply_product_code,
		su.supply_name,
		sh.shelf_name AS shelf,
		z.zone_name AS zone,
		p.updated_at,
		p.description
	FROM products p
	LEFT JOIN unit_per_quantities u ON p.unit_per_quantity_id = u.id
	LEFT JOIN shelves sh ON p.shelf_id = sh.id
	LEFT JOIN zones z ON sh.zone_id = z.id
	LEFT JOIN product_of_bills pob ON pob.supply_product_code = p.supply_product_code
	LEFT JOIN bills b ON pob.bill_id = b.id
	LEFT JOIN supplies su ON b.supply_id = su.id
	GROUP BY p.id, u.name_of_unit, su.supply_name, sh.shelf_name, z.zone_name
	ORDER BY p.id DESC
	`

	if err := db.Raw(query).Scan(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลสินค้าได้"})
		return
	}

	c.JSON(http.StatusOK, products)
}

func GetProductsforShowlist(c *gin.Context) {
    db := config.DB()

    type ProductResponse struct {
        ID                uint      `json:"ID"`
        ProductCode       string    `json:"ProductCode"`
        ProductName       string    `json:"ProductName"`
        Quantity          int       `json:"Quantity"`
        NameOfUnit        string    `json:"NameOfUnit"`
        SupplyProductCode string    `json:"SupplyProductCode"`
        SupplyName        string    `json:"SupplyName"`
        Shelf             string    `json:"Shelf"`
        Zone              string    `json:"Zone"`
        UpdatedAt         time.Time `json:"UpdatedAt"`
        Description       string    `json:"Description"`
        CategoryName      string    `json:"CategoryName"`
    }

    var result []ProductResponse

    // Subquery: เลือก supply ล่าสุดต่อ product
    latestSupplySubquery := db.
        Table("product_of_bills pob").
        Select("pob.product_id, sup.supply_name").
        Joins("JOIN bills b ON b.id = pob.bill_id").
        Joins("JOIN supplies sup ON sup.id = b.supply_id").
        Where("pob.id IN (SELECT MAX(id) FROM product_of_bills GROUP BY product_id)")

    // Main query
    err := db.Table("products p").
        Select(`
            p.id,
            p.product_code,
            p.product_name,
            p.quantity,
            COALESCE(u.name_of_unit, '') AS name_of_unit,
            p.supply_product_code,
            COALESCE(ls.supply_name, '') AS supply_name,
            COALESCE(s.shelf_name, '') AS shelf,
            COALESCE(z.zone_name, '') AS zone,
            p.updated_at,
            COALESCE(p.description, '') AS description,
            COALESCE(c.category_name, '') AS category_name
        `).
        Joins("LEFT JOIN unit_per_quantities u ON u.id = p.unit_per_quantity_id").
        Joins("LEFT JOIN shelves s ON s.id = p.shelf_id").
        Joins("LEFT JOIN zones z ON z.id = s.zone_id").
        Joins("LEFT JOIN categories c ON c.id = p.category_id").
        Joins("LEFT JOIN (?) AS ls ON ls.product_id = p.id", latestSupplySubquery).
        Scan(&result).Error

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "ดึงข้อมูลล้มเหลว: " + err.Error(),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": result})
}




func GetProductPDF(c *gin.Context) {
	type ProductReport struct {
		Number  uint `json:"number"`
		ProductID           int       `json:"product_id"`
		SupplyProductCode  string    `json:"supply_product_code"`
		ProductName  string    `json:"product_name"`
		Quantity     int       `json:"quantity"`
		NameOfUnit  string    `json:"name_of_unit"`
		SupplyName   string    `json:"supply_name"`
		DateImport   time.Time `json:"date_import"`
		CategoryName      string    `json:"category_name"`
	}

	db := config.DB()

	var results []ProductReport

	err := db.Raw(`
		SELECT 
			ROW_NUMBER() OVER (ORDER BY p.id) AS number,
			p.id as product_id,
			p.supply_product_code,
			p.product_name,
			p.quantity,
			u.name_of_unit,
			s.supply_name,
			b.date_import,
			c.category_name
		FROM products p
		LEFT JOIN product_of_bills pob ON pob.product_id = p.id
		LEFT JOIN bills b ON b.id = pob.bill_id
		LEFT JOIN supplies s ON s.id = b.supply_id
		LEFT JOIN categories c ON c.id = p.category_id
		LEFT JOIN unit_per_quantities u ON u.id = p.unit_per_quantity_id
	`).Scan(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}

//สำหรับแดชบอร์ด
type ( 
	SummaryReport struct {
		MonthTotal float64 `json:"month_total"`
		YearTotal  float64 `json:"year_total"`
	}
	SupplierReport struct {
		SupplyName string  `json:"supply_name"`
		Total      float64 `json:"total"`
	}
	TrendReport struct {
		Month int     `json:"month"`
		Total float64 `json:"total"`
	}
)
// Summary
func GetDashboardSummary(c *gin.Context) {
	db := config.DB()

	year := c.Query("year")
	month := c.Query("month") // optional

	var result SummaryReport

	// ปี
	var yearSum *float64
	if err := db.Table("bills").
		Select("COALESCE(SUM(summary_price), 0)").
		Where("EXTRACT(YEAR FROM date_import) = ?", year).
		Scan(&yearSum).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if yearSum != nil {
		result.YearTotal = *yearSum
	}

	// เดือน (ถ้ามี)
	if month != "" {
		var monthSum *float64
		if err := db.Table("bills").
			Select("COALESCE(SUM(summary_price), 0)").
			Where("EXTRACT(YEAR FROM date_import) = ? AND EXTRACT(MONTH FROM date_import) = ?", year, month).
			Scan(&monthSum).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if monthSum != nil {
			result.MonthTotal = *monthSum
		}
	}

	c.JSON(http.StatusOK, result)
}



// Supplier
func GetDashboardSupplier(c *gin.Context) {
	db := config.DB()

	year := c.Query("year")
	month := c.Query("month")

	var results []SupplierReport

	query := db.Table("bills").
		Select("supplies.supply_name, SUM(bills.summary_price) as total").
		Joins("JOIN supplies ON supplies.id = bills.supply_id").
		Where("EXTRACT(YEAR FROM bills.date_import) = ?", year)

	if month != "" {
		query = query.Where("EXTRACT(MONTH FROM bills.date_import) = ?", month)
	}

	if err := query.Group("supplies.supply_name").
		Having("SUM(bills.summary_price) > 0"). // <- filter ออกถ้าไม่มียอด
		Order("total DESC").
		Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}


// Trend
func GetDashboardTrend(c *gin.Context) {
	db := config.DB()

	year := c.Query("year")
	var results []TrendReport

	if err := db.Table("bills").
		Select("EXTRACT(MONTH FROM date_import) AS month, SUM(summary_price) AS total").
		Where("EXTRACT(YEAR FROM date_import) = ?", year).
		Group("month").
		Order("month").
		Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}
