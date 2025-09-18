package controller

import (
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"gorm.io/gorm"
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
		EMPCode:           employee.EMPCode,
		PhoneNumber:       employee.PhoneNumber,
		Password:          hashedPassword,
		Profile:           employee.Profile,
		RoleID:            employee.RoleID,
		Role:              role,
		BankAccountNumber: employee.BankAccountNumber,
		Line:              employee.Line,
		BankTypeID:        employee.BankTypeID,
		BankType:          banktype,
	}

	if err := db.Create(&e).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "ลงทะเบียนพนักงานสำเร็จ"})

}

func EmergencyResetPassword(c *gin.Context) {
	var employee entity.Employee
	employeeID := c.Param("id")

	// Struct for receiving JSON payload
	var payload struct {
		NewPassword     string `json:"NewPassword"`
	}

	db := config.DB()
	result := db.First(&employee, employeeID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบพนักงาน"})
		return
	}

	// Bind the incoming JSON to the payload struct
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash the new password
	hashedPassword, err := config.HashPassword(payload.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เข้ารหัส รหัสผ่านไม่สำเร็จ"})
		return
	}

	// Update the employee's password in the database
	result = db.Model(&employee).Update("password", hashedPassword)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เปลี่ยนรหัสผ่านไม่สำเร็จ"})
		return
	}

	// Respond with success message
	c.JSON(http.StatusOK, gin.H{"message": "รีเซ็ตรหัสผ่านสำเร็จ"})

}

func CheckEmail(c *gin.Context) {
	var employee entity.Employee
	Email := c.Param("email")

	db := config.DB()

	// Query for phone number in employee table
	employeeResult := db.Where("email = ?", Email).First(&employee)

	// Check if an error occurred in employee query (excluding "record not found")
	if employeeResult.Error != nil && employeeResult.Error != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": employeeResult.Error.Error()})
		return
	}

	// Check if the Email exists in either table
	if employeeResult.RowsAffected > 0 {
		// Email exists in either member or employee table
		c.JSON(http.StatusOK, gin.H{
			"isValid": false, // Indicating that the Email is already in use
		})
	} else {
		// Email does not exist in either table, it is valid for new registration
		c.JSON(http.StatusOK, gin.H{
			"isValid": true, // Indicating that the Email can be used
		})
	}
}

func CheckPhone(c *gin.Context) {
	var employee entity.Employee
	Phone := c.Param("phoneNumber")

	db := config.DB()

	// Query for phone number in employee table
	employeeResult := db.Where("phone_number = ?", Phone).First(&employee)

	// Check if an error occurred in employee query (excluding "record not found")
	if employeeResult.Error != nil && employeeResult.Error != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": employeeResult.Error.Error()})
		return
	}

	// Check if the phone number exists in either table
	if employeeResult.RowsAffected > 0 {
		// Phone number exists in either member or employee table
		c.JSON(http.StatusOK, gin.H{
			"isValid": false, // Indicating that the phone number is already in use
		})
	} else {
		// Phone number does not exist in either table, it is valid for new registration
		c.JSON(http.StatusOK, gin.H{
			"isValid": true, // Indicating that the phone number can be used
		})
	}
}
