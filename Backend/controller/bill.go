package controller

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"github.com/robfig/cron/v3"
)

// StartHardDeleteScheduler เรียกใช้ cron เพื่อลบบิลแบบ hard delete
func StartHardDeleteScheduler() {
	c := cron.New(cron.WithSeconds()) // ใช้ seconds field
	fmt.Println("[HardDeleteScheduler] เริ่ม scheduler...")

	// ทุก 1 นาที (สามารถปรับให้เป็น 1 วันจริงได้)
	c.AddFunc("0 */1 * * * *", func() {
		fmt.Println("[HardDeleteScheduler] Trigger cron job เวลา:", time.Now().Format("2006-01-02 15:04:05"))

		db := config.DB()
		oneMinuteAgo := time.Now().Add(-1 * time.Minute)
		fmt.Println("[HardDeleteScheduler] ลบบิลที่ deleted_at <= ", oneMinuteAgo)

		var bills []entity.Bill
		if err := db.Unscoped().
			Where("deleted_at IS NOT NULL AND deleted_at <= ?", oneMinuteAgo).
			Find(&bills).Error; err != nil {
			fmt.Println("[HardDeleteScheduler] Error ดึง bills:", err)
			return
		}

		fmt.Printf("[HardDeleteScheduler] พบ %d บิลที่ต้องลบ\n", len(bills))

		for _, bill := range bills {
			fmt.Println("[HardDeleteScheduler] เริ่มลบ Bill ID:", bill.ID)
			tx := db.Begin()

			// ดึง ProductIDs ของ Bill
			var productIDs []uint
			if err := tx.Model(&entity.ProductOfBill{}).
				Where("bill_id = ?", bill.ID).
				Pluck("product_id", &productIDs).Error; err != nil {
				fmt.Println("[HardDeleteScheduler] Error pluck ProductIDs:", err)
				tx.Rollback()
				continue
			}

			// ลบ ProductOfBill แบบ hard delete
			if err := tx.Unscoped().
				Where("bill_id = ?", bill.ID).
				Delete(&entity.ProductOfBill{}).Error; err != nil {
				fmt.Println("[HardDeleteScheduler] Error delete ProductOfBill:", err)
				tx.Rollback()
				continue
			}

			// ลบ Product แบบ hard delete
			if len(productIDs) > 0 {
				if err := tx.Unscoped().
					Where("id IN ?", productIDs).
					Delete(&entity.Product{}).Error; err != nil {
					fmt.Println("[HardDeleteScheduler] Error delete Product:", err)
					tx.Rollback()
					continue
				}
			}

			// ลบ Bill แบบ hard delete
			if err := tx.Unscoped().Delete(&bill).Error; err != nil {
				fmt.Println("[HardDeleteScheduler] Error delete Bill:", err)
				tx.Rollback()
				continue
			}

			if err := tx.Commit().Error; err != nil {
				fmt.Println("[HardDeleteScheduler] Error commit transaction:", err)
				tx.Rollback()
				continue
			}

			fmt.Println("[HardDeleteScheduler] ลบ Bill ID", bill.ID, "เรียบร้อย")
		}
	})

	c.Start()
	fmt.Println("[HardDeleteScheduler] Scheduler started!")
}

func GetAllBill(c *gin.Context) {
	var bills []entity.Bill

	db := config.DB()
	results := db.Preload("Supply").Preload("Employee").Order("id asc").Find(&bills)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, bills)
}

func GetBillDeleted(c *gin.Context) {
	var bills []entity.Bill

	db := config.DB()
	results := db.Unscoped().Preload("Supply").Preload("Employee").
		Where("deleted_at IS NOT NULL").Find(&bills) // <-- เพิ่มตรงนี้

	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, bills)
}

func RestoreBills(c *gin.Context) {
	// LOG ก่อน bind
	log.Println("[RestoreBills] เริ่มเรียก API กู้คืนบิล")

	// รับ JSON body ที่มี bill_ids
	var req struct {
		BillIDs []uint `json:"bill_ids"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[RestoreBills] bind JSON ผิดพลาด: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "ต้องส่ง BillIDs"})
		return
	}

	// LOG หลัง bind
	log.Printf("[RestoreBills] รับ BillIDs จาก request: %v\n", req.BillIDs)

	if len(req.BillIDs) == 0 {
		log.Println("[RestoreBills] ไม่มี BillIDs ส่งมาจาก request")
		c.JSON(http.StatusBadRequest, gin.H{"error": "ต้องส่ง BillIDs"})
		return
	}

	db := config.DB()
	tx := db.Begin()
	if tx.Error != nil {
		log.Println("[RestoreBills] เริ่ม transaction ไม่สำเร็จ")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เริ่ม transaction ไม่ได้"})
		return
	}

	// 0. ตรวจสอบ Title ซ้ำกับ Bill ที่ยังไม่ถูกลบ
	var restoreBills []entity.Bill
	if err := tx.Unscoped().Where("id IN ?", req.BillIDs).Find(&restoreBills).Error; err != nil {
		tx.Rollback()
		log.Printf("[RestoreBills] ดึงข้อมูล Bill ที่จะ restore ไม่สำเร็จ: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูล Bill ที่จะ restore ไม่สำเร็จ"})
		return
	}

	for _, rb := range restoreBills {
		var count int64
		if err := tx.Model(&entity.Bill{}).
			Where("title = ? AND deleted_at IS NULL", rb.Title).
			Count(&count).Error; err != nil {
			tx.Rollback()
			log.Printf("[RestoreBills] ตรวจสอบ Title ซ้ำไม่สำเร็จ: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ตรวจสอบ Title ซ้ำไม่สำเร็จ"})
			return
		}
		if count > 0 {
			tx.Rollback()
			log.Printf("[RestoreBills] พบ Bill ที่ยังไม่ถูกลบ Title ซ้ำ: %s\n", rb.Title)
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("ไม่สามารถกู้คืนบิล Title '%s' เพราะมีบิลที่ยังไม่ถูกลบอยู่แล้ว", rb.Title)})
			return
		}
	}

	// 1. ดึง ProductOfBill ทั้งหมดของ bill_ids
	var pobList []entity.ProductOfBill
	if err := tx.Unscoped().Where("bill_id IN ?", req.BillIDs).Find(&pobList).Error; err != nil {
		tx.Rollback()
		log.Printf("[RestoreBills] ดึง ProductOfBill ไม่สำเร็จ: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึง ProductOfBill ไม่สำเร็จ"})
		return
	}

	log.Printf("[RestoreBills] พบ ProductOfBill จำนวน %d รายการ\n", len(pobList))

	// เก็บ productID ทั้งหมด
	var productIDs []uint
	for _, pob := range pobList {
		productIDs = append(productIDs, pob.ProductID)
	}

	// 2. กู้คืน ProductOfBill
	if len(pobList) > 0 {
		if err := tx.Model(&entity.ProductOfBill{}).Unscoped().
			Where("bill_id IN ?", req.BillIDs).
			Update("deleted_at", nil).Error; err != nil {
			tx.Rollback()
			log.Printf("[RestoreBills] กู้คืน ProductOfBill ไม่สำเร็จ: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "กู้คืน ProductOfBill ไม่สำเร็จ"})
			return
		}
		log.Println("[RestoreBills] กู้คืน ProductOfBill สำเร็จ")
	}

	// 3. กู้คืน Product
	if len(productIDs) > 0 {
		if err := tx.Model(&entity.Product{}).Unscoped().
			Where("id IN ?", productIDs).
			Update("deleted_at", nil).Error; err != nil {
			tx.Rollback()
			log.Printf("[RestoreBills] กู้คืน Product ไม่สำเร็จ: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "กู้คืน Product ไม่สำเร็จ"})
			return
		}
		log.Println("[RestoreBills] กู้คืน Product สำเร็จ")
	}

	// 4. กู้คืน Bill
	if err := tx.Model(&entity.Bill{}).Unscoped().
		Where("id IN ?", req.BillIDs).
		Update("deleted_at", nil).Error; err != nil {
		tx.Rollback()
		log.Printf("[RestoreBills] กู้คืน Bill ไม่สำเร็จ: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "กู้คืน Bill ไม่สำเร็จ"})
		return
	}
	log.Println("[RestoreBills] กู้คืน Bill สำเร็จ")

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		log.Printf("[RestoreBills] commit transaction ล้มเหลว: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit transaction ล้มเหลว"})
		return
	}

	log.Println("[RestoreBills] กู้คืนบิลและสินค้าที่เกี่ยวข้องเรียบร้อย")
	c.JSON(http.StatusOK, gin.H{"message": "กู้คืนบิลและสินค้าที่เกี่ยวข้องเรียบร้อย"})
}

// func CreateBill(c *gin.Context) {
// 	var Billdata BillResponse

// 	if err := c.ShouldBindJSON(&Billdata); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "เกิดข้อผิดพลาดในการส่งข้อมูลใบสั่งซื้อ",
// 		})
// 		return
// 	}

// 	db := config.DB()

// 	if Billdata.SupplyID == 0 {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "ไม่พบข้อมูลบริษัทที่สั่งซื้อ",
// 		})
// 		return
// 	}

// 	BillCreate := entity.Bill{
// 		SupplyID:     Billdata.SupplyID,
// 		DateImport:   Billdata.DateImport,
// 		SummaryPrice: Billdata.SummaryPrice,
// 	}

// 	if err := db.Create(&BillCreate).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"status": http.StatusInternalServerError,
// 			"error":  "ไม่สามารถเพิ่มข้อมูลสินค้าได้",
// 		})
// 		return
// 	}

// 	c.JSON(http.StatusCreated, gin.H{
// 		"data": BillCreate,
// 	})

// }

func UpdateBill(c *gin.Context) {
	var Billdata BillResponse
	BillID := c.Param("id")

	db := config.DB()
	result := db.First(&Billdata, BillID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลใบสั่งซื้อ"})
		return
	}

	if err := c.ShouldBindJSON(&Billdata); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูล"})
		return
	}

	result = db.Save(&Billdata)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "แก้ไขข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "แก้ไขข้อมูลใบสั่งซื้อสำเร็จ"})
}
