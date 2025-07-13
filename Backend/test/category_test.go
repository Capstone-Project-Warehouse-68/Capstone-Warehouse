package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
)

func TestCategory(t *testing.T){
	g := NewGomegaWithT(t)

	t.Run(`Category is valid`, func(t *testing.T){
		e := entity.Category{
			CategoryName: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`category_name is required`, func(t *testing.T){
		e := entity.Category{
			CategoryName: "",//ผิดตรงนี้
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("CateGoryName is required"))
	})
}