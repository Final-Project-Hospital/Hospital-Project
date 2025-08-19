package dashboard

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

type EnvironmentalDataResponse struct {
	Date        time.Time `json:"date"`
	Value       float64   `json:"value"`
	Parameter   string    `json:"parameter"`
	Unit        string    `json:"unit"`
	Treatment   string    `json:"treatment"`
	Status      string    `json:"status"`
	Environment string    `json:"environment"`   // เพิ่มชื่อสภาพแวดล้อม
	EnvID       uint      `json:"environment_id"`// เพิ่ม id สภาพแวดล้อม
}

type EfficiencyResponse struct {
	Date       time.Time `json:"date"`
	Parameter  string    `json:"parameter"`
	Efficiency float64   `json:"efficiency"`
}

type AlertResponse struct {
	MonthYear string  `json:"month_year"`
	Parameter string  `json:"parameter"`
	Average   float64 `json:"average"`
	MaxValue  float64 `json:"max_value"`
	Unit      string  `json:"unit"`
}

/* ------------------------- DATA (records) ------------------------- */

func GetEnvironmentalDashboard(c *gin.Context) {
	db := config.DB()

	var records []struct {
		ID          uint      `json:"id"`
		Date        time.Time `json:"date"`
		Value       float64   `json:"value"`
		Parameter   string    `json:"parameter"`
		Treatment   string    `json:"treatment"`
		Unit        string    `json:"unit"`
		Environment string    `json:"environment"`
		EnvID       uint      `json:"environment_id"`
	}

	result := db.Model(&entity.EnvironmentalRecord{}).
		Select(`
			environmental_records.id,
			environmental_records.date,
			environmental_records.data AS value,
			parameters.parameter_name     AS parameter,
			CASE 
				WHEN environmental_records.before_after_treatment_id = 1 THEN 'ก่อน'
				WHEN environmental_records.before_after_treatment_id = 2 THEN 'หลัง'
			END                           AS treatment,
			units.unit_name               AS unit,
			environments.environment_name AS environment,
			environments.id               AS environment_id
		`).
		Joins("INNER JOIN parameters   ON environmental_records.parameter_id = parameters.id").
		Joins("INNER JOIN units        ON environmental_records.unit_id = units.id").
		Joins("INNER JOIN environments ON environmental_records.environment_id = environments.id").
		Order("environmental_records.date ASC").
		Scan(&records)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	out := make([]EnvironmentalDataResponse, 0, len(records))
	for _, r := range records {
		out = append(out, EnvironmentalDataResponse{
			Date:        r.Date,
			Value:       r.Value,
			Parameter:   r.Parameter,
			Unit:        r.Unit,
			Treatment:   r.Treatment,
			Status:      "",
			Environment: r.Environment,
			EnvID:       r.EnvID,
		})
	}

	c.JSON(http.StatusOK, out)
}

/* ------------------------- EFFICIENCY ------------------------- */

func GetEnvironmentalEfficiency(c *gin.Context) {
	db := config.DB()

	dateStr := c.Query("date")    // YYYY / YYYY-MM / YYYY-MM-DD
	filterType := c.Query("type") // year | month | date
	param := c.Query("param")     // optional

	var start, end time.Time
	now := time.Now().In(time.Local)

	if dateStr != "" && filterType != "" {
		switch filterType {
		case "year":
			year, err := strconv.Atoi(dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year format"})
				return
			}
			start = time.Date(year, 1, 1, 0, 0, 0, 0, time.Local)
			end = start.AddDate(1, 0, 0)
		case "month":
			t, err := time.ParseInLocation("2006-01", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month format. Expected YYYY-MM"})
				return
			}
			start = time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.Local)
			end = start.AddDate(0, 1, 0)
		case "date":
			t, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Expected YYYY-MM-DD"})
				return
			}
			start = time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local)
			end = start.AddDate(0, 0, 1)
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Expected year|month|date"})
			return
		}
	} else {
		end = now
		start = now.AddDate(-1, 0, 0)
	}

	type rec struct {
		Date      time.Time
		Parameter string
		Value     float64
		TreatID   int
	}
	var rows []rec

	q := db.Model(&entity.EnvironmentalRecord{}).
		Select(`
			environmental_records.date AS date,
			parameters.parameter_name  AS parameter,
			environmental_records.data AS value,
			before_after_treatments.id AS treat_id
		`).
		Joins("INNER JOIN parameters ON environmental_records.parameter_id = parameters.id").
		Joins("INNER JOIN before_after_treatments ON environmental_records.before_after_treatment_id = before_after_treatments.id").
		Where("environmental_records.date >= ? AND environmental_records.date < ?", start, end)

	if param != "" {
		q = q.Where("parameters.parameter_name = ?", param)
	}

	if err := q.Order("environmental_records.date ASC").Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type key struct {
		Day       string
		Parameter string
	}
	type pair struct {
		Before *float64
		After  *float64
		Date   time.Time
	}

	m := make(map[key]*pair)
	for _, r := range rows {
		dayKey := r.Date.Format("2006-01-02")
		k := key{Day: dayKey, Parameter: r.Parameter}
		p, ok := m[k]
		if !ok {
			p = &pair{Date: r.Date}
			m[k] = p
		}
		if r.TreatID == 1 {
			v := r.Value
			p.Before = &v
		} else if r.TreatID == 2 {
			v := r.Value
			p.After = &v
		}
	}

	resp := make([]EfficiencyResponse, 0, len(m))
	for k, p := range m {
		if p.Before == nil || p.After == nil || *p.Before == 0 {
			continue
		}
		// ให้เป็น "เปอร์เซ็นต์" เลย (0-100)
		eff := ((*p.Before - *p.After) / *p.Before) * 100.0
		resp = append(resp, EfficiencyResponse{
			Date:       p.Date,
			Parameter:  k.Parameter,
			Efficiency: eff,
		})
	}

	c.JSON(http.StatusOK, resp)
}

/* ------------------------- ALERTS ------------------------- */

func GetEnvironmentalAlerts(c *gin.Context) {
	db := config.DB()

	dateStr := c.Query("date")
	filterType := c.Query("type")
	param := c.Query("param")

	var start, end time.Time
	now := time.Now().In(time.Local)

	if dateStr != "" && filterType != "" {
		switch filterType {
		case "year":
			year, err := strconv.Atoi(dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year format"})
				return
			}
			start = time.Date(year, 1, 1, 0, 0, 0, 0, time.Local)
			end = start.AddDate(1, 0, 0)
		case "month":
			t, err := time.ParseInLocation("2006-01", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month format"})
				return
			}
			start = time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.Local)
			end = start.AddDate(0, 1, 0)
		case "date":
			t, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
				return
			}
			start = time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local)
			end = start.AddDate(0, 0, 1)
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Expected year|month|date"})
			return
		}
	} else {
		end = now
		start = now.AddDate(-1, 0, 0)
	}

	var alerts []AlertResponse

	tx := db.Table("environmental_records").
		Select(`
			DATE_FORMAT(environmental_records.date, '%Y-%m') AS month_year,
			parameters.parameter_name AS parameter,
			units.unit_name AS unit,
			AVG(environmental_records.data) AS average,
			standards.max_value
		`).
		Joins("INNER JOIN parameters ON environmental_records.parameter_id = parameters.id").
		Joins("INNER JOIN standards  ON environmental_records.standard_id = standards.id").
		Joins("INNER JOIN units      ON environmental_records.unit_id = units.id").
		Where("environmental_records.date >= ? AND environmental_records.date < ?", start, end).
		Group("month_year, parameter, max_value, unit").
		Having("AVG(environmental_records.data) > standards.max_value OR AVG(environmental_records.data) < standards.min_value OR AVG(environmental_records.data) > standards.middle_value")

	if param != "" {
		tx = tx.Where("parameters.parameter_name = ?", param)
	}

	if err := tx.Scan(&alerts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, alerts)
}

/* ------------------------- META (+ standards) ------------------------- */

// สำหรับส่งรายการ Environment -> Parameters (+ unit + มาตรฐานล่าสุดของพารามิเตอร์นั้น)
type MetaParam struct {
	ID         uint     `json:"id"`
	Name       string   `json:"name"`
	Unit       string   `json:"unit"`
	StdMin     *float64 `json:"std_min,omitempty"`
	StdMiddle  *float64 `json:"std_middle,omitempty"`
	StdMax     *float64 `json:"std_max,omitempty"`
}

type MetaEnvironment struct {
	ID     uint       `json:"id"`
	Name   string     `json:"name"`
	Params []MetaParam`json:"params"`
}

func GetEnvironmentalMeta(c *gin.Context) {
	db := config.DB()

	// ดึง "มาตรฐานล่าสุด" ต่อ (environment_id, parameter_id) โดยดูจากวันที่ล่าสุดใน environmental_records
	type row struct {
		EnvID      uint
		EnvName    string
		ParamID    uint
		ParamName  string
		UnitName   string
		StdMin     *float64
		StdMiddle  *float64
		StdMax     *float64
	}

	var rows []row

	// ใช้ raw SQL เพื่อความชัดเจน (รองรับ MySQL; หากใช้ Postgres ให้เปลี่ยน DATE_FORMAT เป็น TO_CHAR ตามเหมาะสม)
	raw := `
		WITH latest AS (
			SELECT environment_id, parameter_id, MAX(date) AS max_date
			FROM environmental_records
			GROUP BY environment_id, parameter_id
		)
		SELECT
			env.id                AS env_id,
			env.environment_name  AS env_name,
			p.id                  AS param_id,
			p.parameter_name      AS param_name,
			u.unit_name           AS unit_name,
			s.min_value           AS std_min,
			s.middle_value        AS std_middle,
			s.max_value           AS std_max
		FROM environmental_records er
		JOIN latest l ON l.environment_id = er.environment_id AND l.parameter_id = er.parameter_id AND l.max_date = er.date
		JOIN environments env ON env.id = er.environment_id
		JOIN parameters   p   ON p.id   = er.parameter_id
		LEFT JOIN units   u   ON u.id   = er.unit_id
		LEFT JOIN standards s ON s.id   = er.standard_id
		ORDER BY env.id, p.id
	`
	if err := db.Raw(raw).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	byEnv := make(map[uint]*MetaEnvironment)
	for _, r := range rows {
		env, ok := byEnv[r.EnvID]
		if !ok {
			env = &MetaEnvironment{ID: r.EnvID, Name: r.EnvName, Params: []MetaParam{}}
			byEnv[r.EnvID] = env
		}
		env.Params = append(env.Params, MetaParam{
			ID:        r.ParamID,
			Name:      r.ParamName,
			Unit:      r.UnitName,
			StdMin:    r.StdMin,
			StdMiddle: r.StdMiddle,
			StdMax:    r.StdMax,
		})
	}

	// flatten ออกไปเป็น slice
	resp := make([]MetaEnvironment, 0, len(byEnv))
	for _, v := range byEnv {
		resp = append(resp, *v)
	}

	c.JSON(http.StatusOK, resp)
}
