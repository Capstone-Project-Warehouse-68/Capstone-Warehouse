package entity_test

import (
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/project_capstone/WareHouse/entity"
	"testing"
)

func TestShelf(t *testing.T){
	g := NewGomegaWithT(t)
	
	z := entity.Zone{
		ZoneName: "ABC",
	}

	t.Run(`Shelf is valid`, func(t *testing.T){
		e := entity.Shelf{
			ShelfName: "ABC",
			ZoneID: 1,
			Zone: z,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`shelf_name is required`, func(t *testing.T){
		e := entity.Shelf{
			ShelfName: "", // ผิดตรงนี้
			ZoneID: 1,
			Zone: z,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ShelfName is required"))
	})

	t.Run(`shelf_name is required`, func(t *testing.T){
		e := entity.Shelf{
			ShelfName: "ABC", 
			ZoneID: uint(0), // ผิดตรงนี้
			Zone: z,
		}
		ok, err := govalidator.ValidateStruct(e)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ZoneID is required"))
	})
}