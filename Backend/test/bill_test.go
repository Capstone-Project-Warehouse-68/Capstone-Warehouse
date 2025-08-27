package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
	"time"
)

func TestBill(t *testing.T) {
	g := NewGomegaWithT(t)

	r := entity.Role{
		RoleName: "Admin",
	}

	b := entity.BankType{
		BankTypeName: "ABC",
	}

	s := entity.Supply{
		SupplyName:        "ABC",
		Address:           "XXX",
		PhoneNumberSale:   "01234567890",
		SaleName:          "ABC",
		BankTypeID:        uint(1),
		BankType:          b,
		BankAccountNumber: "01234567890",
		LineIDSale:        "ABC",
	}

	u := entity.Employee{
		FirstName:         "John",
		LastName:          "Doe",
		NationalID:        "1234567890123",        // เลขบัตรประชาชน 13 หลัก
		PhoneNumber:       "0812345678",           // เบอร์โทร
		Email:             "john.doe@example.com", // อีเมลต้องเป็นรูปแบบ email
		Profile:           "This is John's profile information.",
		Password:          "StrongPass123", // สมมุติรหัสผ่าน
		BankAccountNumber: "9876543210",    // สมมุติบัญชีธนาคาร
		BankTypeID:        uint(1),
		BankType:          b,
		RoleID:            uint(1),
		Role:              r,
	}

	t.Run(`Bill is valid`, func(t *testing.T) {
		e := entity.Bill{
			Title:        "Test",
			SupplyName:   "ABC",
			Supply:       s,
			DateImport:   time.Now(),
			SummaryPrice: 123,
			EmployeeID:   uint(1),
			Employee:     u,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Title is required`, func(t *testing.T) {
		e := entity.Bill{
			Title:        "", //ผิดตรงนี้
			SupplyName:   "ABC",
			Supply:       s,
			DateImport:   time.Now(),
			SummaryPrice: 123,
			EmployeeID:   uint(1),
			Employee:     u,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run(`supply_id is required`, func(t *testing.T) {
		e := entity.Bill{
			Title:        "Test",
			SupplyName:   "", //ผิดตรงนี้
			Supply:       s,
			DateImport:   time.Now(),
			SummaryPrice: 123,
			EmployeeID:   uint(1),
			Employee:     u,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SupplyID is required"))
	})

	t.Run(`date_import is required`, func(t *testing.T) {
		e := entity.Bill{
			Title:        "Test",
			SupplyName:   "ABC",
			Supply:       s,
			DateImport:   time.Time{}, //ผิดตรงนี้
			SummaryPrice: 123,
			EmployeeID:   uint(1),
			Employee:     u,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("DateImport is required"))
	})

	t.Run(`summary_price is required`, func(t *testing.T) {
		e := entity.Bill{
			Title:        "Test",
			SupplyName:   "ABC",
			Supply:       s,
			DateImport:   time.Now(),
			SummaryPrice: 0, //ผิดตรงนี้
			EmployeeID:   uint(1),
			Employee:     u,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SummaryPrice is required"))
	})

	t.Run(`employee_id is required`, func(t *testing.T) {
		e := entity.Bill{
			Title:        "Test",
			SupplyName:   "ABC",
			Supply:       s,
			DateImport:   time.Now(),
			SummaryPrice: 123,
			EmployeeID:   uint(0), //ผิดตรงนี้
			Employee:     u,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("EmployeeID is required"))
	})
}