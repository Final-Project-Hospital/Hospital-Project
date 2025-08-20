package hardware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

type ParameterWithData struct {
	Parameter string  `json:"parameter" binding:"required"`
	Data      float64 `json:"data" binding:"required"`
}

type HardwareInput struct {
	Name       string              `json:"name" binding:"required"`
	MacAddress string              `json:"mac_address" binding:"required"`
	Parameters []ParameterWithData `json:"parameters" binding:"required"`
}

const LineToken = "qNf5S5s+Rkqr0gFDW++ObPJzfhUbCbWwbEdCeDzVIzhsSqe3R1HyycZOtY2+NSuBCZ8NIWO9jhx/a2cmUA+kbuL3GNfyp5Ze+4sj5lBY403ndhyoEqlpI90eaV/Kp0sc92opJl5uAYH9QSIKIWpq1wdB04t89/1O/w1cDnyilFU="

func getLineToken() (string, error) {
	db := config.DB()
	var lm entity.LineMaster
	// ถ้ามีหลายเรคคอร์ด คุณอาจเปลี่ยนเป็น Where(...) หรือ Order("id DESC").First(&lm)
	if err := db.First(&lm).Error; err != nil {
		return "", fmt.Errorf("query LineMaster failed: %w", err)
	}
	if lm.Token == "" {
		return "", fmt.Errorf("LineMaster.Token is empty")
	}
	return lm.Token, nil
}


func SendWarningToLINE(userID string, message string) error {
	url := "https://api.line.me/v2/bot/message/push"
	body := map[string]interface{}{
		"to": userID,
		"messages": []map[string]string{
			{"type": "text", "text": message},
		},
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return err
	}

	// ✅ ใช้ getLineToken แทน const
	token, err := getLineToken()
	if err != nil {
		return fmt.Errorf("cannot get LINE token: %w", err)
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
func ReadDataForHardware(c *gin.Context) {
	var input HardwareInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	db := config.DB()

	// ✅ เช็กจาก MAC อย่างเดียว
	var hardware entity.Hardware
	if err := db.Where("mac_address = ?", input.MacAddress).First(&hardware).Error; err != nil {
		// ไม่พบ → สร้างใหม่
		hardware = entity.Hardware{
			Name:       input.Name,
			MacAddress: input.MacAddress,
		}
		if err := db.Create(&hardware).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create hardware"})
			return
		}
	} else {
		// พบแล้ว → ไม่สร้างใหม่ (อัปเดตชื่อถ้าเดิมว่าง)
		if strings.TrimSpace(hardware.Name) == "" && strings.TrimSpace(input.Name) != "" {
			db.Model(&hardware).Update("name", input.Name)
		}
	}

	// ✅ เตรียม SensorData
	var sensorData entity.SensorData
	if err := db.Where("hardware_id = ?", hardware.ID).First(&sensorData).Error; err != nil {
		sensorData = entity.SensorData{Date: time.Now(), HardwareID: hardware.ID}
		if err := db.Create(&sensorData).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sensor data"})
			return
		}
	}

	// โหลด HardwareParameter ทั้งหมด
	var allParams []entity.HardwareParameter
	if err := db.Preload("StandardHardware").Find(&allParams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hardware parameters"})
		return
	}

	var createdSDPs []entity.SensorDataParameter
	var createdParamIDs []uint

	// กลุ่มข้อความแจ้งเตือน
	var overParts []string     // เกิน Max
	var underParts []string    // ต่ำกว่า Min
	var nearUnderParts []string // ใกล้ต่ำกว่า Min

	for _, p := range input.Parameters {
		var hp entity.HardwareParameter
		needNew := true

		// หา parameter เดิม
		for _, ap := range allParams {
			if ap.Parameter == p.Parameter {
				var count int64
				db.Model(&entity.SensorDataParameter{}).
					Joins("JOIN sensor_data ON sensor_data.id = sensor_data_parameters.sensor_data_id").
					Where("sensor_data_parameters.hardware_parameter_id = ? AND sensor_data.hardware_id != ?", ap.ID, hardware.ID).
					Count(&count)
				if count == 0 {
					hp = ap
					needNew = false
					break
				}
			}
		}

		if needNew {
			std := entity.StandardHardware{MaxValueStandard: 0.0, MinValueStandard: 0.0}
			unit := entity.UnitHardware{Unit: ""}
			if err := db.Create(&std).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create standard"})
				return
			}
			if err := db.Create(&unit).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create unit"})
				return
			}

			hp = entity.HardwareParameter{
				Parameter:                p.Parameter,
				StandardHardwareID:       std.ID,
				UnitHardwareID:           unit.ID,
				HardwareGraphID:          1,
				HardwareParameterColorID: 1,
				Icon:                     "GiChemicalDrop",
				Alert:                    false,
			}
			if err := db.Create(&hp).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create hardware parameter"})
				return
			}
			allParams = append(allParams, hp)
		}

		// บันทึกค่า
		sdp := entity.SensorDataParameter{
			Date:                time.Now(),
			Data:                p.Data,
			SensorDataID:        sensorData.ID,
			HardwareParameterID: hp.ID,
		}
		if err := db.Create(&sdp).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sensor data parameter"})
			return
		}
		createdParamIDs = append(createdParamIDs, hp.ID)
		createdSDPs = append(createdSDPs, sdp)

		// ✅ ตรวจมาตรฐาน เฉพาะ Alert = true เท่านั้น
		if !hp.Alert {
			continue
		}

		var std entity.StandardHardware
		if err := db.First(&std, hp.StandardHardwareID).Error; err == nil {
			// ✅ เช็ค MaxValueStandard
			if std.MaxValueStandard > 0 && p.Data > std.MaxValueStandard {
				overParts = append(overParts,
					fmt.Sprintf("- %s: %.2f (เกณฑ์สูงสุด %.2f)", hp.Parameter, p.Data, std.MaxValueStandard))
			}

			// ✅ เช็ค MinValueStandard
			if std.MinValueStandard > 0 {
				min := std.MinValueStandard
				nearUpper := min * 1.10
				if p.Data < min {
					underParts = append(underParts,
						fmt.Sprintf("- %s: %.2f (เกณฑ์ต่ำสุด %.2f)", hp.Parameter, p.Data, min))
				} else if p.Data > min && p.Data <= nearUpper {
					nearUnderParts = append(nearUnderParts,
						fmt.Sprintf("- %s: %.2f (ใกล้ต่ำสุด %.2f)", hp.Parameter, p.Data, min))
				}
			}
		}
	}

	// ─────────────────────────────────────────────────────────
	// หา Room ล่าสุด + Building
	var room entity.Room
	var buildingName, floorStr, roomName string

	if err := db.Preload("Building").
		Where("hardware_id = ?", hardware.ID).
		Order("created_at DESC").
		First(&room).Error; err == nil {
		roomName = safeStr(room.RoomName)
		floorStr = safeInt(room.Floor)
		if room.Building != nil {
			buildingName = safeStr(room.Building.BuildingName)
		} else {
			buildingName = "-"
		}
	} else {
		buildingName, floorStr, roomName = "-", "-", "-"
	}

	// ─────────────────────────────────────────────────────────
	// ส่ง LINE แจ้งเตือน
	if len(overParts) > 0 || len(underParts) > 0 || len(nearUnderParts) > 0 {
		loc, _ := time.LoadLocation("Asia/Bangkok")
		now := time.Now().In(loc).Format("2006-01-02 15:04:05")

		var sb strings.Builder
		sb.WriteString("☣️ แจ้งเตือนสารเคมีผิดปกติ!\n")
		sb.WriteString(fmt.Sprintf("🗓️ เวลา: %s\n", now))
		sb.WriteString(fmt.Sprintf("🏢 อาคาร: %s\n", safeStr(buildingName)))
		sb.WriteString(fmt.Sprintf("🏬 ชั้น: %s\n", safeStr(floorStr)))
		sb.WriteString(fmt.Sprintf("🚪 ห้อง: %s\n", safeStr(roomName)))
		sb.WriteString(fmt.Sprintf("📡 ฮาร์ดแวร์: %s\n", safeStr(hardware.Name)))
		sb.WriteString(fmt.Sprintf("🆔 MAC: %s\n\n", safeStr(hardware.MacAddress)))

		if len(overParts) > 0 {
			sb.WriteString("พบค่าที่เกินมาตรฐานสูงสุด:\n")
			sb.WriteString(strings.Join(overParts, "\n"))
			sb.WriteString("\n\n")
		}
		if len(underParts) > 0 {
			sb.WriteString("พบค่าที่ต่ำกว่ามาตรฐาน:\n")
			sb.WriteString(strings.Join(underParts, "\n"))
			sb.WriteString("\n\n")
		}
		if len(nearUnderParts) > 0 {
			sb.WriteString("พบค่าที่ใกล้ต่ำกว่ามาตรฐาน:\n")
			sb.WriteString(strings.Join(nearUnderParts, "\n"))
		}

		// ✅ หา RoomNotification เพื่อตรวจว่าต้องส่งให้ใครบ้าง
		var roomNotis []entity.RoomNotification
		if err := db.Preload("Notification").Where("room_id = ?", room.ID).Find(&roomNotis).Error; err == nil {
			for _, rn := range roomNotis {
				if rn.Notification != nil && rn.Notification.Alert {
					// ส่งเฉพาะคนที่ Alert = true
					go SendWarningToLINE(rn.Notification.UserID, sb.String())
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"hardware":               hardware,
		"sensor_data_id":         sensorData.ID,
		"created_parameter_ids":  createdParamIDs,
		"sensor_data_parameters": createdSDPs,
	})
}

// ────────────────────── helpers ──────────────────────
func safeStr(s string) string {
	if strings.TrimSpace(s) == "" {
		return "-"
	}
	return s
}

func safeInt(i int) string {
	return strconv.Itoa(i)
}


// WebhookPayload จาก LINE
type WebhookPayload struct {
	Events []struct {
		ReplyToken string `json:"replyToken"`
		Message struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"message"`
		Source struct {
			UserID string `json:"userId"`
		} `json:"source"`
	} `json:"events"`
}

func WebhookNotification(c *gin.Context) {
	var payload WebhookPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(payload.Events) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no events found"})
		return
	}

	event := payload.Events[0]
	text := event.Message.Text
	userID := event.Source.UserID
	replyToken := event.ReplyToken

	db := config.DB()
	var existing entity.Notification

	// ถ้ามี User อยู่แล้ว
	if err := db.Where("user_id = ?", userID).First(&existing).Error; err == nil {
		// ===== กรณี "ยกเลิกการใช้งาน" =====
		if text == "ยกเลิกการใช้บริการ" {
			if existing.Alert {
				// เปลี่ยน Alert เป็น false
				existing.Alert = false
				if err := db.Save(&existing).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}

				// ตอบกลับว่า "ยกเลิกแล้ว"
				cancelMessage := "ท่านได้ทำการยกเลิกการใช้งานบริการแจ้งเตือนสำเร็จ ❌\nถ้าต้องการใช้บริการอีกครั้ง กรุณาติดต่อผู้ดูแลระบบ\nขอบคุณครับ 🙏"
				if err := replyToLINE(replyToken, cancelMessage); err != nil {
					log.Printf("Error replying to LINE: %v", err)
				}
				c.JSON(http.StatusOK, gin.H{"message": "alert cancelled"})
				return
			}

			// ถ้า Alert เป็น false อยู่แล้ว → เงียบ
			c.JSON(http.StatusOK, gin.H{"message": "no action needed"})
			return
		}

		// ถ้ามีข้อมูลแล้ว และไม่ใช่ "ยกเลิกการใช้งาน" → เมินเฉย
		c.JSON(http.StatusOK, gin.H{"message": "user already registered, no changes"})
		return
	}

	// ถ้า user ยังไม่เคยลงทะเบียน → ลงทะเบียนใหม่
	notification := entity.Notification{
		Name:   text,
		UserID: userID,
		Alert:  false,
	}

	if err := db.Create(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	replyMessage := fmt.Sprintf("คุณ %s ได้ทำการลงทะเบียนการใช้งานระบบการแจ้งเตือนสำเร็จ กรุณารอการยืนยันจากผู้ดูแลระบบ ขอบคุณครับ 🙏", text)
	if err := replyToLINE(replyToken, replyMessage); err != nil {
		log.Printf("Error replying to LINE: %v", err)
	}

	c.JSON(http.StatusOK, notification)
}


func replyToLINE(replyToken, message string) error {
	url := "https://api.line.me/v2/bot/message/reply"

	body := map[string]interface{}{
		"replyToken": replyToken,
		"messages": []map[string]string{
			{
				"type": "text",
				"text": message,
			},
		},
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return err
	}

	token, err := getLineToken()
	if err != nil {
		return fmt.Errorf("cannot get LINE token from DB: %w", err)
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
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("LINE API response status: %d, body: %s", resp.StatusCode, string(b))
	}

	return nil
}
