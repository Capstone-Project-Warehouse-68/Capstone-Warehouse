package controller

import (
	_ "embed"
	"github.com/gin-gonic/gin"
)

var templateFile []byte

func DownloadTemplate(c *gin.Context) {
	filePath := "./Format_file_DataImport.xlsx"
	c.FileAttachment(filePath, "Format_file_DataImport.xlsx")
}
