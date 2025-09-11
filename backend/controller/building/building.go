package building

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

type buildingCreateInput struct {
	BuildingName string `json:"building_name" binding:"required"`      // ต้องมี และจะตรวจเพิ่มว่าไม่ใช่ช่องว่างล้วน
	EmployeeID   uint   `json:"employee_id" binding:"required,gt=0"`   // ต้องมี และ > 0
}

type buildingUpdateInput struct {
	BuildingName *string `json:"building_name"`          // ถ้าส่งมา จะตรวจว่าไม่ว่าง
	EmployeeID   *uint   `json:"employee_id"`            // ถ้าส่งมา ต้อง > 0
}

// ✅ CreateBuilding (ค่าว่างจะไม่รับ)
func CreateBuilding(c *gin.Context) {
	var input buildingCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// trim และตรวจไม่ให้เป็นช่องว่างล้วน
	name := strings.TrimSpace(input.BuildingName)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "building_name must not be blank"})
		return
	}

	if input.EmployeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "employee_id must be greater than 0"})
		return
	}

	db := config.DB()

	// ตรวจว่า Employee มีอยู่จริงก่อนผูก
	var emp entity.Employee
	if err := db.First(&emp, input.EmployeeID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Employee not found"})
		return
	}

	// entity.Building ใช้ *uint => ต้องแปลงเป็น pointer
	eid := input.EmployeeID
	b := entity.Building{
		BuildingName: name,
		EmployeeID:   &eid,
	}

	if err := db.Create(&b).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, b)
}

// ✅ UpdateBuildingByID (ค่าว่างจะไม่รับ)
func UpdateBuildingByID(c *gin.Context) {
	id := c.Param("id")
	buildingID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid building ID"})
		return
	}

	db := config.DB()

	var b entity.Building
	if err := db.First(&b, uint(buildingID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Building not found"})
		return
	}

	var input buildingUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ถ้าส่งชื่อมา ต้องไม่ว่าง/ไม่ใช่ช่องว่างล้วน
	if input.BuildingName != nil {
		name := strings.TrimSpace(*input.BuildingName)
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "building_name must not be blank"})
			return
		}
		b.BuildingName = name
	}

	// ถ้าส่ง employee_id มา ต้อง > 0 และต้องมีอยู่จริง
	if input.EmployeeID != nil {
		if *input.EmployeeID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "employee_id must be greater than 0"})
			return
		}
		var emp entity.Employee
		if err := db.First(&emp, *input.EmployeeID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Employee not found"})
			return
		}
		b.EmployeeID = input.EmployeeID
	}

	if err := db.Save(&b).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, b)
}

// ✅ ListBuilding (ใช้กับ Table)
func ListBuilding(c *gin.Context) {
    var buildings []entity.Building
    db := config.DB()

    order := c.DefaultQuery("order", "asc") // "asc" | "desc"
    if order != "asc" && order != "desc" {
        order = "asc"
    }

    if err := db.Order("id " + order).Find(&buildings).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, buildings)
}


// ✅ DeleteBuildingByID
func DeleteBuildingByID(c *gin.Context) {
	id := c.Param("id")
	buildingID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid building ID"})
		return
	}

	db := config.DB()
	if err := db.Delete(&entity.Building{}, uint(buildingID)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
