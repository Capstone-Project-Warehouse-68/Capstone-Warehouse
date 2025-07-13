package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/project_capstone/WareHouse/config"
	"github.com/project_capstone/WareHouse/entity"
	"net/http"
)

func GetAllEmployee(c *gin.Context) {
	db := config.DB()
	var employee []entity.Employee
	db.Find(&employee)
	c.JSON(http.StatusOK, &employee)
}

func DeleteEmployee(c *gin.Context) {
	EmployeeID := c.Param("id")
	db := config.DB()

	if tx := db.Exec("DELETE FROM employees WHERE id = ?", EmployeeID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่ข้อมูลพนักงาน"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลพนักงานเสร็จสิ้น"})
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
	var createemployee entity.Employee

	if err := c.ShouldBindJSON(&createemployee); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูล"})
		return
	}

	db := config.DB()
	if err := db.Create(&createemployee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการสร้างข้อมูลพนักงาน"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "สร้างข้อมูลพนักงานเสร็จสิ้น", "employee": createemployee})
}