package controller

import (
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
)

func GetAllEmployees(c *gin.Context) {
	var employees []entity.Employee
 
	db := config.DB()
	results := db.Preload("BankType").Preload("Role").Find(&employees)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, employees)
}

func GetEmployeeByID(c *gin.Context) {
	ID := c.Param("id")
	var employee entity.Employee
 
	db := config.DB()
	results := db.Preload("BankType").Preload("Role").First(&employee, ID)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
 
	if employee.ID == 0 {
		c.JSON(http.StatusNoContent, gin.H{})
		return
	}
	c.JSON(http.StatusOK, employee)
 }

func DeleteEmployee(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()

	var employee entity.Employee
	if err := db.First(&employee, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบพนักงาน"})
		return
	}

	tx := db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed: "})
		}
	}()

	// Soft delete member
	if err := tx.Model(&employee).Update("deleted_at", time.Now()).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลสำเร็จ"})
}

func UpdateEmployee(c *gin.Context) {

	var employee entity.Employee

	EmployeeID := c.Param("id")
	db := config.DB()
	result := db.First(&employee, EmployeeID)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่ข้อมูลพนักงาน"})
		return
	}

	if err := c.ShouldBindJSON(&employee); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน"})
		return
	}

	result = db.Save(&employee)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูลพนักงาน"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "บันทึกการแก้ไขข้อมูลพนักงานเสร็จสิ้น"})
}

func CreateEmployee(c *gin.Context) {
	var employee entity.Employee

	// bind เข้าตัวแปร employee
	if err := c.ShouldBindJSON(&employee); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ ตรวจสอบความถูกต้องด้วย govalidator ก่อนทำงานต่อ
	if ok, err := govalidator.ValidateStruct(employee); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// ค้นหา banktype ด้วย id
	var banktype entity.BankType
	db.First(&banktype, employee.BankType)
	if banktype.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบประเภทธนาคาร"})
		return
	}

	// ค้นหา role ด้วย id
	var role entity.Role
	db.First(&role, employee.RoleID)
	if role.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบตำแหน่ง"})
		return
	}

	hashedPassword, _ := config.HashPassword(employee.Password)

	// สร้าง Employee
	e := entity.Employee{
		FirstName:         employee.FirstName,
		LastName:          employee.LastName,
		Email:             employee.Email,
		NationalID:        employee.NationalID,
		PhoneNumber:       employee.PhoneNumber,
		Password:          hashedPassword,
		Profile:           employee.Profile,
		RoleID:            employee.RoleID,
		Role:              role,
		BankAccountNumber: employee.BankAccountNumber,
		BankTypeID:        employee.BankTypeID,
		BankType:          banktype,
	}

	if err := db.Create(&e).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "ลงทะเบียนพนักงานสำเร็จ"})

}