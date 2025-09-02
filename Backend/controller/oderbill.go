package controller

import (
	"github.com/project_capstone/WareHouse/config"
	// "github.com/project_capstone/WareHouse/entity"
	"github.com/gin-gonic/gin"
	"net/http"
	// "gorm.io/gorm"
	"time"
)

func GetAllOrderBills(c *gin.Context) {
    db := config.DB()

    // query join order_bills + supplies + products + unit_per_quantities
    rows, err := db.Raw(`
        SELECT 
            ob.id as order_bill_id,
            ob.updated_at,
            ob.description,
            s.id as supply_id,
            s.supply_name,
            op.product_id,
            p.product_name,
            op.unit_per_quantity_id,
            u.name_of_unit as unit_name,
            op.quantity
        FROM order_bills ob
        JOIN supplies s ON ob.supply_id = s.id
        LEFT JOIN order_products op ON ob.id = op.order_bill_id
        LEFT JOIN products p ON op.product_id = p.id
        LEFT JOIN unit_per_quantities u ON op.unit_per_quantity_id = u.id
        ORDER BY ob.id, op.id
    `).Rows()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลไม่สำเร็จ"})
        return
    }
    defer rows.Close()

    // เก็บผลลัพธ์
    orderMap := make(map[uint]*OutputOrderbill)

    for rows.Next() {
        var (
            orderBillID       uint
            updatedAt         time.Time
            description       string
            supplyID          uint
            supplyName        string
            productID         *uint  // ใช้ pointer กัน null (เผื่อ order ไม่มีสินค้า)
            productName       *string
            unitPerQuantityID *uint
            unitName          *string
            quantity          *int
        )

        if err := rows.Scan(
            &orderBillID, &updatedAt, &description, &supplyID, &supplyName,
            &productID, &productName, &unitPerQuantityID, &unitName, &quantity,
        ); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "แปลงข้อมูลล้มเหลว"})
            return
        }

        // ถ้ายังไม่มี orderBill นี้ใน map ให้สร้างใหม่
        if _, ok := orderMap[orderBillID]; !ok {
            orderMap[orderBillID] = &OutputOrderbill{
                OrderBillId:          orderBillID,
                UpdatedAt:   updatedAt.Format("2006-01-02 15:04:05"),
                Description: description,
                SupplyID:    supplyID,
                SupplyName:  supplyName,
                Products:    []OutputOrderProduct{},
            }
        }

        // ถ้ามี product ให้ add เข้าไป
        if productID != nil {
            orderMap[orderBillID].Products = append(orderMap[orderBillID].Products, OutputOrderProduct{
                ProductID:         *productID,
                ProductName:       *productName,
                UnitPerQuantityID: *unitPerQuantityID,
                UnitName:          *unitName,
                Quantity:          *quantity,
            })
        }
    }

    // แปลง map → slice
    var orders []OutputOrderbill
    for _, ob := range orderMap {
        orders = append(orders, *ob)
    }

    c.JSON(http.StatusOK, gin.H{
        "data": orders,
    })
}