package employee

import (
	"encoding/base64"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
)

// helper: พยายามดึง requester ID จาก context (ลองได้หลาย key)
func getRequesterID(c *gin.Context) (uint, bool) {
	keys := []string{"employee_id", "EmployeeID", "user_id", "userID", "id", "ID", "sub"}
	for _, k := range keys {
		if v, ok := c.Get(k); ok {
			switch t := v.(type) {
			case uint:
				return t, true
			case int:
				return uint(t), true
			case int64:
				return uint(t), true
			case float64:
				return uint(t), true
			case string:
				if id64, err := strconv.ParseUint(t, 10, 64); err == nil {
					return uint(id64), true
				}
			}
		}
	}
	return 0, false
}

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
		"Admin":    true,
		"Employee": true,
		"Guest":    true,
	}
	if !validRoles[roleName] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	// ❗ กันเปลี่ยน role ของตัวเอง
	if reqID, ok := getRequesterID(c); ok {
		if uid, err := strconv.ParseUint(id, 10, 64); err == nil && uint(uid) == reqID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You cannot change your own role"})
			return
		}
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

	if err := db.Model(&employee).Update("RoleID", role.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role updated successfully"})
}

func GetEmployees(c *gin.Context) {
	var employees []entity.Employee

	if err := config.DB().Preload("Role").Preload("Position").Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลพนักงานได้"})
		return
	}

	c.JSON(http.StatusOK, employees)
}

type UpdateEmployeeDTO struct {
	FirstName  string `json:"firstName" valid:"required~กรุณากรอกชื่อ"`
	LastName   string `json:"lastName" valid:"required~กรุณากรอกนามสกุล"`
	Email      string `json:"email" valid:"email,required~กรุณากรอกอีเมล"`
	Phone      string `json:"phone" valid:"required~กรุณากรอกเบอร์โทร"`
	Password   string `json:"password"`   // optional
	PositionID uint   `json:"positionID"` // optional
	RoleID     uint   `json:"roleID"`     // optional
	Profile    string `json:"profile"`    // base64 string
}

func UpdateEmployeeInfo(c *gin.Context) {
	idStr := c.Param("id")
	db := config.DB()

	// ตรวจสอบ ID
	EmployeeID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "EmployeeID ต้องเป็นตัวเลข"})
		return
	}

	// หา Employee เดิม
	var employee entity.Employee
	if err := db.First(&employee, uint(EmployeeID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลผิดพลาด", "details": err.Error()})
		}
		return
	}

	// Bind JSON → DTO
	var input UpdateEmployeeDTO
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูล JSON ไม่ถูกต้อง", "details": err.Error()})
		return
	}

	// Normalize
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	input.Phone = strings.TrimSpace(input.Phone)

	// Validate struct
	if ok, err := govalidator.ValidateStruct(input); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบ Email/Phone ซ้ำ
	var existEmail entity.Employee
	if err := db.Where("email = ? AND id <> ?", input.Email, employee.ID).First(&existEmail).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "อีเมลล์ถูกใช้งานแล้ว"})
		return
	}

	var existPhone entity.Employee
	if err := db.Where("phone = ? AND id <> ?", input.Phone, employee.ID).First(&existPhone).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "เบอร์โทรศัพท์ถูกใช้งานแล้ว"})
		return
	}

	// อัปเดตฟิลด์
	employee.FirstName = input.FirstName
	employee.LastName = input.LastName
	employee.Email = input.Email
	employee.Phone = input.Phone

	if input.PositionID != 0 {
		employee.PositionID = input.PositionID
	}

	// ✅ จัดการ Role
	reqID, hasReq := getRequesterID(c)
	if input.RoleID == 0 {
		if !hasReq || uint64(reqID) != uint64(employee.ID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing roleID"})
			return
		}
	} else {
		if hasReq && uint64(reqID) == uint64(employee.ID) && input.RoleID != employee.RoleID {
			c.JSON(http.StatusForbidden, gin.H{"error": "ไม่สามารถเปลี่ยน role ของตัวเองได้"})
			return
		}
		employee.RoleID = input.RoleID
	}

	// ✅ Password
	if input.Password != "" {
		if hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost); err == nil {
			employee.Password = string(hashed)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เข้ารหัสรหัสผ่านไม่สำเร็จ"})
			return
		}
	}

	// ✅ Profile base64 (เก็บตรงๆ ไม่สร้างไฟล์)
	if input.Profile != "" {
		employee.Profile = input.Profile
	}

	// Save
	if err := db.Save(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตไม่สำเร็จ", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "แก้ไขข้อมูลสำเร็จ", "user": employee})
}

// helper เล็กๆ
func firstOrEmpty(arr []string) string {
    if len(arr) > 0 {
        return arr[0]
    }
    return ""
}

// DeleteEmployee ลบพนักงาน (DELETE /api/employees/:id)
func DeleteEmployee(c *gin.Context) {
	id := c.Param("id")

	// ❗ กันลบตัวเอง
	if reqID, ok := getRequesterID(c); ok {
		if uid, err := strconv.ParseUint(id, 10, 64); err == nil && uint(uid) == reqID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You cannot delete your own account"})
			return
		}
	}

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
	email := strings.ToLower(strings.TrimSpace(c.PostForm("email")))
	password := c.PostForm("password")
	phone := strings.TrimSpace(c.PostForm("phone"))
	positionIDStr := c.PostForm("positionID")
	roleIDStr := c.PostForm("roleID")

	if firstName == "" || lastName == "" || email == "" || password == "" || phone == "" || positionIDStr == "" || roleIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	// ✅ ตรวจสอบ Email/Phone ซ้ำ
	errors := make(map[string]string)

	var existEmail entity.Employee
	if err := db.Where("email = ?", email).First(&existEmail).Error; err == nil {
		errors["email"] = "อีเมลล์ถูกใช้งานเเล้ว"
	}

	var existPhone entity.Employee
	if err := db.Where("phone = ?", phone).First(&existPhone).Error; err == nil {
		errors["phone"] = "เบอร์โทรศัพท์ถูกใช้งานเเล้ว"
	}

	if len(errors) > 0 {
		c.JSON(http.StatusConflict, gin.H{"errors": errors})
		return
	}

	// ✅ parse ID
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

	// ตรวจสอบความถูกต้องของตำแหน่ง
	var position entity.Position
	if err := db.First(&position, uint(positionID)).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ตำแหน่งไม่ถูกต้อง"})
		return
	}

	// ตรวจสอบความถูกต้องของสิทธิ์
	var role entity.Role
	if err := db.First(&role, uint(roleID)).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "บทบาทไม่ถูกต้อง"})
		return
	}

	employee := entity.Employee{
		FirstName:  firstName,
		LastName:   lastName,
		Email:      email,
		Password:   string(hashedPassword),
		Phone:      phone,
		Profile:    base64Image,
		PositionID: uint(positionID),
		RoleID:     uint(roleID),
	}

	if err := db.Create(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "สร้างพนักงานสำเร็จ"})
}


func ListRole(c *gin.Context) {
	var roles []entity.Role

	db := config.DB()
	if err := db.Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, roles)
}

func CheckEmail(c *gin.Context) {
	email := c.Query("email") 
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุอีเมล"})
		return
	}

	db := config.DB()
	var employee entity.Employee

	if err := db.Where("email = ?", email).First(&employee).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{
			"exists": true,
			"email":  email,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"exists": false,
		"email":  email,
	})
}

type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	NewPassword string `json:"newPassword" binding:"required"`
}

func ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	db := config.DB()
	var employee entity.Employee

	// ค้นหาผู้ใช้จาก Email
	if err := db.Where("email = ?", req.Email).First(&employee).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้งานนี้"})
		return
	}

	// แปลง password → hash
	hashedPassword, err := config.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเข้ารหัสรหัสผ่านได้"})
		return
	}

	// อัปเดต Password
	employee.Password = hashedPassword
	if err := db.Save(&employee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถรีเซ็ตรหัสผ่านได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "รีเซ็ตรหัสผ่านสำเร็จ",
		"email":   employee.Email,
	})
}