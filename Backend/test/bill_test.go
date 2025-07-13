package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
	"time"
)

func TestBill(t *testing.T){
	g := NewGomegaWithT(t)

	b := entity.BankType{
		BankTypeName: "ABC",
	}

	s := entity.Supply{
		SupplyName: "ABC",
		Address: "XXX",
		PhoneNumberSale: "01234567890",
		SaleName: "ABC",
		BankTypeID: uint(1),
		BankType: b,
		BankAccountNumber: "01234567890",
		LineIDSale: "ABC",
	}

	t.Run(`Bill is valid`, func(t *testing.T){
		e := entity.Bill{
			SupplyID: uint(1),
			Supply: s,
			DateImport: time.Now() ,
			SummaryPrice: 123,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`supply_id is required`, func(t *testing.T){
		e := entity.Bill{
			SupplyID: uint(0),//ผิดตรงนี้
			Supply: s,
			DateImport: time.Now() ,
			SummaryPrice: 123,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SupplyID is required"))
	})

	t.Run(`date_import is required`, func(t *testing.T){
		e := entity.Bill{
			SupplyID: uint(1),
			Supply: s,
			DateImport: time.Time{} ,//ผิดตรงนี้
			SummaryPrice: 123,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("DateImport is required"))
	})

	t.Run(`summary_price is required`, func(t *testing.T){
		e := entity.Bill{
			SupplyID: uint(1),
			Supply: s,
			DateImport: time.Now() ,
			SummaryPrice: 0, //ผิดตรงนี้
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SummaryPrice is required"))
	})
}