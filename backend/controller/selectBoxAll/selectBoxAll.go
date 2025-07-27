package selectBoxAll

import (
	"net/http"
    "strconv"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
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
		Where("min_value = ? AND max_value = ?", 0, 0).
		Order("middle_value ASC").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลค่าเดี่ยวได้"})
		return
	}

	c.JSON(http.StatusOK, list)
}

func ListRangeStandard(c *gin.Context) {
	var list []entity.Standard

	if err := config.DB().
		Where("middle_value = ?", 0).
		Order("min_value ASC").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลค่าช่วงได้"})
		return
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

    middleValue, ok := input["MiddleValue"].(float64)
    if !ok {
        c.JSON(http.StatusBadRequest, gin.H{"error": "MiddleValue ต้องเป็นตัวเลข"})
        return
    }

    minValue, _ := input["MinValue"].(float64)
    maxValue, _ := input["MaxValue"].(float64)

    std := entity.Standard{
        MiddleValue: float32(middleValue),
        MinValue:    float32(minValue),
        MaxValue:    float32(maxValue),
    }

    if err := config.DB().Create(&std).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลค่าเดี่ยวได้"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "ID":          std.ID,
        "MiddleValue": std.MiddleValue,
        "MinValue":    std.MinValue,
        "MaxValue":    std.MaxValue,
    })
}
// เพิ่ม range standard
func AddRangeStandard(c *gin.Context) {
    var input map[string]interface{}
    if err := c.BindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    minValue, okMin := input["MinValue"].(float64)
    maxValue, okMax := input["MaxValue"].(float64)
    if !okMin || !okMax {
        c.JSON(http.StatusBadRequest, gin.H{"error": "MinValue และ MaxValue ต้องเป็นตัวเลข"})
        return
    }

    middleValue, _ := input["MiddleValue"].(float64) // อาจไม่มีค่า

    std := entity.Standard{
        MiddleValue: float32(middleValue),
        MinValue:    float32(minValue),
        MaxValue:    float32(maxValue),
    }

    if err := config.DB().Create(&std).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลค่าช่วงได้"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "ID":          std.ID,
        "MiddleValue": std.MiddleValue,
        "MinValue":    std.MinValue,
        "MaxValue":    std.MaxValue,
    })
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
