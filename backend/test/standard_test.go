package unit

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestStandardValidate(t *testing.T) {
    g := NewGomegaWithT(t)

    // Single value valid: MiddleValue มีค่า ถูกต้อง
    std1 := &entity.Standard{MiddleValue: 50}
    ok, msg := std1.Validate()
    g.Expect(ok).To(BeTrue(), msg)

    // Range valid: MinValue และ MaxValue ถูกต้อง
    std2 := &entity.Standard{MinValue: 10, MaxValue: 100}
    ok, msg = std2.Validate()
    g.Expect(ok).To(BeTrue(), msg)

    // Negative MinValue invalid: MinValue ติดลบไม่ถูกต้อง
    std3 := &entity.Standard{MinValue: -5, MaxValue: 100}
    ok, msg = std3.Validate()
    g.Expect(ok).To(BeFalse(), "Negative MinValue should fail")

    // Negative MaxValue invalid: MaxValue ติดลบไม่ถูกต้อง
    std4 := &entity.Standard{MinValue: 0, MaxValue: -10}
    ok, msg = std4.Validate()
    g.Expect(ok).To(BeFalse(), "Negative MaxValue should fail")

    // Max < Min invalid: MaxValue น้อยกว่า MinValue ไม่ถูกต้อง
    std5 := &entity.Standard{MinValue: 50, MaxValue: 10}
    ok, msg = std5.Validate()
    g.Expect(ok).To(BeFalse(), "MaxValue < MinValue should fail")

    // MiddleValue invalid: MiddleValue ติดลบไม่ถูกต้อง
    std6 := &entity.Standard{MiddleValue: -20}
    ok, msg = std6.Validate()
    g.Expect(ok).To(BeFalse(), "Negative MiddleValue should fail")

    // MiddleValue + Range present: ไม่อนุญาตให้ใส่พร้อมกัน ต้อง fail
    std7 := &entity.Standard{MiddleValue: 30, MinValue: 10, MaxValue: 50}
    ok, msg = std7.Validate()
    g.Expect(ok).To(BeFalse(), "MiddleValue + Range should fail if not allowed")

    // Range incomplete (missing MaxValue)
    std8 := &entity.Standard{MinValue: 10}
    ok, msg = std8.Validate()
    g.Expect(ok).To(BeFalse(), "Incomplete range should fail")

    // Range incomplete (missing MinValue)
    std9 := &entity.Standard{MaxValue: 100}
    ok, msg = std9.Validate()
    g.Expect(ok).To(BeFalse(), "Incomplete range should fail")

    // All default values: ไม่ได้ตั้งค่าใด ๆ ต้อง fail
    std10 := &entity.Standard{}
    ok, msg = std10.Validate()
    g.Expect(ok).To(BeFalse(), "No standard values set should fail")
}
