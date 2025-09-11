package user
//
import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/asaskevich/govalidator"
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

type UpdateEmployeeDTO struct {
	FirstName string `json:"FirstName" valid:"required~FirstName is required"`
	LastName  string `json:"LastName" valid:"required~LastName is required"`
	Email     string `json:"Email" valid:"required~Email is required,email~Email must be valid"`
	Phone     string `json:"Phone" valid:"required~Phone is required,matches(^0[0-9]{9}$)~Phone must be 10 digits and start with 0"`
	Profile   string `json:"Profile" valid:"required~Profile is required"`
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

	var input UpdateEmployeeDTO
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง", "details": err.Error()})
		return
	}

	// ✅ Normalize
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	input.Phone = strings.TrimSpace(input.Phone)

	// ✅ Validate struct ตาม tag
	ok, err := govalidator.ValidateStruct(input)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ Check duplicate Email
	var existEmail entity.Employee
	if err := db.Where("email = ? AND id <> ?", input.Email, employee.ID).First(&existEmail).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "อีเมลล์ถูกใช้งานเเล้ว"})
		return
	}

	// ✅ Check duplicate Phone
	var existPhone entity.Employee
	if err := db.Where("phone = ? AND id <> ?", input.Phone, employee.ID).First(&existPhone).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "เบอร์โทรศัพท์ถูกใช้งานเเล้ว"})
		return
	}

	// ✅ Update เฉพาะ field ที่อนุญาต
	updateData := map[string]interface{}{
		"FirstName": input.FirstName,
		"LastName":  input.LastName,
		"Email":     input.Email,
		"Phone":     input.Phone,
		"Profile":   input.Profile,
	}

	if err := db.Model(&employee).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตข้อมูลไม่สำเร็จ", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลสำเร็จ", "user": employee})
}


func SignUpByUser(c *gin.Context) {
	var input entity.Employee

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// ✅ Normalize email & phone
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	input.Phone = strings.TrimSpace(input.Phone)

	// ✅ ตั้งค่า RoleID = 3 ก่อน validate
	input.RoleID = 3

	// ✅ Validate struct ตาม tag
	ok, err := govalidator.ValidateStruct(input)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	errors := make(map[string]string)

	// ✅ Check Email duplicate
	var existEmail entity.Employee
	if err := db.Where("email = ?", input.Email).First(&existEmail).Error; err == nil {
		errors["Email"] = "อีเมลล์ถูกใช้งานเเล้ว"
	}

	// ✅ Check Phone duplicate
	if input.Phone != "" {
		var existPhone entity.Employee
		if err := db.Where("phone = ?", input.Phone).First(&existPhone).Error; err == nil {
			errors["Phone"] = "เบอร์โทรศัพท์ถูกใช้งานเเล้ว"
		}
	}

	if len(errors) > 0 {
		c.JSON(http.StatusConflict, gin.H{"errors": errors})
		return
	}

	// ✅ Hash password
	hashedPassword, err := config.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing failed"})
		return
	}

	input.Password = hashedPassword

	if err := db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	input.Password = "" // ไม่ส่ง password กลับ

	c.JSON(http.StatusOK, input)
}



