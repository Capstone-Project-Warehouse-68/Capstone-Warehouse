package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
)

func TestEmployee(t *testing.T){
	g := NewGomegaWithT(t)

	t.Run(`employee is valid`, func(t *testing.T){
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`first_name is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "", //ผิดตรงนี้
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("FirstName is required"))
	})

	t.Run(`last_name is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "", //ผิดตรงนี้
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("LastName is required"))
	})

	t.Run(`national_id is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "", //ผิดตรงนี้
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("NationalID is required"))
	})

	t.Run(`phone_number is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "",//ผิดตรงนี้
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("PhoneNumber is required"))
	})
 
	t.Run(`email is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "", //ผิดตรงนี้
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Email is required"))
	})

	t.Run(`email is invalid`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@.com", //ผิดตรงนี้
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Email is invalid"))
	})
 
	t.Run(`profile is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "",//ผิดตรงนี้
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Profile is required"))
	})
 
	t.Run(`password is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "",//ผิดตรงนี้
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Password is required"))
	})
 
	t.Run(`bank_type_id is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(0),//ผิดตรงนี้
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("BankTypeID is required"))
	})
 
	t.Run(`bank_account_number is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "",//ผิดตรงนี้
			Line: "ABC",
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("BankAccountNumber is required"))
	})

	t.Run(`bank_account_number is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "",//ผิดตรงนี้
			RoleID: uint(1),
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Line is required"))
	})
 
	t.Run(`role_id is required`, func(t *testing.T) {
		e := entity.Employee{
			FirstName: "Thanawit",
			LastName: "Yangngam",
			NationalID: "1223344556678",
			PhoneNumber: "0123456789",
			Email: "Th@gmail.com",
			Profile: "longtext",
			Password: "12345",
			BankTypeID:	uint(1),
			BankAccountNumber: "1234567890",
			Line: "ABC",
			RoleID: uint(0),//ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RoleID is required"))
	})
 
}