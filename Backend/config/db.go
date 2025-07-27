package config

import (
	"fmt"
	"github.com/project_capstone/WareHouse/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"time"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	database, err := gorm.Open(sqlite.Open("Project_Capstone.db?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("connected database")
	db = database
}

func SetupDatabase() {
	db.AutoMigrate(
		&entity.BankType{},
		&entity.Bill{},
		&entity.Cart{},
		&entity.CartProduct{},
		&entity.Category{},
		&entity.Coupon{},
		&entity.Employee{},
		&entity.OrderBill{},
		&entity.OrderProduct{},
		&entity.Product{},
		&entity.ProductOfBill{},
		&entity.Role{},
		&entity.Shelf{},
		&entity.Supply{},
		&entity.UnitPerQuantity{},
		&entity.Zone{},
	)

	OwnerRole := entity.Role{RoleName: "เจ้าของร้าน"}
	ManagerRole := entity.Role{RoleName: "ผู้จัดการ"}
	EmployeeRole := entity.Role{RoleName: "พนักงาน"}

	B1 := entity.BankType{BankTypeName: "จำลองธนาคาร1"}

	db.FirstOrCreate(&OwnerRole, entity.Role{RoleName: "เจ้าของร้าน"})
	db.FirstOrCreate(&ManagerRole, entity.Role{RoleName: "ผู้จัดการ"})
	db.FirstOrCreate(&EmployeeRole, entity.Role{RoleName: "พนักงาน"})

	db.FirstOrCreate(&B1, entity.BankType{BankTypeName: "จำลองธนาคาร1"})

	hashedPassword, _ := HashPassword("12345")
	hashNationalID, _ := HashPassword("0000000000000")

	employee := &entity.Employee{
		FirstName:  "IT",
		LastName:   "Admin",
		Email:      "ITAdmin@PVWarehouse.com",
		NationalID:	hashNationalID,
		Password:   hashedPassword,
		BankTypeID      	: 1,
		BankAccountNumber 	: "0",
		RoleID            	: 1,
	}

	db.FirstOrCreate(employee, &entity.Employee{
		Email: "ITAdmin@PVWarehouse.com",
	})


	// ===== Zone & Shelf =====
	zone := entity.Zone{ZoneName: "โซน A"}
	db.FirstOrCreate(&zone, entity.Zone{ZoneName: "โซน A"})

	shelf := entity.Shelf{
		ShelfName: "ชั้น A1",
		ZoneID:    zone.ID,
	}
	db.FirstOrCreate(&shelf, entity.Shelf{ShelfName: "ชั้น A1"})

	// ===== Category =====
	category := entity.Category{CategoryName: "เบรก"}
	db.FirstOrCreate(&category, entity.Category{CategoryName: "เบรก"})

	// ===== Unit =====
	unit := entity.UnitPerQuantity{NameOfUnit: "ชิ้น"}
	db.FirstOrCreate(&unit, entity.UnitPerQuantity{NameOfUnit: "ชิ้น"})

	// ===== Supply =====
	supply := entity.Supply{
		SupplyName:        "บริษัทอะไหล่ไทย",
		Address:           "123 ถนนพหลโยธิน",
		PhoneNumberSale:   "0812345678",
		SaleName:          "คุณสมชาย",
		BankTypeID:        B1.ID,
		BankAccountNumber: "123-4-56789-0",
		LineIDSale:        "@supplythai",
	}
	db.FirstOrCreate(&supply, entity.Supply{SupplyName: "บริษัทอะไหล่ไทย"})

	// ===== Product =====
	product := entity.Product{
		SupplyProductCode: "SUP-A001",
		ProductCode:       "PRD-001",
		ProductName:       "ผ้าเบรกหน้า",
		Description:       "ผ้าเบรกหน้ารถยนต์ญี่ปุ่น",
		Picture:           "https://example.com/brake.jpg",
		Quantity:          50,
		UnitPerQuantityID: unit.ID,
		LimitQuantity:     5,
		SalePrice:         850.00,
		CategoryID:        category.ID,
		ShelfID:           shelf.ID,
	}
	db.FirstOrCreate(&product, entity.Product{SupplyProductCode: "SUP-A001"})

	// ===== Bill =====
	bill := entity.Bill{
		SupplyID:     supply.ID,
		DateImport:   time.Now(),
		SummaryPrice: 17000,
	}
	db.Create(&bill)

	// ===== ProductOfBill =====
	productOfBill := entity.ProductOfBill{
		SupplyProductCode: 1, // ต้องตรงกับ Product.ID หากใช้ foreignKey จาก ID
		ProductID:         product.ID,
		BillID:            bill.ID,
		ManufacturerCode:  "MNFC-12345",
		Quantity:          20,
		PricePerPiece:     800,
		Discount:          5,
		UnitPerQuantityID: unit.ID,
	}
	db.Create(&productOfBill)

	// ===== Coupon =====
	coupon := entity.Coupon{
		Code:     "WELCOME10",
		Discount: 10.0,
	}
	db.FirstOrCreate(&coupon, entity.Coupon{Code: "WELCOME10"})

	// ===== Cart =====
	cart := entity.Cart{
		SummaryPrice: 2550,
		EmployeeID:   employee.ID,
		CouponID:     coupon.ID,
	}
	db.Create(&cart)

	// ===== CartProduct =====
	cartProduct := entity.CartProduct{
		CartID:        cart.ID,
		ProductID:     product.ID,
		Quantity:      3,
		PricePerPiece: product.SalePrice,
	}
	db.Create(&cartProduct)

	// ===== OrderBill =====
	orderBill := entity.OrderBill{
		Description: "สั่งซื้ออะไหล่เพิ่มเติม",
		SupplyID:    supply.ID,
		EmployeeID:  employee.ID,
	}
	db.Create(&orderBill)

	// ===== OrderProduct =====
	orderProduct := entity.OrderProduct{
		ProductID:         product.ID,
		UnitPerQuantityID: unit.ID,
		Quantity:          10,
		OrderBillID:       orderBill.ID,
	}
	db.Create(&orderProduct)








}
