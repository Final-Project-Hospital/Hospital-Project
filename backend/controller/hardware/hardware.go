package hardware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func ListHardware(c *gin.Context) {
	var hardwares []entity.Hardware

	db := config.DB()
	if err := db.Find(&hardwares).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hardwares)
}

type SensorInput struct {
	Name   string             `json:"name"`
	Sensor map[string]float64 `json:"sensor"`
}

func ReceiveSensorData(c *gin.Context) {
	var input SensorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	db := config.DB()

	// 1. เช็กหรือสร้าง Hardware
	var hardware entity.Hardware
	if err := db.Where("name = ?", input.Name).First(&hardware).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			hardware = entity.Hardware{Name: input.Name}
			if err := db.Create(&hardware).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create hardware: " + err.Error()})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 2. หา SensorData ล่าสุดของ hardware นี้
	var sensorData entity.SensorData
	if err := db.Where("hardware_id = ?", hardware.ID).
		Order("date desc").
		First(&sensorData).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// ยังไม่มี → สร้างใหม่
			sensorData = entity.SensorData{
				Date:       time.Now(),
				HardwareID: hardware.ID,
			}
			if err := db.Create(&sensorData).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create SensorData: " + err.Error()})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 3. วนแต่ละ parameter ที่ส่งมา
	for paramName, value := range input.Sensor {
		var parameter entity.HardwareParameter
		if err := db.Where("parameter = ?", paramName).First(&parameter).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				parameter = entity.HardwareParameter{Parameter: paramName}
				if err := db.Create(&parameter).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create HardwareParameter: " + err.Error()})
					return
				}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		// 4. เพิ่ม SensorDataParameter
		sensorParam := entity.SensorDataParameter{
			Date:                time.Now(),
			Data:                value,
			SensorDataID:        sensorData.ID,
			HardwareParameterID: parameter.ID,
		}
		if err := db.Create(&sensorParam).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create SensorDataParameter: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sensor data saved successfully"})
}

// อาจได้เอาออกหรือทำใหม่เลย
func ListHardwareParameterByHardwareID(c *gin.Context) {
	var hardwareParameters []entity.HardwareParameter

	hardwareID := c.Param("id") // รับ id จาก path /:id

	// 1. หา SensorDataID ของ HardwareID นี้
	var sensorDataIDs []uint
	config.DB().Model(&entity.SensorData{}).
		Where("hardware_id = ?", hardwareID).
		Pluck("id", &sensorDataIDs)

	if len(sensorDataIDs) == 0 {
		c.JSON(http.StatusOK, hardwareParameters)
		return
	}

	// 2. หา HardwareParameterID ที่อยู่ใน SensorDataParameter (ไม่ซ้ำ)
	var hardwareParameterIDs []uint
	config.DB().Model(&entity.SensorDataParameter{}).
		Where("sensor_data_id IN ?", sensorDataIDs).
		Distinct().
		Pluck("hardware_parameter_id", &hardwareParameterIDs)

	if len(hardwareParameterIDs) == 0 {
		c.JSON(http.StatusOK, hardwareParameters)
		return
	}

	// 3. Preload ข้อมูล HardwareParameter ที่เกี่ยวข้อง
	if err := config.DB().
		Preload("HardwareGraph").
		Preload("HardwareParameterColor").
		Preload("StandardHardware").
		Preload("UnitHardware").
		Find(&hardwareParameters, hardwareParameterIDs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hardwareParameters)
}

// PATCH /update-hardware-parameter/:id
func UpdateHardwareParameterByID(c *gin.Context) {
	// 1. รับ ID จาก param
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// 2. Bind JSON body
	var req struct {
		Parameter                *string `json:"parameter"`
		HardwareGraphID          *uint   `json:"hardware_graph_id"`
		HardwareParameterColorID *uint   `json:"hardware_parameter_color_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. Find ตัวเดิม
	var hardwareParameter entity.HardwareParameter
	if err := config.DB().First(&hardwareParameter, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "HardwareParameter not found"})
		return
	}

	// 4. Validate foreign key (ถ้ามีส่งมา)
	if req.HardwareGraphID != nil {
		var hardwareGraph entity.HardwareGraph
		if err := config.DB().First(&hardwareGraph, *req.HardwareGraphID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "HardwareGraph ไม่พบในระบบ"})
			return
		}
	}
	if req.HardwareParameterColorID != nil {
		var color entity.HardwareParameterColor
		if err := config.DB().First(&color, *req.HardwareParameterColorID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "HardwareParameterColor ไม่พบในระบบ"})
			return
		}
	}

	// 5. Prepare fields for update
	updateFields := map[string]interface{}{}
	if req.Parameter != nil {
		updateFields["parameter"] = *req.Parameter
	}
	if req.HardwareGraphID != nil {
		updateFields["hardware_graph_id"] = *req.HardwareGraphID
	}
	if req.HardwareParameterColorID != nil {
		updateFields["hardware_parameter_color_id"] = *req.HardwareParameterColorID
	}

	if len(updateFields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no field to update"})
		return
	}

	// 6. Update
	if err := config.DB().Model(&hardwareParameter).Updates(updateFields).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 7. Preload relation หลังอัปเดต
	config.DB().
		Preload("HardwareGraph").
		Preload("HardwareParameterColor").
		First(&hardwareParameter, id)

	c.JSON(http.StatusOK, hardwareParameter)
}

func ListColors(c *gin.Context) {
	var colors []entity.HardwareParameterColor

	db := config.DB()
	if err := db.Find(&colors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, colors)
}

func UpdateUnitHardwareByID(c *gin.Context) {
	id := c.Param("id")
	var unit entity.UnitHardware

	db := config.DB()
	if err := db.First(&unit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "UnitHardware not found"})
		return
	}

	var input struct {
		Unit string `json:"unit" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	unit.Unit = input.Unit

	if err := db.Save(&unit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, unit)
}

func UpdateStandardHardwareByID(c *gin.Context) {
	id := c.Param("id")
	var standard entity.StandardHardware

	db := config.DB()
	if err := db.First(&standard, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "StandardHardware not found"})
		return
	}

	var input struct {
		Standard float64 `json:"standard" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	standard.Standard = input.Standard

	if err := db.Save(&standard).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, standard)
}

type ParamWithGraphResponse struct {
	ID        uint    `json:"id"`        // HardwareParameter.ID
	Parameter string  `json:"parameter"` // HardwareParameter.Parameter
	GraphID   uint    `json:"graph_id"`  // HardwareGraph.ID
	Graph     string  `json:"graph"`     // HardwareGraph.Graph
	Color     string  `json:"color"`     // HardwareParameterColor.Code
	Unit      string  `json:"unit"`      // 👈 เพิ่ม
	Standard  float64 `json:"standard"`  // 👈 เพิ่ม
}

func GetHardwareParametersWithGraph(c *gin.Context) {
	hardwareID := c.Query("hardware_id")
	if hardwareID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing hardware_id"})
		return
	}

	db := config.DB()

	// 1. หาพารามิเตอร์ที่มีข้อมูล sensor จริง
	var hardwareParamIDs []uint
	err := db.
		Table("sensor_data_parameters").
		Joins("JOIN sensor_data ON sensor_data.id = sensor_data_parameters.sensor_data_id").
		Where("sensor_data.hardware_id = ?", hardwareID).
		Select("DISTINCT sensor_data_parameters.hardware_parameter_id").
		Pluck("hardware_parameter_id", &hardwareParamIDs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hardware parameter IDs"})
		return
	}

	if len(hardwareParamIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"hardware_id": hardwareID, "parameters": []ParamWithGraphResponse{}})
		return
	}

	// 2. โหลด HardwareParameter พร้อมกราฟและสี
	var parameters []entity.HardwareParameter
	err = db.
		Preload("HardwareGraph").
		Preload("HardwareParameterColor").
		Preload("UnitHardware").
		Preload("StandardHardware").
		Where("id IN ?", hardwareParamIDs).
		Find(&parameters).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load parameters"})
		return
	}

	// 3. map response
	var result []ParamWithGraphResponse
	for _, p := range parameters {
		result = append(result, ParamWithGraphResponse{
			ID:        p.ID,
			Parameter: p.Parameter,
			GraphID:   p.HardwareGraph.ID,
			Graph:     p.HardwareGraph.Graph,
			Color:     p.HardwareParameterColor.Code,
			Unit:      p.UnitHardware.Unit,
			Standard:  p.StandardHardware.Standard,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"hardware_id": hardwareID,
		"parameters":  result,
	})
}
