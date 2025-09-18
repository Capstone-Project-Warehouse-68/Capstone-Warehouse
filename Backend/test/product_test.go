package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
)

func TestProject(t *testing.T){
	g := NewGomegaWithT(t)

	u := entity.UnitPerQuantity{
		NameOfUnit: "ABC",
	}

	c := entity.Category{
		CategoryName: "A",
	}

	z := entity.Zone{
		ZoneName: "ABC",
	}

	s := entity.Shelf{
		ShelfName: "ABC",
		ZoneID: 1,
		Zone: z,
	}

	t.Run(`product is valid`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "ABC",
			ProductName: "ABC",
			Description: "ABC",
			Quantity: 20,
			UnitPerQuantityID: uint(1),
			UnitPerQuantity: u,
			LimitQuantity: 5,
			SalePrice: 55.5,
			CategoryID: uint(1),
			Category: c,
			ShelfID: uint(1),
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`product_code is required`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "",//ผิดตรงนี้
			ProductName: "ABC",
			Description: "ABC",
			Quantity: 20,
			UnitPerQuantityID: uint(1),
			UnitPerQuantity: u,
			LimitQuantity: 5,
			SalePrice: 55.5,
			CategoryID: uint(1),
			Category: c,
			ShelfID: uint(1),
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ProductCode is required"))
	})

	t.Run(`product_name is required`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "ABC",
			ProductName: "",//ผิดตรงนี้
			Description: "ABC",
			Quantity: 20,
			UnitPerQuantityID: uint(1),
			UnitPerQuantity: u,
			LimitQuantity: 5,
			SalePrice: 55.5,
			CategoryID: uint(1),
			Category: c,
			ShelfID: uint(1),
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ProductName is required"))
	})

	t.Run(`description is required`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "ABC",
			ProductName: "ABC",
			Description: "",//ผิดตรงนี้
			Quantity: 20,
			UnitPerQuantityID: uint(1),
			UnitPerQuantity: u,
			LimitQuantity: 5,
			SalePrice: 55.5,
			CategoryID: uint(1),
			Category: c,
			ShelfID: uint(1),
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})

	t.Run(`quantity is required`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "ABC",
			ProductName: "ABC",
			Description: "ABC",
			Quantity: 0,//ผิดตรงนี้
			UnitPerQuantityID: uint(1),
			UnitPerQuantity: u,
			LimitQuantity: 5,
			SalePrice: 55.5,
			CategoryID: uint(1),
			Category: c,
			ShelfID: uint(1),
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Quantity is required"))
	})

	t.Run(`unit_per_quantity_id is required`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "ABC",
			ProductName: "ABC",
			Description: "ABC",
			Quantity: 20,
			UnitPerQuantityID: uint(0),//ผิดตรงนี้
			UnitPerQuantity: u,
			LimitQuantity: 5,
			SalePrice: 55.5,
			CategoryID: uint(1),
			Category: c,
			ShelfID: uint(1),
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("UnitPerQuantityID is required"))
	})

	t.Run(`limit_quantity is required`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "ABC",
			ProductName: "ABC",
			Description: "ABC",
			Quantity: 20,
			UnitPerQuantityID: uint(1),
			UnitPerQuantity: u,
			LimitQuantity: 0,//ผิดตรงนี้
			SalePrice: 55.5,
			CategoryID: uint(1),
			Category: c,
			ShelfID: uint(1),
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("LimitQuantity is required"))
	})

	t.Run(`sale_price is required`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "ABC",
			ProductName: "ABC",
			Description: "ABC",
			Quantity: 20,
			UnitPerQuantityID: uint(1),
			UnitPerQuantity: u,
			LimitQuantity: 5,
			SalePrice: 0,//ผิดตรงนี้
			CategoryID: uint(1),
			Category: c,
			ShelfID: uint(1),
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SalePrice is required"))
	})

	t.Run(`category_id is required`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "ABC",
			ProductName: "ABC",
			Description: "ABC",
			Quantity: 20,
			UnitPerQuantityID: uint(1),
			UnitPerQuantity: u,
			LimitQuantity: 5,
			SalePrice: 55.5,
			CategoryID: uint(0),//ผิดตรงนี้
			Category: c,
			ShelfID: uint(1),
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("CategoryID is required"))
	})

	t.Run(`shelf_id is required`, func(t *testing.T){
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductCode: "ABC",
			ProductName: "ABC",
			Description: "ABC",
			Quantity: 20,
			UnitPerQuantityID: uint(1),
			UnitPerQuantity: u,
			LimitQuantity: 5,
			SalePrice: 55.5,
			CategoryID: uint(1),
			Category: c,
			ShelfID: uint(0),//ผิดตรงนี้
			Shelf: s,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ShelfID is required"))
	})

}