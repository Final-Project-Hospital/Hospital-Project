package user

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func ServeImage(c *gin.Context) {

	filePath := c.Param("filename")


	fullFilePath := filepath.Join("uploads", filePath)


	if _, err := os.Stat(fullFilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบไฟล์"})
		return
	}


	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	c.File(fullFilePath)
}

func ListUsers(c *gin.Context) {
	var users []entity.Employee

	db := config.DB()

	db.Find(&users)

	c.JSON(http.StatusOK, &users)
}

func GetDataByUserID(c *gin.Context) {
	db := config.DB()
	idStr := c.Param("EmployeeID")

	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ EmployeeID"})
		return
	}

	EmployeeID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "EmployeeID ต้องเป็นตัวเลข"})
		return
	}

	var user entity.Employee
	err = db.Preload("Role").Preload("Position").First(&user, uint(EmployeeID)).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "ไม่พบผู้ใช้ที่มี EmployeeID ดังกล่าว",
				"details": "record not found",
				"id":      idStr,
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "เกิดข้อผิดพลาดในการดึงข้อมูล",
				"details": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "พบข้อมูลผู้ใช้",
		"user":    user,
	})
}

func UpdateEmployeeByID(c *gin.Context) {
	db := config.DB()
	idStr := c.Param("EmployeeID")

	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ EmployeeID"})
		return
	}

	EmployeeID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "EmployeeID ต้องเป็นตัวเลข"})
		return
	}

	var employee entity.Employee
	if err := db.First(&employee, uint(EmployeeID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้ที่มี EmployeeID ดังกล่าว"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูล", "details": err.Error()})
		}
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง", "details": err.Error()})
		return
	}

	if err := db.Model(&employee).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตข้อมูลไม่สำเร็จ", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "อัปเดตข้อมูลสำเร็จ",
		"user":    employee,
	})
}

func SignUpByUser(c *gin.Context) {
	var input entity.Employee

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	var exist entity.Employee
	if err := db.Where("email = ?", input.Email).First(&exist).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
		return
	}

	hashedPassword, err := config.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing failed"})
		return
	}

	input.Password = hashedPassword

	input.RoleID = 3

	if err := db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	input.Password = ""

	c.JSON(http.StatusOK, input)
}