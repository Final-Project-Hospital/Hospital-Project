package selectBoxAll

import (
	"math"
	"net/http"
	"strconv"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// BeforeAfterTreatment
func ListBeforeAfterTreatment(c *gin.Context) {
	var list []entity.BeforeAfterTreatment

	if err := config.DB().Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, list)
}

// Unit
func ListUnit(c *gin.Context) {
	var list []entity.Unit

	if err := config.DB().Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, list)
}

// Standard  เก่า
func ListStandard(c *gin.Context) {
	var list []entity.Standard

	if err := config.DB().Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, list)
}

// Standard ใหม่
func ListMiddleStandard(c *gin.Context) {
	var list []entity.Standard

	if err := config.DB().
		Where("min_value = ? AND max_value = ?", -1, -1).
		Order("middle_value ASC").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลค่าเดี่ยวได้"})
		return
	}
	// ปัดทศนิยม 2 ตำแหน่ง สำหรับ float32 แบบ half-up
	for i := range list {
		list[i].MiddleValue = float32(math.Floor(float64(list[i].MiddleValue)*100+0.5) / 100)
	}
	c.JSON(http.StatusOK, list)
}

func ListRangeStandard(c *gin.Context) {
	var list []entity.Standard

	if err := config.DB().
		Where("middle_value = ?", -1).
		Order("min_value ASC").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลค่าช่วงได้"})
		return
	}
	// ปัดทศนิยม 2 ตำแหน่ง สำหรับ float32 แบบ half-up
	for i := range list {
		list[i].MinValue = float32(math.Floor(float64(list[i].MinValue)*100+0.5) / 100)
		list[i].MaxValue = float32(math.Floor(float64(list[i].MaxValue)*100+0.5) / 100)
	}
	c.JSON(http.StatusOK, list)
}

// เพิ่ม middle standard
func AddMiddleStandard(c *gin.Context) {
	var input map[string]interface{}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	middleVal, ok := input["MiddleValue"].(float64)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "MiddleValue ต้องเป็นตัวเลข"})
		return
	}
	minVal, _ := input["MinValue"].(float64)
	maxVal, _ := input["MaxValue"].(float64)

	// แปลง float64 → decimal และปัด 2 ตำแหน่ง
	middle := decimal.NewFromFloat(middleVal).Round(2)
	min := decimal.NewFromFloat(minVal).Round(2)
	max := decimal.NewFromFloat(maxVal).Round(2)

	std := entity.Standard{
		MiddleValue: float32(middle.InexactFloat64()),
		MinValue:    float32(min.InexactFloat64()),
		MaxValue:    float32(max.InexactFloat64()),
	}

	if err := config.DB().Create(&std).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลค่าเดี่ยวได้"})
		return
	}
	c.JSON(http.StatusCreated, std)
}

// เพิ่ม range standard
func AddRangeStandard(c *gin.Context) {
	var input map[string]interface{}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	minVal, okMin := input["MinValue"].(float64)
	maxVal, okMax := input["MaxValue"].(float64)
	if !okMin || !okMax {
		c.JSON(http.StatusBadRequest, gin.H{"error": "MinValue และ MaxValue ต้องเป็นตัวเลข"})
		return
	}
	middleVal, _ := input["MiddleValue"].(float64)

	// แปลง float64 → decimal และปัด 2 ตำแหน่ง
	middle := decimal.NewFromFloat(middleVal).Round(2)
	min := decimal.NewFromFloat(minVal).Round(2)
	max := decimal.NewFromFloat(maxVal).Round(2)

	std := entity.Standard{
		MiddleValue: float32(middle.InexactFloat64()),
		MinValue:    float32(min.InexactFloat64()),
		MaxValue:    float32(max.InexactFloat64()),
	}

	if err := config.DB().Create(&std).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลค่าช่วงได้"})
		return
	}
	c.JSON(http.StatusCreated, std)
}

// GetStandardByID ดึงข้อมูล Standard ตาม ID
func GetStandardByID(c *gin.Context) {
	var standard entity.Standard

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid standard ID"})
		return
	}

	if err := config.DB().First(&standard, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลมาตรฐาน"})
		return
	}

	c.JSON(http.StatusOK, standard)
}

// Target
// ฟังก์ชันช่วยปัด decimal เป็น 2 ตำแหน่ง
func RoundTwoDecimal(v float64) float64 {
	d := decimal.NewFromFloat(v)
	return d.Round(2).InexactFloat64()
}

func ListMiddleTarget(c *gin.Context) {
	var list []entity.Target

	if err := config.DB().
		Where("min_target = ? AND max_target = ?", 0, 0).
		Order("middle_target ASC").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลค่าเดี่ยวได้"})
		return
	}
	// ปัดทศนิยม 2 ตำแหน่ง
	for i := range list {
		list[i].MiddleTarget = RoundTwoDecimal(list[i].MiddleTarget)
	}
	c.JSON(http.StatusOK, list)
}

func ListRangeTarget(c *gin.Context) {
	var listT []entity.Target

	if err := config.DB().
		Where("middle_target = ?", 0).
		Order("min_target ASC").
		Find(&listT).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลค่าช่วงได้"})
		return
	}
	// ปัดทศนิยม 2 ตำแหน่ง
	for i := range listT {
		listT[i].MinTarget = RoundTwoDecimal(listT[i].MinTarget)
		listT[i].MaxTarget = RoundTwoDecimal(listT[i].MaxTarget)
	}
	c.JSON(http.StatusOK, listT)
}

// เพิ่ม middle Target
func AddMiddleTarget(c *gin.Context) {
	var input map[string]interface{}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	middleTarget, ok := input["MiddleTarget"].(float64)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "MiddleTarget ต้องเป็นตัวเลข"})
		return
	}
	minTarget, _ := input["MinTarget"].(float64)
	maxTarget, _ := input["MaxTarget"].(float64)

	std := entity.Target{
		MiddleTarget: float64(middleTarget),
		MinTarget:    float64(minTarget),
		MaxTarget:    float64(maxTarget),
	}
	if err := config.DB().Create(&std).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลค่าเดี่ยวได้"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"ID":           std.ID,
		"MiddleTarget": std.MiddleTarget,
		"MinTarget":    std.MinTarget,
		"MaxTarget":    std.MaxTarget,
	})
}

// เพิ่ม range Target
func AddRangeTarget(c *gin.Context) {
	var input map[string]interface{}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	minTarget, okMin := input["MinTarget"].(float64)
	maxTarget, okMax := input["MaxTarget"].(float64)
	if !okMin || !okMax {
		c.JSON(http.StatusBadRequest, gin.H{"error": "MinTarget และ MaxTarget ต้องเป็นตัวเลข"})
		return
	}

	middleTarget, _ := input["MiddleTarget"].(float64)
	std := entity.Target{
		MiddleTarget: float64(middleTarget),
		MinTarget:    float64(minTarget),
		MaxTarget:    float64(maxTarget),
	}
	if err := config.DB().Create(&std).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลค่าช่วงได้"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"ID":           std.ID,
		"MiddleTarget": std.MiddleTarget,
		"MinTarget":    std.MinTarget,
		"MaxTarget":    std.MaxTarget,
	})
}

// GetTargetByID ดึงข้อมูล Target ตาม ID
func RoundTwoDecimalByID(value float64) float64 {
	return decimal.NewFromFloat(value).Round(2).InexactFloat64()
}
func GetTargetByID(c *gin.Context) {
	var target entity.Target
	// แปลง ID
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID"})
		return
	}
	// ดึงข้อมูลจาก DB
	if err := config.DB().First(&target, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลมาตรฐาน"})
		return
	}
	// ปัดทศนิยม 2 ตำแหน่ง
	target.MinTarget = RoundTwoDecimalByID(target.MinTarget)
	target.MaxTarget = RoundTwoDecimalByID(target.MaxTarget)
	target.MiddleTarget = RoundTwoDecimalByID(target.MiddleTarget)
	c.JSON(http.StatusOK, target)
}

// ListStatus
func ListStatus(c *gin.Context) {
	var list []entity.Status
	statusNames := []string{"ไม่ผ่านเกณฑ์มาตรฐาน", "ผ่านเกณฑ์มาตรฐาน"}

	if err := config.DB().Where("status_name IN ?", statusNames).Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, list)
}

func ListStatusGarbage(c *gin.Context) {
	var list []entity.Status
	statusNames := []string{"สำเร็จตามเป้าหมาย", "ไม่สำเร็จตามเป้าหมาย"}

	if err := config.DB().Where("status_name IN ?", statusNames).Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, list)
}
