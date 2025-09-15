package controller

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"gorm.io/gorm"
)

type ProductOfBillResponse struct {
	ID               uint    `json:"ID"`
	ProductID        uint    `json:"ProductID"`
	BillID           uint    `json:"BillID"`
	ManufacturerCode string  `json:"ManufacturerCode"`
	Quantity         int     `json:"Quantity"`
	PricePerPiece    float32 `json:"PricePerPiece"`
	Discount         float32 `json:"Discount"`
}

func CreateBillWithProducts(c *gin.Context) {
	var req struct {
		Bill           BillResponse
		Products       []ProductResponse
		ProductsOfBill []ProductOfBillResponse
	}

	body, _ := io.ReadAll(c.Request.Body)
	fmt.Println("Raw body ที่รับได้:", string(body))
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body)) // ต้อง reset body กลับมาใช้ต่อ

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println("Error ในการ bind JSON:", err.Error()) // << พิมพ์ error ออก console
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// เริ่ม transaction
	tx := db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เริ่ม transaction ไม่ได้"})
		return
	}

	var supply entity.Supply
	if err := tx.Where("supply_name = ?", req.Bill.SupplyName).First(&supply).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// ไม่เจอ => สร้างใหม่
			supply = entity.Supply{
				SupplyName: req.Bill.SupplyName,
			}
			if err := tx.Create(&supply).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Supply ไม่สำเร็จ"})
				return
			}
		} else {
			// error อื่นๆ
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เช็ค Supply ล้มเหลว"})
			return
		}
	}

	// -------------------------------
	// สร้าง Bill
	// -------------------------------
	bill := entity.Bill{
		Title:        req.Bill.Title,
		SupplyName:   supply.SupplyName, // ใช้ ID ของ supply ที่เจอหรือสร้างใหม่
		DateImport:   req.Bill.DateImport,
		SummaryPrice: req.Bill.SummaryPrice,
		EmployeeID:   req.Bill.EmployeeID,
	}

	if err := tx.Create(&bill).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Bill ไม่สำเร็จ"})
		return
	}

	// สร้าง Products ทีละตัว

	productIDs := []uint{}

	for _, p := range req.Products {
		product := entity.Product{
			SupplyProductCode: p.SupplyProductCode,
			ProductCode:       p.ProductCode,
			ProductName:       p.ProductName,
			Description:       p.Description,
			Picture:           p.Picture,
			Quantity:          p.Quantity,
			UnitPerQuantityID: p.UnitPerQuantityID,
			LimitQuantity:     5,
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
	}

	// สร้าง ProductOfBill ทีละตัว (ผูกกับ bill ที่สร้างไว้)
	for i, pb := range req.ProductsOfBill {
		if i >= len(productIDs) {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "จำนวน Products กับ ProductsOfBill ไม่ตรงกัน"})
			return
		}

		productOfBill := entity.ProductOfBill{
			ProductID:        productIDs[i], // ใช้ ID จาก index เดียวกัน
			BillID:           bill.ID,
			ManufacturerCode: pb.ManufacturerCode,
			PricePerPiece:    pb.PricePerPiece,
			Discount:         pb.Discount,
		}

		if err := tx.Create(&productOfBill).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง ProductOfBill ไม่สำเร็จ"})
			return
		}
	}
	// commit transaction ถ้าทุกอย่างผ่านหมด
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit transaction ล้มเหลว"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "สร้างข้อมูลบิลและสินค้าเรียบร้อย",
	})
}

func UpdateBillWithProducts(c *gin.Context) {
	var req struct {
		Bill           BillResponse
		Products       []ProductResponse
		ProductsOfBill []ProductOfBillResponse
	}

	body, _ := io.ReadAll(c.Request.Body)
	fmt.Println("Raw body ที่รับได้:", string(body))
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println("Error ในการ bind JSON:", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	tx := db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เริ่ม transaction ไม่ได้"})
		return
	}

	var bill entity.Bill
	if err := tx.First(&bill, req.Bill.ID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Bill ที่ต้องการอัปเดต"})
		return
	}

	// 2. ตรวจสอบ Supply
	var supply entity.Supply
	if err := tx.Where("supply_name = ?", req.Bill.SupplyName).First(&supply).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// ถ้าไม่เจอ => สร้างใหม่
			supply = entity.Supply{
				SupplyName: req.Bill.SupplyName,
			}
			if err := tx.Create(&supply).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Supply ใหม่ไม่สำเร็จ"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ตรวจสอบ Supply ล้มเหลว"})
			return
		}
	}

	// 2. อัปเดตข้อมูล Bill
	bill.Title = req.Bill.Title
	bill.SupplyName = req.Bill.SupplyName
	bill.DateImport = req.Bill.DateImport
	bill.SummaryPrice = req.Bill.SummaryPrice
	bill.EmployeeID = req.Bill.EmployeeID

	if err := tx.Save(&bill).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Bill ไม่สำเร็จ"})
		return
	}

	// 3. อัปเดตหรือสร้าง Product
	productIDs := []uint{}
	for _, p := range req.Products {
		if p.ID != 0 {
			var existingProduct entity.Product
			if err := tx.First(&existingProduct, p.ID).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Product ที่ต้องการอัปเดต"})
				return
			}

			existingProduct.SupplyProductCode = p.SupplyProductCode
			existingProduct.ProductCode = p.ProductCode
			existingProduct.ProductName = p.ProductName
			existingProduct.Description = p.Description
			existingProduct.Picture = p.Picture
			existingProduct.Quantity = p.Quantity
			existingProduct.UnitPerQuantityID = p.UnitPerQuantityID
			existingProduct.SalePrice = p.SalePrice
			existingProduct.CategoryID = p.CategoryID
			existingProduct.ShelfID = p.ShelfID

			if err := tx.Save(&existingProduct).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Product ไม่สำเร็จ"})
				return
			}
			productIDs = append(productIDs, existingProduct.ID)
		} else {
			// สร้างใหม่
			product := entity.Product{
				SupplyProductCode: p.SupplyProductCode,
				ProductCode:       p.ProductCode,
				ProductName:       p.ProductName,
				Description:       p.Description,
				Picture:           p.Picture,
				Quantity:          p.Quantity,
				UnitPerQuantityID: p.UnitPerQuantityID,
				SalePrice:         p.SalePrice,
				CategoryID:        p.CategoryID,
				ShelfID:           p.ShelfID,
				LimitQuantity:     5,
			}
			if err := tx.Create(&product).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Product ใหม่ไม่สำเร็จ"})
				return
			}
			productIDs = append(productIDs, product.ID)
		}
	}

	// 4. อัปเดตหรือสร้าง ProductOfBill
	for i, pb := range req.ProductsOfBill {
		if i >= len(productIDs) {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "จำนวน Product กับ ProductOfBill ไม่ตรงกัน"})
			return
		}

		if pb.ID != 0 {
			var existingPOB entity.ProductOfBill
			if err := tx.First(&existingPOB, pb.ID).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ ProductOfBill ที่ต้องการอัปเดต"})
				return
			}

			existingPOB.ProductID = productIDs[i]
			existingPOB.BillID = bill.ID
			existingPOB.ManufacturerCode = pb.ManufacturerCode
			existingPOB.PricePerPiece = pb.PricePerPiece
			existingPOB.Discount = pb.Discount

			if err := tx.Save(&existingPOB).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต ProductOfBill ไม่สำเร็จ"})
				return
			}
		} else {
			newPOB := entity.ProductOfBill{
				ProductID:        productIDs[i],
				BillID:           bill.ID,
				ManufacturerCode: pb.ManufacturerCode,
				PricePerPiece:    pb.PricePerPiece,
				Discount:         pb.Discount,
			}
			if err := tx.Create(&newPOB).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง ProductOfBill ใหม่ไม่สำเร็จ"})
				return
			}
		}
	}

	// Commit
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit transaction ล้มเหลว"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดต Bill และข้อมูลเรียบร้อย"})
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
