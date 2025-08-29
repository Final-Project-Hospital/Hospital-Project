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

// UpdateEmployeeInfo แก้ไขข้อมูลพนักงาน (PUT /api/employees/:id)
func UpdateEmployeeInfo(c *gin.Context) {
    id := c.Param("id")
    db := config.DB()

    if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
        return
    }

    form := c.Request.MultipartForm
    firstName := firstOrEmpty(form.Value["firstName"])
    lastName  := firstOrEmpty(form.Value["lastName"])
    email     := firstOrEmpty(form.Value["email"])
    phone     := firstOrEmpty(form.Value["phone"])
    password  := firstOrEmpty(form.Value["password"])
    posRaw    := firstOrEmpty(form.Value["positionID"]) // optional
    roleRaw   := firstOrEmpty(form.Value["roleID"])     // optional (กรณีแก้ตัวเอง)

    if firstName == "" || lastName == "" || email == "" || phone == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
        return
    }

    var employee entity.Employee
    if err := db.First(&employee, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
        return
    }

    // ใครเป็นคนยิง request
    reqID, hasReq := getRequesterID(c)

    // ตั้งค่าพื้นฐาน
    employee.FirstName = firstName
    employee.LastName  = lastName
    employee.Email     = email
    employee.Phone     = phone

    // positionID: มีค่าส่งมาก็อัปเดต ไม่ส่งมาก็ใช้ของเดิม
    if posRaw != "" {
        if posID64, err := strconv.ParseUint(posRaw, 10, 32); err == nil {
            employee.PositionID = uint(posID64)
        }
    }

    // roleID: 
    // - ถ้ากำลังแก้ "ตัวเอง": อนุญาตให้ไม่ส่ง roleID ได้ (คงค่าเดิม)
    // - ถ้ากำลังแก้ "คนอื่น": ต้องมี roleID (กันลืม)
    if roleRaw == "" {
        if !hasReq || uint64(reqID) != uint64(employee.ID) {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Missing roleID"})
            return
        }
        // เป็นการแก้ตัวเอง → คง Role เดิมไว้
    } else {
        roleIDVal, err := strconv.ParseUint(roleRaw, 10, 32)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid roleID"})
            return
        }
        // กันเปลี่ยน role ตัวเอง
        if hasReq && uint64(reqID) == uint64(employee.ID) && uint(roleIDVal) != employee.RoleID {
            c.JSON(http.StatusForbidden, gin.H{"error": "You cannot change your own role"})
            return
        }
        employee.RoleID = uint(roleIDVal)
    }

    // เปลี่ยนรหัสผ่านถ้ามี
    if password != "" {
        if hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost); err == nil {
            employee.Password = string(hashed)
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเข้ารหัสรหัสผ่านได้"})
            return
        }
    }

    if file, err := c.FormFile("profile"); err == nil {
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

	// ✅ อ่านรูปภาพและแปลงเป็น Base64 (หมายเหตุ: โปรดพิจารณาขนาด/ที่จัดเก็บใน production)
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
	NewPassword string `json:"newPassword" binding:"required,min=6"`
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