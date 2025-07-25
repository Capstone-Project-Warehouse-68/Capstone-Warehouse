package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

type ProductResponse struct {
	ID                uint    `json:"ID"`
	SupplyProductCode string  `json:"SupplyProductCode"`
	ProductCode       string  `json:"ProductCode"`
	ProductName       string  `json:"ProductName"`
	Description       string  `json:"Description"`
	Picture           string  `json:"Picture"`
	Quantity          int     `json:"Quantity"`
	UnitPerQuantityID uint    `json:"UnitPerQuantityID"`
	LimitQuantity     int     `json:"LimitQuantity"`
	SalePrice         float32 `json:"SalePrice"`
	CategoryID        uint    `json:"CategoryID"`
	ShelfID           uint    `json:"ShelfID"`
}

type Limituantity struct{
	ProductID uint `json:"product_id"`
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
		"message":        "อัปเดต LimitQuantity สำเร็จ",
		"product_id":     product.ID,
		"limit_quantity": product.LimitQuantity,
	})
}