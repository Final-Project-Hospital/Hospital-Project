package line

import (
	"net/http"
	"strconv"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

func ListNotification(c *gin.Context) {
	var notifications []entity.Notification

	db := config.DB()
	if err := db.Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func UpdateAlertByNotificationID(c *gin.Context) {
	id := c.Param("id")

	notificationID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Alert bool `json:"alert"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	var notification entity.Notification
	if err := db.First(&notification, notificationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	notification.Alert = input.Alert
	if err := db.Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notification)
}
// ✅ Delete Notification + RoomNotification ที่เกี่ยวข้อง
func DeleteNotificationByID(c *gin.Context) {
	id := c.Param("id") // ดึง id จาก URL param

	// แปลงเป็น uint
	notificationID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB()

	// ตรวจสอบว่ามี notification นี้อยู่จริงไหม
	var notification entity.Notification
	if err := db.First(&notification, notificationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	// ✅ ลบ RoomNotification ทั้งหมดที่ผูกกับ NotificationID นี้
	if err := db.Where("notification_id = ?", notificationID).Delete(&entity.RoomNotification{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete related RoomNotifications"})
		return
	}

	// ✅ ลบ Notification
	if err := db.Delete(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification and related RoomNotifications deleted successfully"})
}

func DeleteRoomNotificationByNotificationID(c *gin.Context) {
	id := c.Param("id")

	notificationID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Notification ID"})
		return
	}

	db := config.DB()

	if err := db.Where("notification_id = ?", notificationID).
		Delete(&entity.RoomNotification{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete RoomNotifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "RoomNotifications deleted successfully"})
}


func ListRoomNotification(c *gin.Context) {
	var roomNotifications []entity.RoomNotification

	db := config.DB()
	if err := db.Preload("Room").Preload("Notification").Find(&roomNotifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, roomNotifications)
}

type CreateRoomNotificationInput struct {
	RoomID         uint `json:"room_id" binding:"required"`
	NotificationID uint `json:"notification_id" binding:"required"`
}

func CreateRoomNotification(c *gin.Context) {
	var input CreateRoomNotificationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	roomNotification := entity.RoomNotification{
		RoomID:         input.RoomID,
		NotificationID: input.NotificationID,
	}

	db := config.DB()
	if err := db.Create(&roomNotification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := db.Preload("Room").Preload("Notification").First(&roomNotification, roomNotification.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, roomNotification)
}

// Update NotificationID ของ RoomNotification ตาม RoomID
func UpdateNotificationIDByRoomID(c *gin.Context) {
	db := config.DB()

	// รับ RoomID จาก URL param
	roomIDParam := c.Param("room_id")
	roomID, err := strconv.ParseUint(roomIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid RoomID"})
		return
	}

	// รับ NotificationID จาก body
	var requestBody struct {
		NotificationID uint `json:"notification_id"`
	}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// ค้นหา RoomNotification ของ RoomID นี้
	var roomNotification entity.RoomNotification
	if err := db.Where("room_id = ?", roomID).First(&roomNotification).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "RoomNotification not found"})
		return
	}

	// อัปเดต NotificationID
	roomNotification.NotificationID = requestBody.NotificationID
	if err := db.Save(&roomNotification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update NotificationID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "NotificationID updated successfully",
		"roomNotification": roomNotification,
	})
}