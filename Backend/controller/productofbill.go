package controller

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

type BillResponse struct {
	ID           uint      `json:"ID"`
	Title        string    `json:"Title"`
	SupplyID     uint      `json:"SupplyID"`
	SupplyName   string    `json:"SupplyName"`
	DateImport   time.Time `json:"DateImport"`
	SummaryPrice float32   `json:"SummaryPrice"`
	EmployeeID   uint      `json:"EmployeeID"`
}

type ProductResponse struct {
	ID                uint    `json:"ID"`
	SupplyProductCode string  `json:"SupplyProductCode"`
	ProductCode       string  `json:"ProductCode"`
	ProductName       string  `json:"ProductName"`
	Description       string  `json:"Description"`
	Picture           string  `json:"Picture"`
	Quantity          int     `json:"Quantity"`
	UnitPerQuantityID uint    `json:"UnitPerQuantityID"`
	NameOfUnit        string  `json:"NameOfUnit"`
	LimitQuantity     int     `json:"LimitQuantity"`
	SalePrice         float32 `json:"SalePrice"`
	CategoryID        uint    `json:"CategoryID"`
	ZoneID            uint    `json:"ZoneID"`
	ShelfID           uint    `json:"ShelfID"`
	CategoryName      string  `json:"CategoryName"`
	ShelfName         string  `json:"ShelfName"`
	ZoneName          string  `json:"ZoneName"`

	POBID            uint    `json:"POBID"`
	BillID           uint    `json:"BillID"`
	ManufacturerCode string  `json:"ManufacturerCode"`
	PricePerPiece    float32 `json:"PricePerPiece"`
	Discount         float32 `json:"Discount"`
	SumPriceProduct  float64 `json:"SumPriceProduct"`
}

type ProductOfBillResponse struct {
	ID               uint    `json:"ID"`
	ProductID        uint    `json:"ProductID"`
	BillID           uint    `json:"BillID"`
	ManufacturerCode string  `json:"ManufacturerCode"`
	PricePerPiece    float32 `json:"PricePerPiece"`
	Discount         float32 `json:"Discount"`
	SumPriceProduct  float64 `json:"SumPriceProduct"`
}

type BillAllDataResponse struct {
	ID           uint      `json:"ID"`
	Title        string    `json:"Title"`
	SupplyID     uint      `json:"SupplyID"`
	SupplyName   string    `json:"SupplyName"`
	DateImport   time.Time `json:"DateImport"`
	SummaryPrice float32   `json:"SummaryPrice"`
	EmployeeID   uint      `json:"EmployeeID"`

	Products []ProductResponse `json:"Products" gorm:"-"`
}

func CreateBillWithProducts(c *gin.Context) {
	var req struct {
		Bill           BillResponse
		Products       []ProductResponse
		ProductsOfBill []ProductOfBillResponse
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	tx := db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เริ่ม transaction ไม่ได้"})
		return
	}

	// บันทึก Bill
	bill := entity.Bill{
		Title:        req.Bill.Title,
		SupplyID:     req.Bill.SupplyID,
		DateImport:   req.Bill.DateImport,
		SummaryPrice: req.Bill.SummaryPrice,
		EmployeeID:   req.Bill.EmployeeID,
	}
	if err := tx.Create(&bill).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Bill ไม่สำเร็จ"})
		return
	}

	productIDs := []uint{}
	for i, p := range req.Products {
		product := entity.Product{
			SupplyProductCode: p.SupplyProductCode,
			ProductCode:       p.ProductCode,
			ProductName:       p.ProductName,
			Description:       p.Description,
			Quantity:          p.Quantity,
			UnitPerQuantityID: p.UnitPerQuantityID,
			SalePrice:         p.SalePrice,
			CategoryID:        p.CategoryID,
			ShelfID:           p.ShelfID,
		}

		if err := tx.Create(&product).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Product ไม่สำเร็จ"})
			return
		}
		productIDs = append(productIDs, product.ID)

		calculatedSum := float64(p.PricePerPiece)*float64(p.Quantity) - float64(p.Discount)
		if req.ProductsOfBill[i].SumPriceProduct != calculatedSum {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("บิล %s สินค้า %s: SumPriceProduct ไม่ถูกต้อง (ส่ง %v, ควรเป็น %v)",
					bill.Title, p.ProductName, req.ProductsOfBill[i].SumPriceProduct, calculatedSum),
			})
			return
		}

		// สร้าง ProductOfBill
		productOfBill := entity.ProductOfBill{
			ProductID:        product.ID,
			BillID:           bill.ID,
			ManufacturerCode: req.ProductsOfBill[i].ManufacturerCode,
			PricePerPiece:    req.ProductsOfBill[i].PricePerPiece,
			Discount:         req.ProductsOfBill[i].Discount,
			SumPriceProduct:  req.ProductsOfBill[i].SumPriceProduct,
		}
		if err := tx.Create(&productOfBill).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง ProductOfBill ไม่สำเร็จ"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit transaction ล้มเหลว"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "สร้างบิลและสินค้าเรียบร้อย"})
}

func UpdateBillWithProducts(c *gin.Context) {
	billID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ของ Bill ไม่ถูกต้อง"})
		return
	}

	var req struct {
		Bill           BillResponse
		Products       []ProductResponse
		ProductsOfBill []ProductOfBillResponse
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// --- Log ข้อมูลที่รับมา ---
	log.Printf("=== UpdateBillWithProducts ===")
	log.Printf("Bill ID: %d", billID)
	log.Printf("Bill: %+v", req.Bill)
	for i, p := range req.Products {
		log.Printf("Product[%d]: %+v", i, p)
	}
	for i, pob := range req.ProductsOfBill {
		log.Printf("ProductOfBill[%d]: %+v", i, pob)
	}

	db := config.DB()
	tx := db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เริ่ม transaction ไม่ได้"})
		return
	}

	req.Bill.ID = uint(billID)

	var bill entity.Bill
	if err := tx.First(&bill, req.Bill.ID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Bill"})
		return
	}

	// Update ข้อมูล Bill
	bill.Title = req.Bill.Title
	bill.SupplyID = req.Bill.SupplyID
	bill.DateImport = req.Bill.DateImport
	bill.SummaryPrice = req.Bill.SummaryPrice
	bill.EmployeeID = req.Bill.EmployeeID
	if err := tx.Save(&bill).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Bill ไม่สำเร็จ"})
		return
	}

	// ดึง ProductOfBill เดิม
	var existingPOB []entity.ProductOfBill
	if err := tx.Where("bill_id = ?", bill.ID).Find(&existingPOB).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึง ProductOfBill ไม่สำเร็จ"})
		return
	}
	existingPOBMap := map[uint]entity.ProductOfBill{}
	for _, pob := range existingPOB {
		existingPOBMap[pob.ProductID] = pob
	}

	// Loop Products ใหม่/เดิม
	for i, p := range req.Products {
		var product entity.Product

		// ถ้า Product ID ไม่มีหรือเป็น 0 → สร้างใหม่
		if p.ID == 0 {
			product = entity.Product{
				SupplyProductCode: p.SupplyProductCode,
				ProductCode:       p.ProductCode,
				ProductName:       p.ProductName,
				Description:       p.Description,
				Quantity:          p.Quantity,
				UnitPerQuantityID: p.UnitPerQuantityID,
				SalePrice:         p.SalePrice,
				CategoryID:        p.CategoryID,
				ShelfID:           p.ShelfID,
			}
			if err := tx.Create(&product).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Product ใหม่ไม่สำเร็จ"})
				return
			}
			log.Printf("สร้าง Product ใหม่ ID=%d: %+v", product.ID, product)
		} else {
			// update product เดิม
			if err := tx.First(&product, p.ID).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("ไม่พบ Product ID %d", p.ID)})
				return
			}
			product.ProductName = p.ProductName
			product.Description = p.Description
			product.Quantity = p.Quantity
			product.UnitPerQuantityID = p.UnitPerQuantityID
			product.SalePrice = p.SalePrice
			product.CategoryID = p.CategoryID
			product.ShelfID = p.ShelfID
			if err := tx.Save(&product).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Product ไม่สำเร็จ"})
				return
			}
			log.Printf("อัปเดต Product ID=%d: %+v", product.ID, product)
		}

		// Validate SumPriceProduct
		calculatedSum := float64(p.PricePerPiece)*float64(p.Quantity) - float64(req.ProductsOfBill[i].Discount)
		if req.ProductsOfBill[i].SumPriceProduct != calculatedSum {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("สินค้า %s: SumPriceProduct ไม่ถูกต้อง (ส่ง %v, ควรเป็น %v)",
					p.ProductName, req.ProductsOfBill[i].SumPriceProduct, calculatedSum),
			})
			return
		}

		// Update หรือ Create ProductOfBill
		if existing, ok := existingPOBMap[product.ID]; ok {
			existing.ManufacturerCode = req.ProductsOfBill[i].ManufacturerCode
			existing.PricePerPiece = req.ProductsOfBill[i].PricePerPiece
			existing.Discount = req.ProductsOfBill[i].Discount
			existing.SumPriceProduct = req.ProductsOfBill[i].SumPriceProduct
			if err := tx.Save(&existing).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต ProductOfBill ไม่สำเร็จ"})
				return
			}
			log.Printf("อัปเดต ProductOfBill: %+v", existing)
			delete(existingPOBMap, product.ID)
		} else {
			newPOB := entity.ProductOfBill{
				ProductID:        product.ID,
				BillID:           bill.ID,
				ManufacturerCode: req.ProductsOfBill[i].ManufacturerCode,
				PricePerPiece:    req.ProductsOfBill[i].PricePerPiece,
				Discount:         req.ProductsOfBill[i].Discount,
				SumPriceProduct:  req.ProductsOfBill[i].SumPriceProduct,
			}
			if err := tx.Create(&newPOB).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง ProductOfBill ใหม่ไม่สำเร็จ"})
				return
			}
			log.Printf("สร้าง ProductOfBill ใหม่: %+v", newPOB)
		}
	}

	// ลบ ProductOfBill ที่ไม่อยู่ใน request
	for _, pob := range existingPOBMap {
		if err := tx.Delete(&pob).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบ ProductOfBill เก่าไม่สำเร็จ"})
			return
		}
		log.Printf("ลบ ProductOfBill ID=%d", pob.ID)
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit transaction ล้มเหลว"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตบิลและสินค้าเรียบร้อย"})
}

func DeleteBill(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()
	tx := db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เริ่ม transaction ไม่ได้"})
		return
	}

	// 1. ดึง productIDs ที่เกี่ยวข้องกับ bill นี้ จาก ProductOfBill
	var productIDs []uint
	if err := tx.Model(&entity.ProductOfBill{}).
		Where("bill_id = ?", id).
		Pluck("product_id", &productIDs).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึง ProductID ไม่สำเร็จ"})
		return
	}

	// 2. Soft delete ProductOfBill ที่เกี่ยวข้องกับ Bill
	if err := tx.Where("bill_id = ?", id).Delete(&entity.ProductOfBill{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบ ProductOfBill ไม่สำเร็จ"})
		return
	}

	// 3. Soft delete Bill
	if err := tx.Delete(&entity.Bill{}, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบ Bill ไม่สำเร็จ"})
		return
	}

	// 4. Soft delete Product ที่อยู่ใน productIDs
	if len(productIDs) > 0 {
		if err := tx.Where("id IN ?", productIDs).Delete(&entity.Product{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบ Product ไม่สำเร็จ"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit transaction ล้มเหลว"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลบิลและสินค้าที่เกี่ยวข้องเรียบร้อย (soft delete)"})
}

func GetBillAllDataByBillID(c *gin.Context) {
	billID := c.Param("id")
	db := config.DB()

	// 1. ดึงข้อมูล bill พร้อม join supply
	var bill BillAllDataResponse
	if err := db.Raw(`
		SELECT 
			b.id, b.title, s.supply_name as supply_name , b.date_import, b.summary_price,
			b.employee_id
		FROM bills b
		LEFT JOIN supplies s ON b.supply_id = s.id
		WHERE b.id = ?
	`, billID).Scan(&bill).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if bill.ID == 0 {
		c.JSON(http.StatusNoContent, gin.H{})
		return
	}

	// 2. ดึงข้อมูล products ของ bill
	var products []ProductResponse
	if err := db.Raw(`
		SELECT 
			p.id AS id, 
			p.supply_product_code, 
			p.product_code, 
			p.product_name, 
			p.description, 
			p.picture,
			p.quantity, 
			p.unit_per_quantity_id, 
			u.name_of_unit AS name_of_unit,
			p.limit_quantity, 
			p.sale_price,
			p.category_id, 
			c.category_name AS category_name,
			p.shelf_id, 
			s.shelf_name AS shelf_name,
			z.id as zone_id,
			z.zone_name AS zone_name, 
			pob.id AS pob_id, 
			pob.bill_id, 
			pob.manufacturer_code, 
			pob.price_per_piece, 
			pob.discount,
			pob.sum_price_product
		FROM product_of_bills pob
		LEFT JOIN products p ON pob.product_id = p.id
		LEFT JOIN unit_per_quantities u ON p.unit_per_quantity_id = u.id
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN shelves s ON p.shelf_id = s.id
		LEFT JOIN zones z ON s.zone_id = z.id  
		WHERE pob.bill_id = ?
	`, billID).Scan(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึง product ล้มเหลว"})
		return
	}

	bill.Products = products
	c.JSON(http.StatusOK, bill)
}
