package controller

import (
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"github.com/gin-gonic/gin"
	"net/http"
	"gorm.io/gorm"
	"github.com/asaskevich/govalidator"
)

type( 
	OrderProductInput struct {
		ProductID         uint   `json:"product_id" valid:"-"`                  // ถ้า 0 คือ draft
		ProductDraftName  string `json:"product_draft_name,omitempty" valid:"optional"` // สำหรับสินค้าตัวใหม่
		SupplyDraftName   string `json:"supply_draft_name,omitempty" valid:"optional"` // สำหรับสินค้าตัวใหม่
		UnitDrafName      string `json:"unit_draf_name,omitempty" valid:"optional"` // สำหรับสินค้าตัวใหม่
		UnitPerQuantityID uint   `json:"unit_per_quantity_id" valid:"optional"`
		Quantity          int    `json:"quantity" valid:"required~Quantity is required,int~Quantity must be integer"`
	}
	OrderBillInput struct {
		SupplyID    uint               `json:"supply_id"  valid:"required~Supply is required"`
		EmployeeID  uint               `json:"employee_id" valid:"required~Employee is required"`
		Description string             `json:"description" valid:"optional"`
		Products    []OrderProductInput `json:"products" valid:"required"`
	}

    MultiOrderBillInput struct {
    	EmployeeID uint             `json:"employee_id" valid:"required"`
    	Orders     []OrderBillInput `json:"orders" valid:"required"` 
	}
)
type(
	UpdateOrderProductInput struct {
		ProductID         uint  `json:"product_id"`
		UnitPerQuantityID uint  `json:"unit_per_quantity_id"`
		Quantity          int   `json:"quantity"`
	}

	UpdateOrderBillInput struct {
		Description string                   `json:"description"`
		Products    []UpdateOrderProductInput `json:"products"`
	}
)

func AddOrderBillWithProducts(c *gin.Context) {
    db := config.DB()
    var input MultiOrderBillInput

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
        return
    }


	// ใช้ govalidator ตรวจ
    if ok, err := govalidator.ValidateStruct(input); !ok {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
	// Validate nested Orders + Products
	for _, order := range input.Orders {
		if ok, err := govalidator.ValidateStruct(order); !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		for _, p := range order.Products {
			if ok, err := govalidator.ValidateStruct(p); !ok {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
		}
	}

	tx := db.Begin() // เริ่ม transaction
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()

    var createdOrders []entity.OrderBill

    for _, order := range input.Orders {
        orderBill := entity.OrderBill{
            SupplyID:    order.SupplyID,
            EmployeeID:  input.EmployeeID,
            Description: order.Description,
        }
        if err := tx.Create(&orderBill).Error; err != nil {
			tx.Rollback()
            c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างคำสั่งซื้อไม่สำเร็จ"})
            return
        }

        for _, p := range order.Products {
			orderProduct := entity.OrderProduct{
				OrderBillID:       orderBill.ID,
				ProductID:         p.ProductID,
				UnitPerQuantityID: p.UnitPerQuantityID,
				Quantity:          p.Quantity,
				StatusDraft:       false,
				OrderProductDraftID: nil,
			}

			// ถ้า ProductID = 0 → แสดงว่าเป็นสินค้าใหม่ (draft)
            if p.ProductID == 0 {
                draft := entity.OrderProductDraft{
                    ProductDraftName: p.ProductDraftName,
                    SupplyDraftName:  p.SupplyDraftName,
                    UnitDrafName:     p.UnitDrafName,
                    Quantity:         p.Quantity,
                }

                if err := tx.Create(&draft).Error; err != nil {
                    tx.Rollback()
                    c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสินค้า draft ไม่สำเร็จ"})
                    return
                }

                orderProduct.StatusDraft = true
                orderProduct.OrderProductDraftID = &draft.ID // <- ใช้ pointer
            }

			if err := tx.Create(&orderProduct).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างรายการสินค้าไม่สำเร็จ"})
				return
			}
		}

        createdOrders = append(createdOrders, orderBill)
    }

	if err := tx.Commit().Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดขณะบันทึกข้อมูล"})
        return
    }
	
    c.JSON(http.StatusOK, gin.H{
        "message":     "สร้างคำสั่งซื้อและสินค้าทั้งหมดเรียบร้อย",
        "order_bills": createdOrders,
    })
}




func UpdateOrderBill(c *gin.Context) {
	db := config.DB()

	// รับ orderBillID จาก URL Param
	orderBillID := c.Param("id")

	var orderBill entity.OrderBill
	if err := db.First(&orderBill, orderBillID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบคำสั่งซื้อ"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// รับข้อมูล JSON จาก body
	var input UpdateOrderBillInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// อัพเดต Description
	orderBill.Description = input.Description
	if err := db.Save(&orderBill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "แก้ไขคำสั่งซื้อไม่ได้"})
		return
	}

	// อัพเดตรายการสินค้า (OrderProduct)
	for _, p := range input.Products {
		var orderProduct entity.OrderProduct
		// หา OrderProduct ตาม orderBillID และ productID
		err := db.Where("order_bill_id = ? AND product_id = ?", orderBill.ID, p.ProductID).First(&orderProduct).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// ถ้าไม่เจอ สร้างใหม่
				newOrderProduct := entity.OrderProduct{
					OrderBillID:       orderBill.ID,
					ProductID:         p.ProductID,
					UnitPerQuantityID: p.UnitPerQuantityID,
					Quantity:          p.Quantity,
				}
				if err := db.Create(&newOrderProduct).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสินค้าใหม่ในคำสั่งซื้อไม่ได้"})
					return
				}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			// ถ้าเจอแล้วก็อัพเดต
			orderProduct.UnitPerQuantityID = p.UnitPerQuantityID
			orderProduct.Quantity = p.Quantity
			if err := db.Save(&orderProduct).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "แก้ไขสินค้าในคำสั่งซื้อไม่ได้"})
				return
				
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "แก้ไขคำสั่งซื้อและสินค้าสำเร็จ",
		"order_bill": orderBill,
	})
}