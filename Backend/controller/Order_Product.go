package controller

import (
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"github.com/gin-gonic/gin"
	"net/http"
	"gorm.io/gorm"
)

type( 
	OrderProductInput struct {
		ProductID         uint  `json:"product_id" binding:"required"`
		UnitPerQuantityID uint  `json:"unit_per_quantity_id" binding:"required"`
		Quantity          int   `json:"quantity" binding:"required"`
	}
	OrderBillInput struct {
		SupplyID    uint               `json:"supply_id" binding:"required"`
		EmployeeID  uint               `json:"employee_id"`
		Description string             `json:"description"`
		Products    []OrderProductInput `json:"products"`
	}

    MultiOrderBillInput struct {
    	EmployeeID uint             `json:"employee_id" binding:"required"`
    	Orders     []OrderBillInput `json:"orders"` // ใส่คำสั่งซื้อแยก supplier
	}

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

    var createdOrders []entity.OrderBill

    for _, order := range input.Orders {
        orderBill := entity.OrderBill{
            SupplyID:    order.SupplyID,
            EmployeeID:  input.EmployeeID,
            Description: order.Description,
        }
        if err := db.Create(&orderBill).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างคำสั่งซื้อไม่สำเร็จ"})
            return
        }

        for _, p := range order.Products {
            orderProduct := entity.OrderProduct{
                OrderBillID:       orderBill.ID,
                ProductID:         p.ProductID,
                UnitPerQuantityID: p.UnitPerQuantityID,
                Quantity:          p.Quantity,
            }
            if err := db.Create(&orderProduct).Error; err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างรายการสินค้าไม่สำเร็จ"})
                return
            }
        }

        createdOrders = append(createdOrders, orderBill)
    }

    c.JSON(http.StatusOK, gin.H{
        "message":     "สร้างคำสั่งซื้อและสินค้าทั้งหมดเรียบร้อย",
        "order_bills": createdOrders,
    })
}

type (
	OutputOrderProduct struct {
		ProductID         uint   `json:"product_id"`
		ProductName       string `json:"product_name"`
		UnitPerQuantityID uint   `json:"unit_per_quantity_id"`
		UnitName          string `json:"unit_name"`
		Quantity          int    `json:"quantity"`
	}
	OutputOrderbill struct {
		OrderBillId          uint                 `json:"order_bill_id"`
		UpdatedAt   string               `json:"updated_at"`
		Description string               `json:"description"`
		SupplyID    uint                 `json:"supply_id"`
		SupplyName  string               `json:"supply_name"`
		Products    []OutputOrderProduct `json:"products"`
	}
)


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