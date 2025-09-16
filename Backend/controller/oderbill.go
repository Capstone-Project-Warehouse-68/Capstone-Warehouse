package controller

import (
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"github.com/gin-gonic/gin"
	"net/http"
	// "gorm.io/gorm"
    "sort"
    "strconv"
	"time"
)

type (
    OutputOrderDraft struct {
        ProductDraftName  string `json:"product_draft_name"`
        SupplyDraftName   string `json:"supply_draft_name"`
        CategoryName      string `json:"category_name"`
        UnitDrafName          string `json:"unit_draf_name"`
        Quantity          int    `json:"quantity"`
    }

	OutputOrderProduct struct {
		ProductID         uint   `json:"product_id"`
		ProductName       string `json:"product_name"`
        SupplyProductCode        string `json:"supply_product_code"`
        CategoryName        string `json:"category_name"`
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
        ProductsDraft []OutputOrderDraft   `json:"products_draft"`
	}
)

// --- Helpers กัน nil ---
func strOrEmpty(s *string) string {
    if s != nil {
        return *s
    }
    return ""
}

func intOrZero(i *int) int {
    if i != nil {
        return *i
    }
    return 0
}

func uintOrZero(u *uint) uint {
    if u != nil {
        return *u
    }
    return 0
}

func boolOrFalse(b *bool) bool {
    if b != nil {
        return *b
    }
    return false
}
func GetAllOrderBills(c *gin.Context) {
    db := config.DB()

    // --- Query join order_bills + supplies + products + unit_per_quantities + drafts ---
    rows, err := db.Raw(`
        SELECT 
            ob.id as order_bill_id,
            ob.updated_at,
            ob.description,
            s.id as supply_id,
            s.supply_name,
            op.product_id,
            p.product_name,
            p.supply_product_code,
            c.category_name,
            op.unit_per_quantity_id,
            u.name_of_unit as unit_name,
            op.quantity,
            op.status_draft,
            opd.unit_draf_name,
            opd.product_draft_name,
            opd.supply_draft_name
        FROM order_bills ob
        JOIN supplies s ON ob.supply_id = s.id
        LEFT JOIN order_products op ON ob.id = op.order_bill_id
        LEFT JOIN products p ON op.product_id = p.id
        LEFT JOIN unit_per_quantities u ON op.unit_per_quantity_id = u.id
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN order_product_drafts opd ON op.order_product_draft_id = opd.id
        WHERE ob.deleted_at IS NULL
        ORDER BY ob.id DESC
    `).Rows()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลไม่สำเร็จ"})
        return
    }
    defer rows.Close()

    orderMap := make(map[uint]*OutputOrderbill)

    for rows.Next() {
        var (
            orderBillID       uint
            updatedAt         time.Time
            description       string
            supplyID          uint
            supplyName        string
            productID         *uint
            supplyProductCode *string
            productName       *string
            categoryName      *string
            unitPerQuantityID *uint
            unitName          *string
            quantity          *int
            statusDraft       *bool
            unitDrafName      *string
            productDraftName  *string
            supplyDraftName   *string
        )

        if err := rows.Scan(
            &orderBillID,
            &updatedAt,
            &description,
            &supplyID,
            &supplyName,
            &productID,
            &productName,
            &supplyProductCode,
            &categoryName,
            &unitPerQuantityID,
            &unitName,
            &quantity,
            &statusDraft,
            &unitDrafName,
            &productDraftName,
            &supplyDraftName,
        ); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "แปลงข้อมูลล้มเหลว"})
            return
        }

        // --- ถ้ายังไม่มี orderBill ใน map ให้สร้างใหม่ ---
        if _, ok := orderMap[orderBillID]; !ok {
            orderMap[orderBillID] = &OutputOrderbill{
                OrderBillId: orderBillID,
                UpdatedAt:   updatedAt.Format("2006-01-02 15:04:05"),
                Description: description,
                SupplyID:    supplyID,
                SupplyName:  supplyName,
                Products:    []OutputOrderProduct{},
                ProductsDraft: []OutputOrderDraft{},
            }
        }

        // --- Product จริง ---
        if productID != nil && *productID != 0 {
            orderMap[orderBillID].Products = append(orderMap[orderBillID].Products, OutputOrderProduct{
                ProductID:         *productID,
                ProductName:       strOrEmpty(productName),
                SupplyProductCode: strOrEmpty(supplyProductCode),
                CategoryName:      strOrEmpty(categoryName), // ถ้า null จะเป็น ""
                UnitPerQuantityID: uintOrZero(unitPerQuantityID),
                UnitName:          strOrEmpty(unitName),
                Quantity:          intOrZero(quantity),
            })
        }

        // --- Draft products ---
        if boolOrFalse(statusDraft) {
            orderMap[orderBillID].ProductsDraft = append(orderMap[orderBillID].ProductsDraft, OutputOrderDraft{
                ProductDraftName: strOrEmpty(productDraftName),
                SupplyDraftName:  strOrEmpty(supplyDraftName),
                CategoryName:     strOrEmpty(categoryName),       // ถ้าไม่มี category ให้เป็น ""
                UnitDrafName:     strOrEmpty(unitDrafName),       // ถ้า null ให้เป็น ""
                Quantity:         intOrZero(quantity),
            })
        }
    }

    // --- แปลง map → slice ---
    var orders []OutputOrderbill
    for _, ob := range orderMap {
        orders = append(orders, *ob)
    }

    // --- Sort slice ตาม OrderBillId DESC ---
    sort.Slice(orders, func(i, j int) bool {
        return orders[i].OrderBillId > orders[j].OrderBillId
    })

    c.JSON(http.StatusOK, gin.H{
        "data": orders,
    })
}


func DeleteOrderBill(c *gin.Context) {
    db := config.DB()
    
    id := c.Param("id")
    orderID, err := strconv.ParseUint(id, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "id ไม่ถูกต้อง"})
        return
    }

    tx := db.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()

    var orderBill entity.OrderBill
    if err := tx.First(&orderBill, orderID).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusNotFound, gin.H{"message": "ไม่พบ OrderBill id นี้", "error": err.Error()})
        return
    }

    // ลบ OrderProducts ที่เกี่ยวข้องแบบ Soft Delete
    if err := tx.Where("order_bill_id = ?", orderID).Delete(&entity.OrderProduct{}).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบรายการสินค้าไม่สำเร็จ"})
        return
    }

    // ลบ OrderBill แบบ Soft Delete
    if err := tx.Delete(&orderBill).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบคำสั่งซื้อไม่สำเร็จ"})
        return
    }

    tx.Commit()

    c.JSON(http.StatusOK, gin.H{
        "message": "ลบคำสั่งซื้อและรายการสินค้าที่เกี่ยวข้องเรียบร้อย",
    })
}

