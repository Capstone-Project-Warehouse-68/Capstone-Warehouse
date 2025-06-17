package config

import (
	"fmt"
	"github.com/project_capstone/WareHouse/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
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
		&entity.Product{},
		&entity.Employee{},
		&entity.Role{},
		&entity.BankType{},
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

	employee := &entity.Employee{
		FirstName:  "IT",
		LastName:   "Admin",
		Email:      "ITAdmin@stayease.com",
		NationalID:	"0000000000000",
		Password:   hashedPassword,
		BankTypeID      	: 1,
		BankAccountNumber 	: "0",
		RoleID            	: 1,
	}

	db.FirstOrCreate(employee, &entity.Employee{
		Email: "ITAdmin@PVWarehouse.com",
	})

}
