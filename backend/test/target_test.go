package unit

import (
	"testing"

	"github.com/Tawunchai/hospital-project/entity"
	. "github.com/onsi/gomega"
)

func TestTargetValidate(t *testing.T) {
	g := NewGomegaWithT(t)

	// Single value valid: MiddleTarget มีค่า ถูกต้อง
	target1 := &entity.Target{MiddleTarget: 30}
	ok, msg := target1.Validate()
	g.Expect(ok).To(BeTrue(), msg)

	// Range valid: MinTarget และ MaxTarget ถูกต้อง
	target2 := &entity.Target{MinTarget: 10, MaxTarget: 100}
	ok, msg = target2.Validate()
	g.Expect(ok).To(BeTrue(), msg)

	// Negative MinTarget invalid: MinTarget ติดลบไม่ถูกต้อง
	target3 := &entity.Target{MinTarget: -5, MaxTarget: 50}
	ok, msg = target3.Validate()
	g.Expect(ok).To(BeFalse(), "Negative MinTarget should fail")

	// Negative MaxTarget invalid: MaxTarget ติดลบไม่ถูกต้อง
	target4 := &entity.Target{MinTarget: 0, MaxTarget: -10}
	ok, msg = target4.Validate()
	g.Expect(ok).To(BeFalse(), "Negative MaxTarget should fail")

	// Max < Min invalid: MaxTarget น้อยกว่า MinTarget ไม่ถูกต้อง
	target5 := &entity.Target{MinTarget: 50, MaxTarget: 10}
	ok, msg = target5.Validate()
	g.Expect(ok).To(BeFalse(), "MaxTarget < MinTarget should fail")

	// Negative MiddleTarget invalid: MiddleTarget ติดลบไม่ถูกต้อง
	target6 := &entity.Target{MiddleTarget: -20}
	ok, msg = target6.Validate()
	g.Expect(ok).To(BeFalse(), "Negative MiddleTarget should fail")

	// MiddleTarget + Range present: ถ้าไม่อนุญาตให้ใส่พร้อมกัน ต้อง fail
	target7 := &entity.Target{MiddleTarget: 15, MinTarget: 10, MaxTarget: 20}
	ok, msg = target7.Validate()
	g.Expect(ok).To(BeFalse(), "MiddleTarget + Range should fail if not allowed")

	// Range incomplete (missing MaxTarget): ขาด MaxTarget ต้อง fail
	target8 := &entity.Target{MinTarget: 10}
	ok, msg = target8.Validate()
	g.Expect(ok).To(BeFalse(), "Incomplete range should fail")

	// Range incomplete (missing MinTarget): ขาด MinTarget ต้อง fail
	target9 := &entity.Target{MaxTarget: 100}
	ok, msg = target9.Validate()
	g.Expect(ok).To(BeFalse(), "Incomplete range should fail")

	// All default values: ไม่ได้ตั้งค่าใด ๆ ต้อง fail
	target10 := &entity.Target{}
	ok, msg = target10.Validate()
	g.Expect(ok).To(BeFalse(), "No target values set should fail")
}
