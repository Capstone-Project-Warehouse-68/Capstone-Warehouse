package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
)

func TestZone(t *testing.T){
	g := NewGomegaWithT(t)
	
	t.Run(`Zone is valid`, func(t *testing.T){
		e := entity.Zone{
			ZoneName: "ABC",
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`zone_name is required`, func(t *testing.T){
		e := entity.Zone{
			ZoneName: "",//ผิดตรงนี้
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ZoneName is required"))
	})

}