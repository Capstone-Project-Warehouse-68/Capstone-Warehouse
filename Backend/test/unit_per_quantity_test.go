package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
)

func TestUnit(t *testing.T){
	g := NewGomegaWithT(t)
	
	t.Run(`NameOfUnit is valid`, func(t *testing.T){
		e := entity.UnitPerQuantity{
			NameOfUnit: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`name_of_unit is required`, func(t *testing.T){
		e := entity.UnitPerQuantity{
			NameOfUnit: "",//ผิดตรงนี้
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("NameOfUnit is required"))
	})

}