package hardware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
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
	IpAddress  string              `json:"ip_address" binding:"required"`
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

	var hardware entity.Hardware
	if err := db.Where("name = ? AND ip_address = ?", input.Name, input.IpAddress).First(&hardware).Error; err != nil {
		hardware = entity.Hardware{Name: input.Name, IpAddress: input.IpAddress}
		if err := db.Create(&hardware).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create hardware"})
			return
		}
	}

	var sensorData entity.SensorData
	if err := db.Where("hardware_id = ?", hardware.ID).First(&sensorData).Error; err != nil {
		sensorData = entity.SensorData{Date: time.Now(), HardwareID: hardware.ID}
		if err := db.Create(&sensorData).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sensor data"})
			return
		}
	}

	var allParams []entity.HardwareParameter
	if err := db.Preload("StandardHardware").Find(&allParams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hardware parameters"})
		return
	}

	var createdSDPs []entity.SensorDataParameter
	var createdParamIDs []uint
	var messageParts []string

	for _, p := range input.Parameters {
		var hp entity.HardwareParameter
		needNew := true

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
			std := entity.StandardHardware{Standard: 0.0}
			unit := entity.UnitHardware{Unit: ""}
			if err := db.Create(&std).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create standard"})
				return
			}
			if err := db.Create(&unit).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create unit"})
				return
			}

			// 🔍 ตรวจสอบชื่อเพื่อกำหนด HardwareParameterColorID
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

		var std entity.StandardHardware
		if err := db.First(&std, hp.StandardHardwareID).Error; err == nil {
			if std.Standard > 0 && p.Data > std.Standard {
				part := fmt.Sprintf("- %s: %.2f (เกณฑ์ %.2f)", hp.Parameter, p.Data, std.Standard)
				messageParts = append(messageParts, part)
			}
		}
	}

	if len(messageParts) > 0 {
		fullMessage := fmt.Sprintf("☣️ แจ้งเตือนสารเคมีเกินมาตรฐาน!\n📡 ฮาร์ดแวร์: %s\n🌐 IP: %s\n\nพบค่าที่เกิน:\n%s",
			hardware.Name, hardware.IpAddress, joinLines(messageParts))
		go SendWarningToLINE(fullMessage)
	}

	c.JSON(http.StatusOK, gin.H{
		"hardware":               hardware,
		"sensor_data_id":         sensorData.ID,
		"created_parameter_ids":  createdParamIDs,
		"sensor_data_parameters": createdSDPs,
	})
}

func joinLines(lines []string) string {
	return fmt.Sprintf("%s", string(bytes.Join(mapToBytes(lines), []byte("\n"))))
}

func mapToBytes(lines []string) [][]byte {
	out := make([][]byte, len(lines))
	for i, l := range lines {
		out[i] = []byte(l)
	}
	return out
}
