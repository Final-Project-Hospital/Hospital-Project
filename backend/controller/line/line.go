package line

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

const LineToken = "qNf5S5s+Rkqr0gFDW++ObPJzfhUbCbWwbEdCeDzVIzhsSqe3R1HyycZOtY2+NSuBCZ8NIWO9jhx/a2cmUA+kbuL3GNfyp5Ze+4sj5lBY403ndhyoEqlpI90eaV/Kp0sc92opJl5uAYH9QSIKIWpq1wdB04t89/1O/w1cDnyilFU="

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

	// ส่งข้อความหา UserID ผ่าน LINE
	var message string
	if input.Alert {
		message = fmt.Sprintf(
			"สวัสดีครับ %s 🙌\n\n"+
				"คุณได้รับการยืนยันการใช้บริการแจ้งเตือนผ่านไลน์เรียบร้อยแล้ว\n\n"+
				"━━━━━━━━━━━━━━━━━━━━\n"+
				"🔕 *หากท่านต้องการยกเลิกการใช้บริการแจ้งเตือนผ่านไลน์*\n"+
				"กรุณาพิมพ์ข้อความ:\n\n"+
				"👉 ยกเลิกการใช้บริการ\n"+
				"━━━━━━━━━━━━━━━━━━━━",
			notification.Name,
		)
	} else {
		message = "ทำการยกเลิกการใช้บริการแจ้งเตือนผ่านไลน์แล้ว ❌\nถ้าต้องการใช้บริการอีกครั้ง กรุณาติดต่อผู้ดูแลระบบ\nขอบคุณครับ 🙏"
	}

	err = pushMessageToLine(notification.UserID, message)
	if err != nil {
		// log แต่อย่าส่ง error กลับไป client
		fmt.Printf("Failed to push message to LINE: %v\n", err)
	}

	c.JSON(http.StatusOK, notification)
}

func getLineToken() (string, error) {
	db := config.DB()
	var lineMaster entity.LineMaster

	if err := db.First(&lineMaster).Error; err != nil {
		return "", err
	}

	return lineMaster.Token, nil
}

func pushMessageToLine(userID, message string) error {
	url := "https://api.line.me/v2/bot/message/push"

	payload := map[string]interface{}{
		"to": userID,
		"messages": []map[string]string{
			{
				"type": "text",
				"text": message,
			},
		},
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	token, err := getLineToken()
	if err != nil {
		return fmt.Errorf("ไม่สามารถดึง Line Token จาก DB ได้: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("LINE API responded with status: %d", resp.StatusCode)
	}

	return nil
}

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

func GetLineMasterFirstID(c *gin.Context) {
	db := config.DB()
	var lineMaster entity.LineMaster

	// ใช้ First() เพื่อดึงเรคคอร์ดแรก
	if err := db.First(&lineMaster).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, &lineMaster)
}

func UpdateLineMasterByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var lineMaster entity.LineMaster
	if err := db.First(&lineMaster, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "LineMaster not found"})
		return
	}

	// struct สำหรับรับ JSON จาก request body
	var input struct {
		Token string `json:"token"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	lineMaster.Token = input.Token

	if err := db.Save(&lineMaster).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, &lineMaster)
}