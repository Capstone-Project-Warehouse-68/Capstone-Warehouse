package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
)

func TestCoupon(t *testing.T){
	g := NewGomegaWithT(t)

	t.Run(`Coupon is valid`, func(t *testing.T){
		e := entity.Coupon{
			Code: "ABC",
			Discount: 123,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`code is required`, func(t *testing.T){
		e := entity.Coupon{
			Code: "",//ผิดตรงนี้
			Discount: 123,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("code is required"))
	})

	t.Run(`discount is required`, func(t *testing.T){
		e := entity.Coupon{
			Code: "ABC",
			Discount: 0,//ผิดตรงนี้
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("discount is required"))
	})
}