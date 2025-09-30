package controller

import (
	_ "embed"
	"github.com/gin-gonic/gin"
)

var templateFile []byte

func DownloadTemplate(c *gin.Context) {
	fileName := "Format_file_DataImport.xlsx"
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Data(200, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", templateFile)
}
