package entity_test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"gorm.io/gorm"
)

func TestProject(t *testing.T) {
	g := NewGomegaWithT(t)

	u := entity.UnitPerQuantity{
		Model:      gorm.Model{ID: 1},
		NameOfUnit: "ABC",
	}

	c := entity.Category{
		Model:        gorm.Model{ID: 1},
		CategoryName: "A",
	}

	z := entity.Zone{
		Model:    gorm.Model{ID: 1},
		ZoneName: "ABC",
	}

	s := entity.Shelf{
		Model:     gorm.Model{ID: 1},
		ShelfName: "ABC",
		ZoneID:    1,
		Zone:      z,
	}

	b := entity.BankType{
		BankTypeName: "ABC",
	}

	sup := entity.Supply{
		SupplyName:        "ABC",
		SupplyAbbrev:      "ADN",
		Address:           "XXX",
		PhoneNumberSale:   "01234567890",
		SaleName:          "ABC",
		BankTypeID:        uint(1),
		BankType:          b,
		BankAccountNumber: "01234567890",
		LineIDSale:        "ABC",
	}

	t.Run(`product is valid`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "ABC",
			Description:       "ABC",
			Quantity:          20,
			UnitPerQuantityID: &u.ID,
			UnitPerQuantity:   u,
			LimitQuantity:     5,
			SalePrice:         55.5,
			CategoryID:        &c.ID,
			Category:          c,
			ShelfID:           &s.ID,
			Shelf:             s,
			SupplyID:          uint(1),
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`product_name is required`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "", //ผิดตรงนี้
			Description:       "ABC",
			Quantity:          20,
			UnitPerQuantityID: &u.ID,
			UnitPerQuantity:   u,
			LimitQuantity:     5,
			SalePrice:         55.5,
			CategoryID:        &c.ID,
			Category:          c,
			ShelfID:           &s.ID,
			Shelf:             s,
			SupplyID:          uint(1),
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ProductName is required"))
	})

	t.Run(`description is required`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "ABC",
			Description:       "", //ผิดตรงนี้
			Quantity:          20,
			UnitPerQuantityID: &u.ID,
			UnitPerQuantity:   u,
			LimitQuantity:     5,
			SalePrice:         55.5,
			CategoryID:        &c.ID,
			Category:          c,
			ShelfID:           &s.ID,
			Shelf:             s,
			SupplyID:          uint(1),
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})

	t.Run(`quantity is required`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "ABC",
			Description:       "ABC",
			Quantity:          0, //ผิดตรงนี้
			UnitPerQuantityID: &u.ID,
			UnitPerQuantity:   u,
			LimitQuantity:     5,
			SalePrice:         55.5,
			CategoryID:        &c.ID,
			Category:          c,
			ShelfID:           &s.ID,
			Shelf:             s,
			SupplyID:          uint(1),
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Quantity is required"))
	})

	t.Run(`unit_per_quantity_id is required`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "ABC",
			Description:       "ABC",
			Quantity:          20,
			UnitPerQuantityID: nil, //ผิดตรงนี้
			UnitPerQuantity:   u,
			LimitQuantity:     5,
			SalePrice:         55.5,
			CategoryID:        &c.ID,
			Category:          c,
			ShelfID:           &s.ID,
			Shelf:             s,
			SupplyID:          uint(1),
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("UnitPerQuantityID is required"))
	})

	t.Run(`limit_quantity is required`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "ABC",
			Description:       "ABC",
			Quantity:          20,
			UnitPerQuantityID: &u.ID,
			UnitPerQuantity:   u,
			LimitQuantity:     0, //ผิดตรงนี้
			SalePrice:         55.5,
			CategoryID:        &c.ID,
			Category:          c,
			ShelfID:           &s.ID,
			Shelf:             s,
			SupplyID:          uint(1),
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("LimitQuantity is required"))
	})

	t.Run(`sale_price is required`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "ABC",
			Description:       "ABC",
			Quantity:          20,
			UnitPerQuantityID: &u.ID,
			UnitPerQuantity:   u,
			LimitQuantity:     5,
			SalePrice:         0, //ผิดตรงนี้
			CategoryID:        &c.ID,
			Category:          c,
			ShelfID:           &s.ID,
			Shelf:             s,
			SupplyID:          uint(1),
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SalePrice is required"))
	})

	t.Run(`category_id is required`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "ABC",
			Description:       "ABC",
			Quantity:          20,
			UnitPerQuantityID: &u.ID,
			UnitPerQuantity:   u,
			LimitQuantity:     5,
			SalePrice:         55.5,
			CategoryID:        nil, //ผิดตรงนี้
			Category:          c,
			ShelfID:           &s.ID,
			Shelf:             s,
			SupplyID:          uint(1),
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("CategoryID is required"))
	})

	t.Run(`shelf_id is required`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "ABC",
			Description:       "ABC",
			Quantity:          20,
			UnitPerQuantityID: &u.ID,
			UnitPerQuantity:   u,
			LimitQuantity:     5,
			SalePrice:         55.5,
			CategoryID:        &c.ID,
			Category:          c,
			ShelfID:           nil, //ผิดตรงนี้
			Shelf:             s,
			SupplyID:          uint(1),
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ShelfID is required"))
	})

	t.Run(`supply_id is required`, func(t *testing.T) {
		e := entity.Product{
			SupplyProductCode: "ABC",
			ProductName:       "ABC",
			Description:       "ABC",
			Quantity:          20,
			UnitPerQuantityID: &u.ID,
			UnitPerQuantity:   u,
			LimitQuantity:     5,
			SalePrice:         55.5,
			CategoryID:        &c.ID,
			Category:          c,
			ShelfID:           &s.ID,
			Shelf:             s,
			SupplyID:          uint(0), //ผิดตรงนี้ 
			Supply:            sup,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SupplyID is required"))
	})

}
