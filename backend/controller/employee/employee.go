package employee

import (
	"net/http"
	"strconv"
	"strings"
	"encoding/base64"
	"io/ioutil"
	"golang.org/x/crypto/bcrypt"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

func UpdateRole(c *gin.Context) {
	id := c.Param("id")

	var body struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	roleName := strings.Title(strings.ToLower(body.Role))

	validRoles := map[string]bool{
		"Admin": true,
		"Employee":  true,
		"Guest": true,
	}
	if !validRoles[roleName] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	db := config.DB()

	var employee entity.Employee
	if err := db.First(&employee, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	var role entity.Role
	if err := db.Where("role_name = ?", roleName).First(&role).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role not found in database"})
		return
	}

	// ✅ อัปเดตโดยตรง
	if err := db.Model(&employee).Update("RoleID", role.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role updated successfully",
	})
}


func GetEmployees(c *gin.Context) {
	var employees []entity.Employee

	if err := config.DB().Preload("Role").Preload("Position").Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลพนักงานได้"})
		return
	}

	c.JSON(http.StatusOK, employees)
}

// UpdateEmployeeInfo แก้ไขข้อมูลพนักงาน (PUT /api/employees/:id)
func UpdateEmployeeInfo(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	// รับ multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	form := c.Request.MultipartForm
	firstName := form.Value["firstName"]
	lastName := form.Value["lastName"]
	email := form.Value["email"]
	phone := form.Value["phone"]
	password := form.Value["password"] // new password
	positionID := form.Value["positionID"]
	roleID := form.Value["roleID"]

	if len(firstName) == 0 || len(lastName) == 0 || len(email) == 0 || len(phone) == 0 || len(positionID) == 0 || len(roleID) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	var employee entity.Employee
	if err := db.First(&employee, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	employee.FirstName = firstName[0]
	employee.LastName = lastName[0]
	employee.Email = email[0]
	employee.Phone = phone[0]

	// เปลี่ยน password ถ้ามีการกรอกใหม่
	if len(password) > 0 && password[0] != "" {
		employee.Password = password[0] // 🔐 คุณควรเข้ารหัสใน production
	}

	// แปลง ID
	posID, _ := strconv.ParseUint(positionID[0], 10, 32)
	roleIDVal, _ := strconv.ParseUint(roleID[0], 10, 32)
	employee.PositionID = uint(posID)
	employee.RoleID = uint(roleIDVal)

	// ถ้ามีรูปใหม่แนบ
	file, err := c.FormFile("profile")
	if err == nil {
		path := "uploads/profile/" + file.Filename
		if err := c.SaveUploadedFile(file, path); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปโหลดไฟล์ไม่สำเร็จ"})
			return
		}
		employee.Profile = path
	}

	if err := db.Save(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "แก้ไขข้อมูลสำเร็จ"})
}

// DeleteEmployee ลบพนักงาน (DELETE /api/employees/:id)
func DeleteEmployee(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()

	var employee entity.Employee
	if err := db.First(&employee, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	if err := db.Delete(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete employee"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Employee deleted successfully"})
}

func CreateEmployee(c *gin.Context) {
	db := config.DB()

	// รับค่าจาก multipart form
	firstName := c.PostForm("firstName")
	lastName := c.PostForm("lastName")
	email := c.PostForm("email")
	password := c.PostForm("password")
	phone := c.PostForm("phone")
	positionIDStr := c.PostForm("positionID")
	roleIDStr := c.PostForm("roleID")

	if firstName == "" || lastName == "" || email == "" || password == "" || phone == "" || positionIDStr == "" || roleIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	positionID, err := strconv.ParseUint(positionIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid positionID"})
		return
	}
	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid roleID"})
		return
	}

	// ✅ เข้ารหัสรหัสผ่าน
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเข้ารหัสรหัสผ่านได้"})
		return
	}

	// ✅ อ่านรูปภาพและแปลงเป็น Base64
	file, err := c.FormFile("profile")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ต้องแนบรูปโปรไฟล์"})
		return
	}
	openedFile, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอ่านไฟล์ได้"})
		return
	}
	defer openedFile.Close()

	imageBytes, err := ioutil.ReadAll(openedFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอ่านข้อมูลไฟล์ได้"})
		return
	}
	contentType := file.Header.Get("Content-Type")
	base64Image := "data:" + contentType + ";base64," + base64.StdEncoding.EncodeToString(imageBytes)
	
	// ตรวจสอบความถูกต้องของตำแหน่ง และสิทธิ์
	var position entity.Position
	if err := db.First(&position, uint(positionID)).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ตำแหน่งไม่ถูกต้อง"})
		return
	}

	var role entity.Role
	if err := db.First(&role, uint(roleID)).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "บทบาทไม่ถูกต้อง"})
		return
	}

	// สร้าง Employee
	employee := entity.Employee{
		FirstName:  firstName,
		LastName:   lastName,
		Email:      email,
		Password:   string(hashedPassword), // ✅ เก็บ password แบบ hash
		Phone:      phone,
		Profile:    base64Image,            // ✅ เก็บรูปเป็น base64
		PositionID: uint(positionID),
		RoleID:     uint(roleID),
	}

	if err := db.Create(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "สร้างพนักงานสำเร็จ"})
}