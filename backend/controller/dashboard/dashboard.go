package dashboard

import (
	"net/http"
	"time"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
)

type EnvironmentalDataResponse struct {
	Date      time.Time `json:"date"`
	Value     float64   `json:"value"`
	Parameter string    `json:"parameter"`
	Unit      string    `json:"unit"`
	Treatment string    `json:"treatment"`
	Status    string    `json:"status"`
}

func GetEnvironmentalDashboard(c *gin.Context) {
	db := config.DB()

	// รับ query params ตาม frontend ส่ง
	dateStr := c.Query("date")       // รูปแบบปี, เดือน หรือวัน ขึ้นกับ type
	filterType := c.Query("type")    // date, month, year
	viewType := c.Query("view")      // before, after, compare
	param := c.Query("param")        // ชื่อ parameter เช่น BOD, TDS

	var records []EnvironmentalDataResponse

	// แปลงวันที่
	var parsedDate time.Time
	var err error
	if dateStr != "" {
		switch filterType {
		case "year":
			year, err := strconv.Atoi(dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year format"})
				return
			}
			parsedDate = time.Date(year, 1, 1, 0, 0, 0, 0, time.Local)
		case "month":
			parsedDate, err = time.Parse("2006-01", dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month format. Expected YYYY-MM"})
				return
			}
		case "date":
			parsedDate, err = time.Parse("2006-01-02", dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Expected YYYY-MM-DD"})
				return
			}
		default:
			parsedDate, err = time.Parse("2006-01-02", dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Expected YYYY-MM-DD"})
				return
			}
		}
	}

	// สร้าง query
	query := db.Model(&entity.EnvironmentalRecord{}).
		Select("environmental_records.date, environmental_records.data AS value, " +
			"parameters.parameter_name AS parameter, units.unit_name AS unit, " +
			"before_after_treatments.treatment_name AS treatment, statuses.status_name AS status").
		Joins("INNER JOIN parameters ON environmental_records.parameter_id = parameters.id").
		Joins("INNER JOIN units ON environmental_records.unit_id = units.id").
		Joins("INNER JOIN before_after_treatments ON environmental_records.before_after_treatment_id = before_after_treatments.id").
		Joins("INNER JOIN statuses ON environmental_records.status_id = statuses.id")

	// กรองวันตามประเภท
	if dateStr != "" {
		switch filterType {
		case "year":
			query = query.Where("EXTRACT(YEAR FROM environmental_records.date) = ?", parsedDate.Year())
		case "month":
			query = query.Where("EXTRACT(YEAR FROM environmental_records.date) = ? AND EXTRACT(MONTH FROM environmental_records.date) = ?", parsedDate.Year(), int(parsedDate.Month()))
		case "date":
			query = query.Where("DATE(environmental_records.date) = ?", parsedDate.Format("2006-01-02"))
		default:
			query = query.Where("DATE(environmental_records.date) = ?", parsedDate.Format("2006-01-02"))
		}
	}

	// กรอง parameter
	if param != "" {
		query = query.Where("parameters.parameter_name = ?", param)
	}

	// กรอง viewType (ก่อนบำบัด/หลังบำบัด/เปรียบเทียบ)
	switch viewType {
	case "before":
		query = query.Where("before_after_treatments.id = ?", 1)
	case "after":
		query = query.Where("before_after_treatments.id = ?", 2)
	case "compare":
		query = query.Where("before_after_treatments.id IN (?)", []int{1, 2})
	}

	// เรียงลำดับตามวันที่
	err = query.Order("environmental_records.date ASC").Scan(&records).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, records)
}
