package controller

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"gorm.io/gorm"
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
	ProductName       string  `json:"ProductName"`
	Description       string  `json:"Description"`
	Picture           string  `json:"Picture"`
	Quantity          int     `json:"Quantity"`
	UnitPerQuantityID uint    `json:"UnitPerQuantityID"`
	NameOfUnit        string  `json:"NameOfUnit"`
	LimitQuantity     int     `json:"LimitQuantity"`
	SalePrice         float32 `json:"SalePrice"`
	CategoryID        uint    `json:"CategoryID"`
	CategoryName      string  `json:"CategoryName"`
	ShelfID           uint    `json:"ShelfID"`
	ShelfName         string  `json:"ShelfName"`
	SupplyID          uint    `json:"SupplyID"`
	SupplyName        string  `json:"SupplyName"`

	// ข้อมูลที่มาจาก ProductOfBill
	POBID            uint    `json:"POBID"`
	BillID           uint    `json:"BillID"`
	ManufacturerCode string  `json:"ManufacturerCode"`
	QuantityInBill   int     `json:"QuantityInBill"` // Quantity ที่บิลนี้นำเข้า
	PricePerPiece    float32 `json:"PricePerPiece"`
	Discount         float32 `json:"Discount"`
	SumPriceProduct  float64 `json:"SumPriceProduct"`
}

type ProductOfBillResponse struct {
	ID               uint    `json:"ID"`
	ProductID        uint    `json:"ProductID"`
	BillID           uint    `json:"BillID"`
	ManufacturerCode string  `json:"ManufacturerCode"`
	Quantity         int     `json:"Quantity"`
	PricePerPiece    float32 `json:"PricePerPiece"`
	Discount         float32 `json:"Discount"`
	SumPriceProduct  float64 `json:"SumPriceProduct"`
}

type BillAllDataResponse struct {
	ID           uint              `json:"ID"`
	Title        string            `json:"Title"`
	SupplyID     uint              `json:"SupplyID"`
	SupplyName   string            `json:"SupplyName"`
	DateImport   time.Time         `json:"DateImport"`
	SummaryPrice float32           `json:"SummaryPrice"`
	EmployeeID   uint              `json:"EmployeeID"`
	Products     []ProductResponse `json:"Products" gorm:"-"`
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

	// ✅ บันทึก Bill
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

	// ✅ บันทึก Product และ ProductOfBill
	for i, p := range req.Products {
		var product entity.Product
		// ตรวจสอบว่ามีสินค้านี้อยู่แล้วหรือยัง (SupplyID + ProductName)
		if err := tx.Where("supply_id = ? AND product_name = ?", req.Bill.SupplyID, p.ProductName).First(&product).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// สินค้าใหม่ → สร้าง Product
				product = entity.Product{
					SupplyProductCode: p.SupplyProductCode,
					ProductName:       p.ProductName,
					Description:       p.Description,
					Picture:           p.Picture,
					Quantity:          p.Quantity,
					UnitPerQuantityID: &p.UnitPerQuantityID,
					LimitQuantity:     5,
					SalePrice:         p.SalePrice,
					CategoryID:        &p.CategoryID, // NULL
					ShelfID:           &p.ShelfID,    // NULL
					SupplyID:          req.Bill.SupplyID,
				}
				if p.ShelfID != 0 {
					product.ShelfID = &p.ShelfID
				} else {
					product.ShelfID = nil
				}
				if p.CategoryID != 0 {
					product.CategoryID = &p.CategoryID
				} else {
					product.CategoryID = nil
				}
				if p.UnitPerQuantityID != 0 {
					product.UnitPerQuantityID = &p.UnitPerQuantityID
				} else {
					product.UnitPerQuantityID = nil
				}

				if err := tx.Create(&product).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Product ไม่สำเร็จ"})
					return
				}
			} else {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			// สินค้ามีอยู่แล้ว → เพิ่ม Quantity
			product.Quantity += p.Quantity
			if err := tx.Save(&product).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Quantity Product ล้มเหลว"})
				return
			}
		}

		// คำนวณ SumPriceProduct
		calculatedSum := float64(req.ProductsOfBill[i].PricePerPiece) * float64(req.ProductsOfBill[i].Quantity) * (1 - float64(req.ProductsOfBill[i].Discount)/100)
		if req.ProductsOfBill[i].SumPriceProduct != calculatedSum {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf(
					"บิล %s สินค้า %s: SumPriceProduct ไม่ถูกต้อง (ส่ง %v, ควรเป็น %v)",
					bill.Title, p.ProductName, req.ProductsOfBill[i].SumPriceProduct, calculatedSum,
				),
			})
			return
		}

		// สร้าง ProductOfBill
		productOfBill := entity.ProductOfBill{
			ProductID:        product.ID,
			BillID:           bill.ID,
			ManufacturerCode: req.ProductsOfBill[i].ManufacturerCode,
			Quantity:         req.ProductsOfBill[i].Quantity,
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

	db := config.DB()
	tx := db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เริ่ม transaction ไม่ได้"})
		return
	}

	// ✅ ดึง Bill เดิม
	var bill entity.Bill
	if err := tx.First(&bill, billID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบบิลนี้"})
		return
	}

	// ✅ อัปเดตข้อมูลบิล
	bill.Title = req.Bill.Title
	bill.SupplyID = req.Bill.SupplyID
	bill.DateImport = req.Bill.DateImport
	bill.SummaryPrice = req.Bill.SummaryPrice
	bill.EmployeeID = req.Bill.EmployeeID

	if err := tx.Save(&bill).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Bill ล้มเหลว"})
		return
	}

	// ✅ จัดการ Products และ ProductOfBill
	for i, p := range req.Products {
		var product entity.Product
		// ตรวจสอบว่ามีสินค้านี้อยู่แล้ว (SupplyID + ProductName)
		if err := tx.Where("supply_id = ? AND product_name = ?", req.Bill.SupplyID, p.ProductName).First(&product).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// สินค้าใหม่ → สร้าง Product
				product = entity.Product{
					SupplyProductCode: p.SupplyProductCode,
					ProductName:       p.ProductName,
					Description:       p.Description,
					Picture:           p.Picture,
					Quantity:          p.Quantity,
					UnitPerQuantityID: &p.UnitPerQuantityID,
					LimitQuantity:     p.LimitQuantity,
					SalePrice:         p.SalePrice,
					CategoryID:        &p.CategoryID,
					ShelfID:           &p.ShelfID,
					SupplyID:          req.Bill.SupplyID,
				}

				if p.ShelfID != 0 {
					product.ShelfID = &p.ShelfID
				} else {
					product.ShelfID = nil
				}
				if p.CategoryID != 0 {
					product.CategoryID = &p.CategoryID
				} else {
					product.CategoryID = nil
				}
				if p.UnitPerQuantityID != 0 {
					product.UnitPerQuantityID = &p.UnitPerQuantityID
				} else {
					product.UnitPerQuantityID = nil
				}
				if err := tx.Create(&product).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Product ไม่สำเร็จ"})
					return
				}
			} else {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			// สินค้ามีอยู่แล้ว → อัปเดตรายละเอียด + ปรับ Quantity
			product.SupplyProductCode = p.SupplyProductCode
			product.Description = p.Description
			product.Picture = p.Picture
			product.UnitPerQuantityID = &p.UnitPerQuantityID
			product.LimitQuantity = p.LimitQuantity
			product.SalePrice = p.SalePrice
			product.CategoryID = &p.CategoryID
			product.ShelfID = &p.ShelfID
			// เพิ่ม Quantity หรืออัปเดตตาม logic ของน้อง
			product.Quantity = p.Quantity

			if p.ShelfID != 0 {
				product.ShelfID = &p.ShelfID
			} else {
				product.ShelfID = nil
			}
			if p.CategoryID != 0 {
				product.CategoryID = &p.CategoryID
			} else {
				product.CategoryID = nil
			}
			if p.UnitPerQuantityID != 0 {
				product.UnitPerQuantityID = &p.UnitPerQuantityID
			} else {
				product.UnitPerQuantityID = nil
			}
			if err := tx.Save(&product).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Product ล้มเหลว"})
				return
			}
		}

		price := float64(req.ProductsOfBill[i].PricePerPiece)
		qty := float64(req.ProductsOfBill[i].Quantity)
		discount := float64(req.ProductsOfBill[i].Discount) // ถ้า nil → จะเป็น 0
		calculatedSum := price * qty * (1 - discount/100)

		// ปัดค่าทศนิยม 2 ตำแหน่ง
		calculatedSumRounded := math.Round(calculatedSum*100) / 100
		sumPriceRounded := math.Round(req.ProductsOfBill[i].SumPriceProduct*100) / 100

		fmt.Println("DEBUG:", "Price:", price, "Qty:", qty, "Discount:", discount, "SumPriceRounded:", sumPriceRounded, "CalculatedRounded:", calculatedSumRounded)

		// ✅ เช็คกับค่าที่ frontend ส่งมา
		if sumPriceRounded != calculatedSumRounded {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf(
					"บิล %s สินค้า %s: SumPriceProduct ไม่ถูกต้อง (ส่ง %v, ควรเป็น %v)",
					bill.Title, p.ProductName, req.ProductsOfBill[i].SumPriceProduct, calculatedSumRounded,
				),
			})
			return
		}

		// ✅ สร้างหรืออัปเดต ProductOfBill
		var pob entity.ProductOfBill
		if err := tx.Where("bill_id = ? AND product_id = ?", bill.ID, product.ID).First(&pob).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// สร้างใหม่
				pob = entity.ProductOfBill{
					ProductID:        product.ID,
					BillID:           bill.ID,
					ManufacturerCode: req.ProductsOfBill[i].ManufacturerCode,
					Quantity:         req.ProductsOfBill[i].Quantity,
					PricePerPiece:    req.ProductsOfBill[i].PricePerPiece,
					Discount:         req.ProductsOfBill[i].Discount,
					SumPriceProduct:  req.ProductsOfBill[i].SumPriceProduct,
				}
				if err := tx.Create(&pob).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง ProductOfBill ไม่สำเร็จ"})
					return
				}
			} else {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			// อัปเดต existing ProductOfBill
			pob.ManufacturerCode = req.ProductsOfBill[i].ManufacturerCode
			pob.Quantity = req.ProductsOfBill[i].Quantity
			pob.PricePerPiece = req.ProductsOfBill[i].PricePerPiece
			pob.Discount = req.ProductsOfBill[i].Discount
			pob.SumPriceProduct = req.ProductsOfBill[i].SumPriceProduct

			if err := tx.Save(&pob).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต ProductOfBill ล้มเหลว"})
				return
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit transaction ล้มเหลว"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตบิลและสินค้าสำเร็จ"})
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
			b.id, b.title, s.id as supply_id, s.supply_name as supply_name , b.date_import, b.summary_price,
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
			p.product_name, 
			p.description, 
			p.picture,
			pob.quantity, 
			p.unit_per_quantity_id, 
			u.name_of_unit AS name_of_unit,
			p.limit_quantity, 
			p.sale_price,
			pob.id AS pob_id, 
			pob.bill_id, 
			pob.manufacturer_code, 
			pob.price_per_piece, 
			pob.discount,
			pob.sum_price_product
		FROM product_of_bills pob
		LEFT JOIN products p ON pob.product_id = p.id
		LEFT JOIN unit_per_quantities u ON p.unit_per_quantity_id = u.id
		WHERE pob.bill_id = ?
	`, billID).Scan(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึง product ล้มเหลว"})
		return
	}

	bill.Products = products
	c.JSON(http.StatusOK, bill)
}
