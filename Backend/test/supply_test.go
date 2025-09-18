package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
)

func TestSupply(t *testing.T){
	g := NewGomegaWithT(t)

	b := entity.BankType{
		BankTypeName: "ABC",
	}
	
	t.Run(`Supply is valid`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "ABC",
			SupplyAbbrev: "ABC",
			Address: "XXX",
			PhoneNumberSale: "01234567890",
			SaleName: "ABC",
			BankTypeID: uint(1),
			BankType: b,
			BankAccountNumber: "01234567890",
			LineIDSale: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`supply_name is required`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "",//ผิดตรงนี้
			SupplyAbbrev: "ABC",
			Address: "XXX",
			PhoneNumberSale: "01234567890",
			SaleName: "ABC",
			BankTypeID: uint(1),
			BankType: b,
			BankAccountNumber: "01234567890",
			LineIDSale: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SupplyName is required"))
	})

	t.Run(`supply_abbrev is required`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "ABC",
			SupplyAbbrev: "", //ผิดตรงนี้
			Address: "XXX",
			PhoneNumberSale: "01234567890",
			SaleName: "ABC",
			BankTypeID: uint(1),
			BankType: b,
			BankAccountNumber: "01234567890",
			LineIDSale: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SupplyAbbrev is required"))
	})

	t.Run(`supply_abbrev must be 2-3 character`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "ABC",
			SupplyAbbrev: "a", //ผิดตรงนี้
			Address: "XXX",
			PhoneNumberSale: "01234567890",
			SaleName: "ABC",
			BankTypeID: uint(1),
			BankType: b,
			BankAccountNumber: "01234567890",
			LineIDSale: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SupplyAbbrev must be 2-3 characters"))
	})

	t.Run(`address is required`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "ABC",
			SupplyAbbrev: "ABC",
			Address: "",//ผิดตรงนี้
			PhoneNumberSale: "01234567890",
			SaleName: "ABC",
			BankTypeID: uint(1),
			BankType: b,
			BankAccountNumber: "01234567890",
			LineIDSale: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Address is required"))
	})

	t.Run(`phone_number_sale is required`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "ABC",
			SupplyAbbrev: "ABC",
			Address: "XXX",
			PhoneNumberSale: "",//ผิดตรงนี้
			SaleName: "ABC",
			BankTypeID: uint(1),
			BankType: b,
			BankAccountNumber: "01234567890",
			LineIDSale: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("PhoneNumberSale is required"))
	})

	t.Run(`sale_name is required`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "ABC",
			SupplyAbbrev: "ABC",
			Address: "XXX",
			PhoneNumberSale: "01234567890",
			SaleName: "",//ผิดตรงนี้
			BankTypeID: uint(1),
			BankType: b,
			BankAccountNumber: "01234567890",
			LineIDSale: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SaleName is required"))
	})

	t.Run(`bank_type_id is required`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "ABC",
			SupplyAbbrev: "ABC",
			Address: "XXX",
			PhoneNumberSale: "01234567890",
			SaleName: "ABC",
			BankTypeID: uint(0),//ผิดตรงนี้
			BankType: b,
			BankAccountNumber: "01234567890",
			LineIDSale: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("BankTypeID is required"))
	})

	t.Run(`bank_account_number is required`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "ABC",
			SupplyAbbrev: "ABC",
			Address: "XXX",
			PhoneNumberSale: "01234567890",
			SaleName: "ABC",
			BankTypeID: uint(1),
			BankType: b,
			BankAccountNumber: "",//ผิดตรงนี้
			LineIDSale: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("BankAccountNumber is required"))
	})

	t.Run(`line_id_sale is required`, func(t *testing.T){
		e := entity.Supply{
			SupplyName: "ABC",
			SupplyAbbrev: "ABC",
			Address: "XXX",
			PhoneNumberSale: "01234567890",
			SaleName: "ABC",
			BankTypeID: uint(1),
			BankType: b,
			BankAccountNumber: "01234567890",
			LineIDSale: "",//ผิดตรงนี้
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("LineIDSale is required"))
	})
}