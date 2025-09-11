package starting

import (
	"bytes"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

const LineToken = "qNf5S5s+Rkqr0gFDW++ObPJzfhUbCbWwbEdCeDzVIzhsSqe3R1HyycZOtY2+NSuBCZ8NIWO9jhx/a2cmUA+kbuL3GNfyp5Ze+4sj5lBY403ndhyoEqlpI90eaV/Kp0sc92opJl5uAYH9QSIKIWpq1wdB04t89/1O/w1cDnyilFU="
const LineUserID = "Ucc082e3e6abf74aa767514630174b49f"

func TestingTool(c *gin.Context) {
	url := "https://api.line.me/v2/bot/message/push"
	body := map[string]interface{}{
		"to": LineUserID,
		"messages": []map[string]string{
			{"type": "text", "text": "Hello"},
		},
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+LineToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ส่งไม่สำเร็จ", "detail": err.Error()})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		c.JSON(http.StatusOK, gin.H{"message": "ส่ง Hello สำเร็จ!"})
	} else {
		c.JSON(resp.StatusCode, gin.H{"error": "Error จาก LINE API", "status": resp.Status})
	}
}
