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

	db := config.DB()

	// 1) หา UnitHardware ก่อน
	var unit entity.UnitHardware
	if err := db.First(&unit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "UnitHardware not found"})
		return
	}

	// 2) รับ payload
	var input struct {
		Unit       string `json:"unit" binding:"required"`
		EmployeeID *uint  `json:"employee_id"` // optional
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3) อัปเดตค่า unit
	unit.Unit = input.Unit
	if err := db.Save(&unit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 4) ถ้ามี employee_id → อัปเดต HardwareParameter.EmployeeID
	var rowsAffected int64 = 0
	if input.EmployeeID != nil {
		tx := db.Model(&entity.HardwareParameter{}).
			Where("unit_hardware_id = ?", unit.ID).
			Update("employee_id", *input.EmployeeID)

		if tx.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": tx.Error.Error()})
			return
		}
		rowsAffected = tx.RowsAffected
	}

	// 5) ตอบกลับ
	c.JSON(http.StatusOK, gin.H{
		"unit":         unit,
		"updated_rows": rowsAffected, // จำนวน HardwareParameter ที่ถูกอัปเดต employee_id
	})
}

func UpdateStandardHardwareByID(c *gin.Context) {
	id := c.Param("id")
	var standard entity.StandardHardware

	db := config.DB()
	if err := db.First(&standard, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "StandardHardware not found"})
		return
	}

	// ✅ ใช้ pointer เพื่อรองรับการส่งค่า 0 ได้
	var input struct {
		MaxValueStandard *float64 `json:"MaxValueStandard" binding:"required"`
		MinValueStandard *float64 `json:"MinValueStandard" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ อัปเดตค่าที่รับมา
	if input.MaxValueStandard != nil {
		standard.MaxValueStandard = *input.MaxValueStandard
	}
	if input.MinValueStandard != nil {
		standard.MinValueStandard = *input.MinValueStandard
	}

	if err := db.Save(&standard).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, standard)
}

type ParamWithGraphResponse struct {
	ID            uint    `json:"id"`             // HardwareParameter.ID
	Parameter     string  `json:"parameter"`      // HardwareParameter.Parameter
	GraphID       uint    `json:"graph_id"`       // HardwareGraph.ID
	Graph         string  `json:"graph"`          // HardwareGraph.Graph
	Color         string  `json:"color"`          // HardwareParameterColor.Code
	Unit          string  `json:"unit"`           // UnitHardware.Unit
	Standard      float64 `json:"standard"`       // StandardHardware.Standard
	StandardMin   float64 `json:"standard_min"`   // StandardHardware.StandardMin
	Icon          string  `json:"icon"`           // HardwareParameter.Icon
	Alert         bool    `json:"alert"`          // HardwareParameter.Alert
	Index         uint    `json:"index"`          // HardwareParameter.Index
	Right         bool    `json:"right"`          // HardwareParameter.Right
	GroupDisplay  bool    `json:"group_display"`  // ✅ เพิ่มฟิลด์นี้
	LayoutDisplay bool    `json:"layout_display"` // ✅ เพิ่มฟิลด์นี้
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
		c.JSON(http.StatusOK, gin.H{
			"hardware_id": hardwareID,
			"parameters":  []ParamWithGraphResponse{},
		})
		return
	}

	// 2. โหลด HardwareParameter พร้อมความสัมพันธ์ทั้งหมดที่จำเป็น
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

	// 3. map เป็น response ที่ frontend ต้องการ
	var result []ParamWithGraphResponse
	for _, p := range parameters {
		result = append(result, ParamWithGraphResponse{
			ID:            p.ID,
			Parameter:     p.Parameter,
			GraphID:       p.HardwareGraph.ID,
			Graph:         p.HardwareGraph.Graph,
			Color:         p.HardwareParameterColor.Code,
			Unit:          p.UnitHardware.Unit,
			Standard:      p.StandardHardware.MaxValueStandard,
			StandardMin:   p.StandardHardware.MinValueStandard,
			Icon:          p.Icon,
			Alert:         p.Alert,
			GroupDisplay:  p.GroupDisplay, // ✅ ส่งค่าออกไปด้วย
			LayoutDisplay: p.LayoutDisplay,
			Index:         p.Index,
			Right:         p.Right,
		})
	}

	// 4. ส่ง response
	c.JSON(http.StatusOK, gin.H{
		"hardware_id": hardwareID,
		"parameters":  result,
	})
}

func UpdateIconByHardwareParameterID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var payload struct {
		Icon  string `json:"icon"`
		Alert *bool  `json:"alert"` // ใช้ pointer เพื่อแยกว่า client ส่งมาหรือไม่
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	db := config.DB()
	var hardwareParam entity.HardwareParameter
	if err := db.First(&hardwareParam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "HardwareParameter not found"})
		return
	}

	// อัปเดตค่า
	hardwareParam.Icon = payload.Icon
	if payload.Alert != nil {
		hardwareParam.Alert = *payload.Alert
	}

	if err := db.Save(&hardwareParam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update hardware parameter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "HardwareParameter updated successfully",
		"id":      id,
		"icon":    hardwareParam.Icon,
		"alert":   hardwareParam.Alert,
	})
}

// ✅ ใช้ pointer เพื่อแยก "ไม่ส่งฟิลด์นี้มา" ออกจาก "ส่งค่า false/0"
type UpdateGroupAndIndexInput struct {
	GroupDisplay *bool `json:"group_display"` // optional
	Index        *uint `json:"index"`         // optional, ต้องการ 1..n
	Right        *bool `json:"right"`         // optional, true=ขวา, false=ซ้าย (ใช้เมื่อ layout_display=true)
}

// ✅ อัปเดตให้รองรับ GroupDisplay, Index และ Right (partial update)
func UpdateGroupDisplayByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input UpdateGroupAndIndexInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON input"})
		return
	}

	// อย่างน้อยต้องมีฟิลด์ใดฟิลด์หนึ่ง
	if input.GroupDisplay == nil && input.Index == nil && input.Right == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update (group_display or index or right required)"})
		return
	}

	// ถ้าส่ง index มา ให้ตรวจค่าขั้นต่ำเป็น 1
	if input.Index != nil && *input.Index == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "index must be >= 1"})
		return
	}

	db := config.DB()

	var parameter entity.HardwareParameter
	if err := db.First(&parameter, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "HardwareParameter not found"})
		return
	}

	// Partial update เฉพาะฟิลด์ที่ส่งมา
	updates := map[string]interface{}{}

	if input.GroupDisplay != nil {
		updates["group_display"] = *input.GroupDisplay
	}
	if input.Index != nil {
		updates["index"] = *input.Index
	}
	if input.Right != nil {
		updates["right"] = *input.Right
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid fields to update"})
		return
	}

	if err := db.Model(&parameter).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update fields"})
		return
	}

	if err := db.First(&parameter, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reload updated record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Updated successfully",
		"hardware_param": parameter,
	})
}

type UpdateLayoutDisplayInput struct {
	LayoutDisplay *bool `json:"layout_display" binding:"required"`
}

func UpdateLayoutDisplayByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input UpdateLayoutDisplayInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON input", "detail": err.Error()})
		return
	}

	db := config.DB()

	// ตรวจว่ามี record นี้จริง
	var hp entity.HardwareParameter
	if err := db.First(&hp, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "HardwareParameter not found", "detail": err.Error()})
		return
	}

	// อัปเดตเฉพาะคอลัมน์ layout_display
	if err := db.Model(&entity.HardwareParameter{}).
		Where("id = ?", id).
		Update("layout_display", *input.LayoutDisplay).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update LayoutDisplay", "detail": err.Error()})
		return
	}

	// โหลดค่าล่าสุดส่งกลับ
	if err := db.First(&hp, id).Error; err != nil {
		// อัปเดตได้แล้ว แต่โหลดกลับพลาดก็ยังถือว่าสำเร็จ
		c.JSON(http.StatusOK, gin.H{
			"message": "LayoutDisplay updated successfully",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "LayoutDisplay updated successfully",
		"hardware_param": hp,
	})
}

type DeleteSensorDataParameterRequest struct {
	IDs []uint `json:"ids" binding:"required"`
}

func DeleteSensorDataParametersByIds(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาส่ง IDs เป็น array"})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่มี ID สำหรับลบ"})
		return
	}

	db := config.DB()

	if err := db.Unscoped().Where("id IN ?", req.IDs).Delete(&entity.SensorDataParameter{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "ลบข้อมูลเรียบร้อยแล้ว",
		"deleted_ids": req.IDs,
	})
}

func DeleteAllSensorDataParametersBySensorID(c *gin.Context) {
	sensorDataIDStr := c.Param("sensorDataID")
	sensorDataID, err := strconv.ParseUint(sensorDataIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "SensorDataID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	if err := db.Unscoped().Where("sensor_data_id = ?", sensorDataID).Delete(&entity.SensorDataParameter{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว",
		"sensor_data_id": sensorDataID,
	})
}

func CreateNoteBySensorDataParameterID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	var requestBody struct {
		Note *string `json:"note" binding:"required"`
	}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง", "details": err.Error()})
		return
	}

	db := config.DB()

	var sdp entity.SensorDataParameter
	if err := db.First(&sdp, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล SensorDataParameter"})
		return
	}

	// ตั้งหมายเหตุ: ถ้า note == "" คือการล้างค่า
	noteVal := ""
	if requestBody.Note != nil {
		noteVal = *requestBody.Note
	}
	sdp.Note = noteVal

	if err := db.Save(&sdp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตหมายเหตุไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "บันทึกหมายเหตุสำเร็จ",
		"data":    sdp,
	})
}

func UpdateHardwareParameterColorByID(c *gin.Context) {
	idParam := c.Param("id")
	idUint64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	id := uint(idUint64)

	var req struct {
		Code       *string `json:"code"`
		EmployeeID *uint   `json:"employee_id"` // ✅ เพิ่ม field optional สำหรับอัปเดตพนักงานผู้รับผิดชอบ
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3) หา record สีเดิม
	var color entity.HardwareParameterColor
	if err := config.DB().First(&color, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "HardwareParameterColor not found"})
		return
	}

	// 4) เตรียม fields ที่จะ update เฉพาะในตารางสี
	updateFields := map[string]interface{}{}
	if req.Code != nil {
		updateFields["code"] = *req.Code
	}

	// 5) Update สี (ถ้ามี field ให้แก้)
	if len(updateFields) > 0 {
		if err := config.DB().Model(&color).Updates(updateFields).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 6) ถ้ามี employee_id ให้ไปอัปเดต HardwareParameter.EmployeeID
	if req.EmployeeID != nil {
		tx := config.DB().Model(&entity.HardwareParameter{}).
			Where("hardware_parameter_color_id = ?", color.ID).
			Update("employee_id", *req.EmployeeID)
		if tx.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": tx.Error.Error()})
			return
		}

	}

	c.JSON(http.StatusOK, color)
}

type checkPasswordRequest struct {
	Password string `json:"password" binding:"required"`
}

func CheckPasswordByID(c *gin.Context) {
	idStr := c.Param("id")
	empID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid employee id"})
		return
	}

	// 2) bind body
	var req checkPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password is required"})
		return
	}

	// 3) ดึง Employee เฉพาะฟิลด์ password
	db := config.DB()
	var emp entity.Employee
	if err := db.Select("id", "password").First(&emp, empID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
		return
	}

	// 4) เปรียบเทียบรหัสผ่าน (plaintext vs hash ใน DB)
	ok := config.CheckPasswordHash([]byte(req.Password), []byte(emp.Password))

	// 5) ส่งผลลัพธ์
	c.JSON(http.StatusOK, gin.H{
		"employee_id": emp.ID,
		"valid":       ok, // true = ตรง, false = ไม่ตรง
	})
}
