package controller

import (
	"math"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ProductRequest struct {
	ProductName   string  `json:"ProductName"`
	ProductCode   string  `json:"ProductCode"`
	Quantity      int     `json:"Quantity"`
	PricePerPiece float64 `json:"PricePerPiece"`
	Discount      float64 `json:"Discount"`
}

type ProductCalculateResponse struct {
	ProductName     string  `json:"ProductName"`
	ProductCode     string  `json:"ProductCode"`
	Quantity        int     `json:"Quantity"`
	PricePerPiece   float64 `json:"PricePerPiece"`
	Discount        float64 `json:"Discount"`
	SumPriceProduct float64 `json:"SumPriceProduct"`
}

type BillCalculateResponse struct {
	Products     []ProductCalculateResponse `json:"products"`
	SummaryPrice float64                    `json:"SummaryPrice"`
}

// POST /calculate-price
func CalculatePriceHandler(c *gin.Context) {
	var req struct {
		Products []ProductRequest `json:"products"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	var respProducts []ProductCalculateResponse
	var summary float64 = 0

	for _, p := range req.Products {
		// ป้องกันค่า nil / undefined โดยตั้ง default
		qty := float64(p.Quantity)
		price := p.PricePerPiece
		discount := p.Discount

		sum := qty * price
		if discount > 0 {
			sum = sum - (sum * discount / 100.0)
		}

		// ปัดทศนิยม 2 ตำแหน่ง (round)
		sum = math.Round(sum*100) / 100

		respProducts = append(respProducts, ProductCalculateResponse{
			ProductName:     p.ProductName,
			ProductCode:     p.ProductCode,
			Quantity:        p.Quantity,
			PricePerPiece:   p.PricePerPiece,
			Discount:        p.Discount,
			SumPriceProduct: sum,
		})

		summary += sum
	}

	summary = math.Round(summary*100) / 100

	c.JSON(http.StatusOK, BillCalculateResponse{
		Products:     respProducts,
		SummaryPrice: summary,
	})
}
