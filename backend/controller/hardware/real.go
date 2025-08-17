package hardware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

const LineToken = "gvki3Wyt+y/sZKER+Gaex2EpillRDRDHvXq4+sYNE5jlLUcy2N2YIIONKwvMhqn8RxcaME5vQ3I1BW82d1/ZYezvWklVMUk+EGGfXRmI4jxn5I1vVbOsctQ7xNqB9n9A+Q/SRhEtXviKFCF9WOI/ZgdB04t89/1O/w1cDnyilFU="
const LineUserID = "U3af93a2f92b1048757172584d47571c8"

func SendWarningToLINE(message string) error {
	url := "https://api.line.me/v2/bot/message/push"
	body := map[string]interface{}{
		"to": LineUserID,
		"messages": []map[string]string{
			{"type": "text", "text": message},
		},
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+LineToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func ReadDataForHardware(c *gin.Context) {
	var input HardwareInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	db := config.DB()

	// ✅ เช็กจาก MAC อย่างเดียว — ถ้ามีแล้วไม่ต้องสร้าง (ไม่เช็คชื่อ)
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

	// เตรียม SensorData ของ hardware นี้ (จะสร้างถ้ายังไม่มี)
	var sensorData entity.SensorData
	if err := db.Where("hardware_id = ?", hardware.ID).First(&sensorData).Error; err != nil {
		sensorData = entity.SensorData{Date: time.Now(), HardwareID: hardware.ID}
		if err := db.Create(&sensorData).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sensor data"})
			return
		}
	}

	// โหลด HardwareParameter ทั้งหมด (พร้อม StandardHardware)
	var allParams []entity.HardwareParameter
	if err := db.Preload("StandardHardware").Find(&allParams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hardware parameters"})
		return
	}

	var createdSDPs []entity.SensorDataParameter
	var createdParamIDs []uint

	// กลุ่มข้อความแจ้งเตือน (เหลือเฉพาะฝั่ง Min)
	var nearUnderParts []string // ใกล้ต่ำ (Min < data ≤ Min*1.10)
	var underParts []string     // ต่ำกว่า (data < Min)

	for _, p := range input.Parameters {
		var hp entity.HardwareParameter
		needNew := true

		// หา parameter เดิมที่ยังไม่ถูกใช้กับ hardware อื่น
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
			// สร้าง Standard/Unit เปล่า
			std := entity.StandardHardware{
				MaxValueStandard: 0.0, // ไม่ได้ใช้ใน logic นี้ แต่เก็บไว้ใน schema
				MinValueStandard: 0.0,
			}
			unit := entity.UnitHardware{Unit: ""}
			if err := db.Create(&std).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create standard"})
				return
			}
			if err := db.Create(&unit).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create unit"})
				return
			}

			// กำหนดสีจากชื่อพารามิเตอร์
			lowerParam := strings.ToLower(p.Parameter)
			colorID := uint(1) // default
			switch {
			case strings.Contains(lowerParam, "formaldehyde"), strings.Contains(p.Parameter, "ฟอร์มาลดีไฮด์"):
				colorID = 1
			case strings.Contains(lowerParam, "temperature"), strings.Contains(p.Parameter, "อุณหภูมิ"):
				colorID = 2
			case strings.Contains(lowerParam, "humidity"), strings.Contains(p.Parameter, "ความชื้น"):
				colorID = 3
			}

			hp = entity.HardwareParameter{
				Parameter:                p.Parameter,
				StandardHardwareID:       std.ID,
				UnitHardwareID:           unit.ID,
				HardwareGraphID:          1,
				HardwareParameterColorID: colorID,
				Icon:                     "GiChemicalDrop",
			}
			if err := db.Create(&hp).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create hardware parameter"})
				return
			}
			allParams = append(allParams, hp)
		}

		// บันทึกค่า SensorDataParameter
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

		// ตรวจค่ามาตรฐานฝั่ง Min (เฉพาะที่ตั้งค่า > 0)
		var std entity.StandardHardware
		if err := db.First(&std, hp.StandardHardwareID).Error; err == nil {
			if std.MinValueStandard > 0 {
				min := std.MinValueStandard
				nearUpper := min * 1.10 // Min * 110%

				if p.Data < min {
					// ต่ำกว่ามาตรฐาน
					underParts = append(underParts, fmt.Sprintf("- %s: %.2f (เกณฑ์ %.2f)", hp.Parameter, p.Data, min))
				} else if p.Data > min && p.Data <= nearUpper {
					// ใกล้ต่ำกว่ามาตรฐาน (เหนือ Min แต่ไม่เกิน Min*1.10)
					nearUnderParts = append(nearUnderParts, fmt.Sprintf("- %s: %.2f (เกณฑ์ %.2f)", hp.Parameter, p.Data, min))
				}
				// กรณีอื่นๆ (มากกว่า Min*1.10) → ไม่แจ้ง
			}
			// ถ้า Min == 0 → ไม่แจ้ง
		}
	}

	// ─────────────────────────────────────────────────────────
	// หา Room ล่าสุดของ Hardware นี้ พร้อม preload Building
	var room entity.Room
	var buildingName string
	var floorStr string
	var roomName string

	if err := db.Preload("Building").
		Where("hardware_id = ?", hardware.ID).
		Order("created_at DESC").
		First(&room).Error; err == nil {
		roomName = safeStr(room.RoomName)
		floorStr = safeInt(room.Floor)
		if room.Building != nil {
			// สมมติ schema ใช้ Building.BuildingName
			buildingName = safeStr(room.Building.BuildingName)
		} else {
			buildingName = "-"
		}
	} else if err != nil && err != gorm.ErrRecordNotFound {
		buildingName, floorStr, roomName = "-", "-", "-"
	} else {
		buildingName, floorStr, roomName = "-", "-", "-"
	}
	// ─────────────────────────────────────────────────────────

	// สร้างข้อความและส่ง LINE ถ้ามีอย่างน้อยหนึ่งกลุ่ม
	if len(nearUnderParts) > 0 || len(underParts) > 0 {
		loc, _ := time.LoadLocation("Asia/Bangkok")
		now := time.Now().In(loc).Format("2006-01-02 15:04:05")

		var sb strings.Builder
		sb.WriteString("☣️ แจ้งเตือนสารเคมีเกินมาตรฐาน!\n")
		sb.WriteString(fmt.Sprintf("🗓️ เวลา: %s\n", now))
		sb.WriteString(fmt.Sprintf("🏢 อาคาร: %s\n", safeStr(buildingName)))
		sb.WriteString(fmt.Sprintf("🏬 ชั้น: %s\n", safeStr(floorStr)))
		sb.WriteString(fmt.Sprintf("🚪 ห้อง: %s\n", safeStr(roomName)))
		sb.WriteString(fmt.Sprintf("📡 ฮาร์ดแวร์: %s\n", safeStr(hardware.Name)))
		sb.WriteString(fmt.Sprintf("🆔 MAC: %s\n\n", safeStr(hardware.MacAddress)))

		if len(nearUnderParts) > 0 {
			sb.WriteString("พบค่าที่ใกล้ต่ำกว่ามาตรฐาน:\n")
			sb.WriteString(strings.Join(nearUnderParts, "\n"))
			sb.WriteString("\n\n")
		}
		if len(underParts) > 0 {
			sb.WriteString("พบค่าที่ต่ำกว่ามาตรฐาน:\n")
			sb.WriteString(strings.Join(underParts, "\n"))
		} else {
			// ตัด \n ท้าย ถ้ากลุ่มสุดท้ายว่าง
			msg := strings.TrimRight(sb.String(), "\n")
			go SendWarningToLINE(msg)
			goto RESP
		}

		go SendWarningToLINE(sb.String())
	}

RESP:
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


type WebhookPayload struct {
	Events []struct {
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

	// Parse JSON จาก webhook
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจว่ามี event มาจริงไหม
	if len(payload.Events) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no events found"})
		return
	}

	// ดึง name (text message) และ userId ออกมา
	name := payload.Events[0].Message.Text
	userID := payload.Events[0].Source.UserID

	db := config.DB()
	var existing entity.Notification

	// เช็คว่ามี UserID อยู่แล้วไหม
	if err := db.Where("user_id = ?", userID).First(&existing).Error; err == nil {
		// ถ้ามีอยู่แล้ว → update name
		existing.Name = name
		if err := db.Save(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, existing)
		return
	}

	// ถ้ายังไม่มี → create ใหม่
	notification := entity.Notification{
		Name:   name,
		UserID: userID,
	}
	if err := db.Create(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notification)
}