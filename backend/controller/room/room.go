package room

import (
	"net/http"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
)

func ListRoom(c *gin.Context) {
	var rooms []entity.Room

	db := config.DB()

	if err := db.Preload("Building").Preload("Employee").Preload("Hardware").Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, &rooms)
}

func CreateRoom(c *gin.Context) {
	var room entity.Room

	// Bind JSON
	if err := c.ShouldBindJSON(&room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// ✅ Validate struct ตาม tag ใน entity.Room
	ok, err := govalidator.ValidateStruct(room)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ Save ลง DB
	if err := config.DB().Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, room)
}


func UpdateRoom(c *gin.Context) {
	var room entity.Room
	id := c.Param("id")

	// ตรวจสอบว่าห้องมีอยู่ก่อนหรือไม่
	if err := config.DB().First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// รับข้อมูล JSON
	var input struct {
		RoomName   *string `json:"RoomName"`
		Floor      *int    `json:"Floor"`
		Icon       *string `json:"Icon"`
		BuildingID *uint   `json:"BuildingID"`
		EmployeeID *uint   `json:"EmployeeID"`
		HardwareID *uint   `json:"HardwareID"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// ✅ อัปเดตเฉพาะค่าที่ไม่เป็น nil
	if input.RoomName != nil {
		room.RoomName = *input.RoomName
	}
	if input.Floor != nil {
		room.Floor = *input.Floor
	}
	if input.Icon != nil {
		room.Icon = *input.Icon
	}
	if input.BuildingID != nil {
		room.BuildingID = *input.BuildingID
	}
	if input.EmployeeID != nil {
		room.EmployeeID = *input.EmployeeID
	}
	if input.HardwareID != nil {
		room.HardwareID = *input.HardwareID
	}

	// ✅ Validate struct หลังจาก merge
	ok, err := govalidator.ValidateStruct(room)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Save
	if err := config.DB().Save(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update room: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, room)
}

func DeleteRoomById(c *gin.Context) {
	id := c.Param("id")
	var room entity.Room

	if err := config.DB().First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	if err := config.DB().Delete(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Room deleted successfully"})
}
