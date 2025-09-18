package controller

import (
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func DownloadTemplate(c *gin.Context) {
	// ชื่อไฟล์ fix
	fileName := "Format_file_DataImport.xlsx"

	// path เดียวกับ main.go
	filePath := filepath.Join(".", fileName)

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

	c.File(filePath)
}
