package main

import (
	"net/http"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/controller/building"
	"github.com/Tawunchai/hospital-project/controller/calendar"
	"github.com/Tawunchai/hospital-project/controller/line"
	"github.com/Tawunchai/hospital-project/controller/predict"
	"github.com/Tawunchai/hospital-project/controller/report"
	"github.com/Tawunchai/hospital-project/controller/wastewater/bodcenter"
	"github.com/Tawunchai/hospital-project/controller/wastewater/fogcenter"

	"github.com/Tawunchai/hospital-project/controller/graph"
	"github.com/Tawunchai/hospital-project/controller/hardware"
	"github.com/Tawunchai/hospital-project/controller/logins"
	"github.com/Tawunchai/hospital-project/controller/room"
	"github.com/Tawunchai/hospital-project/controller/sensordata"

	"github.com/Tawunchai/hospital-project/controller/wastewater/codcenter"
	"github.com/Tawunchai/hospital-project/controller/wastewater/fcbcenter"
	"github.com/Tawunchai/hospital-project/controller/wastewater/phcenter"
	"github.com/Tawunchai/hospital-project/controller/wastewater/residulecenter"
	"github.com/Tawunchai/hospital-project/controller/wastewater/sulfidcenter"
	"github.com/Tawunchai/hospital-project/controller/wastewater/tcbcenter"
	"github.com/Tawunchai/hospital-project/controller/wastewater/tdscenter"
	"github.com/Tawunchai/hospital-project/controller/wastewater/tkncenter"
	"github.com/Tawunchai/hospital-project/controller/wastewater/tscenter"

	//drinkwater
	"github.com/Tawunchai/hospital-project/controller/drinkwater/glass/dfcbcenter"
	"github.com/Tawunchai/hospital-project/controller/drinkwater/glass/dtcbcenter"
	"github.com/Tawunchai/hospital-project/controller/drinkwater/glass/ecoilcenter"
	"github.com/Tawunchai/hospital-project/controller/drinkwater/tank/dfcbcenterT"
	"github.com/Tawunchai/hospital-project/controller/drinkwater/tank/dtcbcenterT"
	"github.com/Tawunchai/hospital-project/controller/drinkwater/tank/ecoilcenterT"

	//tapwater
	"github.com/Tawunchai/hospital-project/controller/tapwater/alcenter"
	"github.com/Tawunchai/hospital-project/controller/tapwater/ironcenter"
	"github.com/Tawunchai/hospital-project/controller/tapwater/mncenter"
	"github.com/Tawunchai/hospital-project/controller/tapwater/nicenter"
	"github.com/Tawunchai/hospital-project/controller/tapwater/ntucenter"
	"github.com/Tawunchai/hospital-project/controller/tapwater/ptcenter"
	"github.com/Tawunchai/hospital-project/controller/tapwater/tcodcenter"
	"github.com/Tawunchai/hospital-project/controller/tapwater/thcenter"
	"github.com/Tawunchai/hospital-project/controller/tapwater/ttcbcenter"

	//tapwater
	"github.com/Tawunchai/hospital-project/controller/employee"
	"github.com/Tawunchai/hospital-project/controller/position"

	//Garbage
	"github.com/Tawunchai/hospital-project/controller/garbage/chemicalWaste"
	"github.com/Tawunchai/hospital-project/controller/garbage/generalWaste"
	"github.com/Tawunchai/hospital-project/controller/garbage/hazardousWaste"
	"github.com/Tawunchai/hospital-project/controller/garbage/infectiousWaste"
	"github.com/Tawunchai/hospital-project/controller/garbage/recycledWaste"

	user "github.com/Tawunchai/hospital-project/controller/users"
	"github.com/Tawunchai/hospital-project/middlewares"

	"github.com/Tawunchai/hospital-project/controller/dashboard"
	"github.com/Tawunchai/hospital-project/controller/selectBoxAll"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"strconv"
)

const PORT = "8000"

func main() {

	config.ConnectionDB()

	config.SetupDatabase()

	r := gin.Default()

	r.Use(CORSMiddleware())

	r.POST("/login", logins.AddLogin)
	r.POST("/signup", user.SignUpByUser)
	r.GET("/check-email", employee.CheckEmail)
	r.POST("/reset-password", employee.ResetPassword)
	r.POST("/hardware/receive", hardware.ReceiveSensorData)
	r.POST("/webhook/notification", hardware.WebhookNotification) 
	r.POST("/hardware/read", hardware.ReadDataForHardware) // encryption

	authorized := r.Group("")
	authorized.Use(middlewares.Authorizes())
	{
		authorized.PATCH("/api/employees/:id/role", employee.UpdateRole)
		authorized.PUT("/api/employees/:id", employee.UpdateEmployeeInfo)
		authorized.DELETE("/api/employees/:id", employee.DeleteEmployee)
		// Dashboard (สิ่งแวดล้อม)
		authorized.GET("/dashboard/environmental", dashboard.GetEnvironmentalDashboard)
		authorized.GET("/dashboard/environmental/efficiency", dashboard.GetEnvironmentalEfficiency)
		authorized.GET("/dashboard/environmental/alerts", dashboard.GetEnvironmentalAlerts)
		authorized.GET("/dashboard/environmental/meta", dashboard.GetEnvironmentalMeta)

		// Waste dashboard
		authorized.GET("/waste-mix", dashboard.GetWasteMix)               // กราฟวงกลมสัดส่วนขยะ
		authorized.GET("/recycled/revenue", dashboard.GetRecycledRevenue) // กราฟรายได้รีไซเคิล
		authorized.GET("/waste-mix/month", dashboard.GetWasteMixByMonth)
		authorized.GET("/api/me", func(c *gin.Context) {
			// ดึง user id จาก context (ลองหลาย key ที่พบบ่อย)
			var id uint
			var okFound bool
			for _, k := range []string{"employee_id", "EmployeeID", "user_id", "userID", "id", "ID", "sub"} {
				if v, ok := c.Get(k); ok {
					switch t := v.(type) {
					case uint:
						id = t
						okFound = true
					case int:
						id = uint(t)
						okFound = true
					case int64:
						id = uint(t)
						okFound = true
					case float64:
						id = uint(t)
						okFound = true
					case string:
						if u64, err := strconv.ParseUint(t, 10, 64); err == nil {
							id = uint(u64)
							okFound = true
						}
					}
					if okFound {
						break
					}
				}
			}
			if !okFound || id == 0 {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
				return
			}

			// โหลดข้อมูลพนักงาน
			var emp entity.Employee
			if err := config.DB().Preload("Role").Preload("Position").First(&emp, id).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
				return
			}

			// ตอบข้อมูลเท่าที่ frontend ต้องใช้
			c.JSON(http.StatusOK, gin.H{
				"ID":        emp.ID,
				"FirstName": emp.FirstName,
				"LastName":  emp.LastName,
				"Email":     emp.Email,
				"Phone":     emp.Phone,
				"Profile":   emp.Profile,
				"Role":      emp.Role,     // มี RoleName อยู่ข้างใน
				"Position":  emp.Position, // มี Position อยู่ข้างใน
			})
		})

		//User
		authorized.GET("/users", user.ListUsers)                            
		authorized.GET("/user-data/:EmployeeID", user.GetDataByUserID)      
		authorized.PATCH("/employees/:EmployeeID", user.UpdateEmployeeByID) 
		authorized.GET("/roles", employee.ListRole)                         

		//Room
		authorized.GET("/rooms", room.ListRoom)                    
		authorized.POST("/create-rooms", room.CreateRoom)          
		authorized.PATCH("/update-room/:id", room.UpdateRoom)      
		authorized.DELETE("/delete-room/:id", room.DeleteRoomById) 

		//Hardware
		authorized.GET("/hardwares", hardware.ListHardware)                                               
		authorized.GET("/hardware-colors", hardware.ListColors)                                           
		authorized.GET("/hardware-parameter/by-hardware/:id", hardware.ListHardwareParameterByHardwareID) 
		authorized.PATCH("/update-hardware-parameter/:id", hardware.UpdateHardwareParameterByID)          
		authorized.GET("/hardware-parameter-ids", hardware.GetHardwareParametersWithGraph)               
		authorized.PATCH("/hardware-parameters/:id/icon", hardware.UpdateIconByHardwareParameterID)      
		authorized.PUT("/hardware-parameter/:id/group-display", hardware.UpdateGroupDisplayByID)         
		authorized.PATCH("/sensor-data-parameter/:id/note", hardware.CreateNoteBySensorDataParameterID) 
		authorized.PATCH("/hardware-parameters/:id/layout-display", hardware.UpdateLayoutDisplayByID)      
		authorized.PATCH("/update-hardware-parameter-color/:id", hardware.UpdateHardwareParameterColorByID)
		authorized.POST("/employees/:id/check-password", hardware.CheckPasswordByID)                       
		authorized.GET("/report-hardware", report.ListReportHardware)
		authorized.PUT("/update-hardware/:id", hardware.UpdateHardwareByID) 
		authorized.DELETE("/delete-hardware/:id", hardware.DeleteHardwareByID) 

		//Standard and Unit
		authorized.PUT("/update-unit-hardware/:id", hardware.UpdateUnitHardwareByID)
		authorized.PUT("/update-standard-hardware/:id", hardware.UpdateStandardHardwareByID)

		// Line + Webhook
		authorized.GET("/notifications", line.ListNotification)
		authorized.PATCH("/notifications/:id/alert", line.UpdateAlertByNotificationID)
		authorized.DELETE("/delete-notifications/:id", line.DeleteNotificationByID)
		authorized.GET("/room-notifications", line.ListRoomNotification)
		authorized.DELETE("/room-notifications/:id", line.DeleteRoomNotificationByNotificationID)
		authorized.POST("/create-notification", line.CreateNotification)
		authorized.PATCH("/update-notification/:id", line.UpdateNotificationByID)
		authorized.POST("/room-notifications", line.CreateRoomNotification)
		authorized.PUT("/room-notification/:room_id/notification", line.UpdateNotificationIDByRoomID)
		authorized.GET("/line-master/first", line.GetLineMasterFirstID)
		authorized.PUT("/line-master/:id", line.UpdateLineMasterByID)

		// Sensorparameter
		authorized.GET("/sensor-data-parameters/:id", sensordata.GetSensorDataParametersBySensorDataID)
		authorized.GET("/sensor-data-by-hardware/:id", sensordata.GetSensorDataIDByHardwareID) 
		authorized.GET("/data-sensorparameter", sensordata.ListDataSensorParameter)
		authorized.GET("/hardware-parameters-by-parameter", sensordata.ListDataHardwareParameterByParameter)
		authorized.DELETE("/sensor-data-parameters", hardware.DeleteSensorDataParametersByIds)
		authorized.DELETE("/sensor-data-parameters/all/:sensorDataID", hardware.DeleteAllSensorDataParametersBySensorID)

		//Graph Hardware
		authorized.GET("/hardware-graphs", graph.ListDataGraph)

		//Building
		authorized.GET("/buildings", building.ListBuilding)
		authorized.POST("/create-buildings", building.CreateBuilding)
		authorized.PUT("/update-buildings/:id", building.UpdateBuildingByID)
		authorized.DELETE("/delete-buildings/:id", building.DeleteBuildingByID)

		//Calendar
		authorized.GET("/calendars", calendar.ListCalendar)
		authorized.POST("/create-calendar", calendar.PostCalendar)
		authorized.PUT("/update-calendar/:id", calendar.UpdateCalendar)
		authorized.DELETE("/delete-calendar/:id", calendar.DeleteCalendar)

		//PH
		authorized.POST("/create-ph", phcenter.CreatePH)
		authorized.GET("/get-first-ph", phcenter.GetfirstPH)
		authorized.GET("/list-ph", phcenter.ListPH)
		authorized.GET("/get-ph/:id", phcenter.GetPHbyID)
		authorized.GET("/get-ph-table", phcenter.GetPHTABLE)
		authorized.PATCH("/update-or-create-ph/:d", phcenter.UpdateOrCreatePH)
		authorized.DELETE("/delete-ph/:id", phcenter.DeletePH)
		authorized.DELETE("/delete-ph-day/:id", phcenter.DeleteAllPHRecordsByDate)
		authorized.GET("/get-beforeafter-ph", phcenter.GetBeforeAfterPH)

		//TDS
		authorized.POST("/create-tds", tdscenter.CreateTDS)
		authorized.GET("/get-first-tds", tdscenter.GetfirstTDS)
		authorized.GET("/list-tds", tdscenter.ListTDS)
		authorized.GET("/get-tds/:id", tdscenter.GetTDSbyID)
		authorized.GET("/get-tds-table", tdscenter.GetTDSTABLE)
		authorized.PATCH("/update-or-create-tds/:d", tdscenter.UpdateOrCreateTDS)
		authorized.DELETE("/delete-tds/:id", tdscenter.DeleteTDS)
		authorized.DELETE("/delete-tds-day/:id", tdscenter.DeleteAllTDSRecordsByDate)
		authorized.GET("/get-beforeafter-tds", tdscenter.GetBeforeAfterTDS)

		authorized.GET("/check-units", tdscenter.CheckUnit)
		authorized.GET("/check-standard", tdscenter.CheckStandard)
		authorized.GET("/get-alert-software", tdscenter.GetAlertSoftware)

		//TKN
		authorized.POST("/create-tkn", tkncenter.CreateTKN)
		authorized.GET("/get-first-tkn", tkncenter.GetfirstTKN)
		authorized.GET("/list-tkn", tkncenter.ListTKN)
		authorized.GET("/get-tkn/:id", tkncenter.GetTKNbyID)
		authorized.GET("/get-tkn-table", tkncenter.GetTKNTABLE)
		authorized.PATCH("/update-or-create-tkn/:d", tkncenter.UpdateOrCreateTKN)
		authorized.DELETE("/delete-tkn/:id", tkncenter.DeleteTKN)
		authorized.DELETE("/delete-tkn-day/:id", tkncenter.DeleteAllTKNRecordsByDate)
		authorized.GET("/get-beforeafter-tkn", tkncenter.GetBeforeAfterTKN)

		//TS
		authorized.POST("/create-ts", tscenter.CreateTS)
		authorized.GET("/get-first-ts", tscenter.GetfirstTS)
		authorized.GET("/list-ts", tscenter.ListTS)
		authorized.GET("/get-ts/:id", tscenter.GetTSbyID)
		authorized.GET("/get-ts-table", tscenter.GetTSTABLE)
		authorized.PATCH("/update-or-create-ts/:d", tscenter.UpdateOrCreateTS)
		authorized.DELETE("/delete-ts/:id", tscenter.DeleteTS)
		authorized.DELETE("/delete-ts-day/:id", tscenter.DeleteAllTSRecordsByDate)
		authorized.GET("/get-beforeafter-ts", tscenter.GetBeforeAfterTS)

		//COD
		authorized.POST("/create-cod", codcenter.CreateCOD)
		authorized.GET("/get-first-cod", codcenter.GetfirstCOD)
		authorized.GET("/list-cod", codcenter.ListCOD)
		authorized.GET("/get-cod/:id", codcenter.GetCODbyID)
		authorized.GET("/get-cod-table", codcenter.GetCODTABLE)
		authorized.PATCH("/update-or-create-cod/:d", codcenter.UpdateOrCreateCOD)
		authorized.DELETE("/delete-cod/:id", codcenter.DeleteCOD)
		authorized.DELETE("/delete-cod-day/:id", codcenter.DeleteAllCODRecordsByDate)
		authorized.GET("/get-beforeafter-cod", codcenter.GetBeforeAfterCOD)

		//FCB
		authorized.POST("/create-fcb", fcbcenter.CreateFCB)
		authorized.GET("/get-first-fcb", fcbcenter.GetfirstFCB)
		authorized.GET("/list-fcb", fcbcenter.ListFCB)
		authorized.GET("/get-fcb/:id", fcbcenter.GetFCBbyID)
		authorized.GET("/get-fcb-table", fcbcenter.GetFCBTABLE)
		authorized.PATCH("/update-or-create-fcb/:d", fcbcenter.UpdateOrCreateFCB)
		authorized.DELETE("/delete-fcb/:id", fcbcenter.DeleteFCB)
		authorized.DELETE("/delete-fcb-day/:id", fcbcenter.DeleteAllFCBRecordsByDate)
		authorized.GET("/get-beforeafter-fcb", fcbcenter.GetBeforeAfterFCB)

		//RES
		authorized.POST("/create-res", rescenter.CreateRES)
		authorized.GET("/get-first-res", rescenter.GetfirstRES)
		authorized.GET("/list-res", rescenter.ListRES)
		authorized.GET("/get-res/:id", rescenter.GetRESbyID)
		authorized.GET("/get-res-table", rescenter.GetRESTABLE)
		authorized.PATCH("/update-or-create-res/:d", rescenter.UpdateOrCreateRES)
		authorized.DELETE("/delete-res/:id", rescenter.DeleteRES)
		authorized.DELETE("/delete-res-day/:id", rescenter.DeleteAllRESRecordsByDate)
		authorized.GET("/get-beforeafter-res", rescenter.GetBeforeAfterRES)

		//SUL
		authorized.POST("/create-sul", sulcenter.CreateSUL)
		authorized.GET("/get-first-sul", sulcenter.GetfirstSUL)
		authorized.GET("/list-sul", sulcenter.ListSUL)
		authorized.GET("/get-sul/:id", sulcenter.GetSULbyID)
		authorized.GET("/get-sul-table", sulcenter.GetSULTABLE)
		authorized.PATCH("/update-or-create-sul/:d", sulcenter.UpdateOrCreateSUL)
		authorized.DELETE("/delete-sul/:id", sulcenter.DeleteSUL)
		authorized.DELETE("/delete-sul-day/:id", sulcenter.DeleteAllSULRecordsByDate)
		authorized.GET("/get-beforeafter-sul", sulcenter.GetBeforeAfterSUL)

		//TCB
		authorized.POST("/create-tcb", tcbcenter.CreateTCB)
		authorized.GET("/get-first-tcb", tcbcenter.GetfirstTCB)
		authorized.GET("/list-tcb", tcbcenter.ListTCB)
		authorized.GET("/get-tcb/:id", tcbcenter.GetTCBbyID)
		authorized.GET("/get-tcb-table", tcbcenter.GetTCBTABLE)
		authorized.PATCH("/update-or-create-tcb/:d", tcbcenter.UpdateOrCreateTCB)
		authorized.DELETE("/delete-tcb/:id", tcbcenter.DeleteTCB)
		authorized.DELETE("/delete-tcb-day/:id", tcbcenter.DeleteAllTCBRecordsByDate)
		authorized.GET("/get-beforeafter-tcb", tcbcenter.GetBeforeAfterTCB)

		//BOD
		authorized.POST("/create-bod", bodcenter.CreateBod)
		authorized.GET("/get-first-bod", bodcenter.GetfirstBOD)
		authorized.GET("/list-bod", bodcenter.ListBOD)
		authorized.GET("/get-bod/:id", bodcenter.GetBODbyID)
		authorized.GET("/get-bod-table", bodcenter.GetBODTABLE)
		authorized.PATCH("/update-or-create-bod/:d", bodcenter.UpdateOrCreateBOD)
		authorized.DELETE("/delete-bod/:id", bodcenter.DeleteBOD)
		authorized.DELETE("/delete-bod-day/:id", bodcenter.DeleteAllBODRecordsByDate)
		authorized.GET("/get-beforeafter-bod", bodcenter.GetBeforeAfterBOD) //เพิ่ม

		//FOG
		authorized.POST("/create-fog", fogcenter.CreateFOG)
		authorized.GET("/get-first-fog", fogcenter.GetfirstFOG)
		authorized.GET("/list-fog", fogcenter.ListFOG)
		authorized.GET("/get-fog/:id", fogcenter.GetFOGbyID)
		authorized.GET("/get-fog-table", fogcenter.GetFOGTABLE)
		authorized.PATCH("/update-or-create-fog/:d", fogcenter.UpdateOrCreateFOG)
		authorized.DELETE("/delete-fog/:id", fogcenter.DeleteFOG)
		authorized.DELETE("/delete-fog-day/:id", fogcenter.DeleteAllFOGRecordsByDate)
		authorized.GET("/get-beforeafter-fog", fogcenter.GetBeforeAfterFOG)

		//drinkwater
		//ecoin(glass)
		authorized.POST("/create-eco", ecocenter.CreateECO)
		authorized.GET("/get-first-eco", ecocenter.GetfirstECO)
		authorized.GET("/list-eco", ecocenter.ListECO)
		authorized.GET("/get-eco/:id", ecocenter.GetECObyID)
		authorized.GET("/get-eco-table", ecocenter.GetECOTABLE)
		authorized.PATCH("/update-or-create-eco/:d", ecocenter.UpdateOrCreateECO)
		authorized.DELETE("/delete-eco/:id", ecocenter.DeleteECO)
		authorized.DELETE("/delete-eco-day/:id", ecocenter.DeleteAllECORecordsByDate)
		authorized.GET("/get-beforeafter-eco", ecocenter.GetBeforeAfterECO)

		//DFCB(glass)
		authorized.POST("/create-dfcb", dfcbcenter.CreateDFCB)
		authorized.GET("/get-first-dfcb", dfcbcenter.GetfirstDFCB)
		authorized.GET("/list-dfcb", dfcbcenter.ListDFCB)
		authorized.GET("/get-dfcb/:id", dfcbcenter.GetDFCBbyID)
		authorized.GET("/get-dfcb-table", dfcbcenter.GetDFCBTABLE)
		authorized.PATCH("/update-or-create-dfcb/:d", dfcbcenter.UpdateOrCreateDFCB)
		authorized.DELETE("/delete-dfcb/:id", dfcbcenter.DeleteDFCB)
		authorized.DELETE("/delete-dfcb-day/:id", dfcbcenter.DeleteAllDFCBRecordsByDate)
		authorized.GET("/get-beforeafter-dfcb", dfcbcenter.GetBeforeAfterDFCB)

		//DTCB(glass)
		authorized.POST("/create-dtcb", dtcbcenter.CreateDTCB)
		authorized.GET("/get-first-dtcb", dtcbcenter.GetfirstDTCB)
		authorized.GET("/list-dtcb", dtcbcenter.ListDTCB)
		authorized.GET("/get-dtcb/:id", dtcbcenter.GetDTCBbyID)
		authorized.GET("/get-dtcb-table", dtcbcenter.GetDTCBTABLE)
		authorized.PATCH("/update-or-create-dtcb/:d", dtcbcenter.UpdateOrCreateDTCB)
		authorized.DELETE("/delete-dtcb/:id", dtcbcenter.DeleteDTCB)
		authorized.DELETE("/delete-dtcb-day/:id", dtcbcenter.DeleteAllDTCBRecordsByDate)
		authorized.GET("/get-beforeafter-dtcb", dtcbcenter.GetBeforeAfterDTCB)

		//ecoin(tank)
		authorized.POST("/create-eco-tank", ecocenterT.CreateECOtank)
		authorized.GET("/get-first-eco-tank", ecocenterT.GetfirstECOtank)
		authorized.GET("/list-eco-tank", ecocenterT.ListECOtank)
		authorized.GET("/get-eco-tank/:id", ecocenterT.GetECOtankbyID)
		authorized.GET("/get-eco-tank-table", ecocenterT.GetECOtankTABLE)
		authorized.PATCH("/update-or-create-eco-tank/:d", ecocenterT.UpdateOrCreateECOtank)
		authorized.DELETE("/delete-eco-tank/:id", ecocenterT.DeleteECOtank)
		authorized.DELETE("/delete-eco-tank-day/:id", ecocenterT.DeleteAllECOtankRecordsByDate)
		authorized.GET("/get-beforeafter-eco-tank", ecocenterT.GetBeforeAfterECOtank)

		//DFCB(tank)
		authorized.POST("/create-dfcb-tank", dfcbcenterT.CreateDFCBtank)
		authorized.GET("/get-first-dfcb-tank", dfcbcenterT.GetfirstDFCBtank)
		authorized.GET("/list-dfcb-tank", dfcbcenterT.ListDFCBtank)
		authorized.GET("/get-dfcb-tank/:id", dfcbcenterT.GetDFCBtankbyID)
		authorized.GET("/get-dfcb-tank-table", dfcbcenterT.GetDFCBtankTABLE)
		authorized.PATCH("/update-or-create-dfcb-tank/:d", dfcbcenterT.UpdateOrCreateDFCBtank)
		authorized.DELETE("/delete-dfcb-tank/:id", dfcbcenterT.DeleteDFCBtank)
		authorized.DELETE("/delete-dfcb-tank-day/:id", dfcbcenterT.DeleteAllDFCBtankRecordsByDate)
		authorized.GET("/get-beforeafter-dfcb-tank", dfcbcenterT.GetBeforeAfterDFCBtank)

		//DTCB(tank)
		authorized.POST("/create-dtcb-tank", dtcbcenterT.CreateDTCBtank)
		authorized.GET("/get-first-dtcb-tank", dtcbcenterT.GetfirstDTCBtank)
		authorized.GET("/list-dtcb-tank", dtcbcenterT.ListDTCBtank)
		authorized.GET("/get-dtcb-tank/:id", dtcbcenterT.GetDTCBtankbyID)
		authorized.GET("/get-dtcb-tank-table", dtcbcenterT.GetDTCBtankTABLE)
		authorized.PATCH("/update-or-create-dtcb-tank/:d", dtcbcenterT.UpdateOrCreateDTCBtank)
		authorized.DELETE("/delete-dtcb-tank/:id", dtcbcenterT.DeleteDTCBtank)
		authorized.DELETE("/delete-dtcb-tank-day/:id", dtcbcenterT.DeleteAllDTCBtankRecordsByDate)
		authorized.GET("/get-beforeafter-dtcb-tank", dtcbcenterT.GetBeforeAfterDTCBtank)

		//tapwater
		//al
		authorized.POST("/create-al", alcenter.CreateAL)
		authorized.GET("/get-first-al", alcenter.GetfirstAL)
		authorized.GET("/list-al", alcenter.ListAL)
		authorized.GET("/get-al/:id", alcenter.GetALbyID)
		authorized.GET("/get-al-table", alcenter.GetALTABLE)
		authorized.PATCH("/update-or-create-al/:d", alcenter.UpdateOrCreateAL)
		authorized.DELETE("/delete-al/:id", alcenter.DeleteAL)
		authorized.DELETE("/delete-al-day/:id", alcenter.DeleteAllALRecordsByDate)
		authorized.GET("/get-beforeafter-al", alcenter.GetBeforeAfterAL)

		//iron
		authorized.POST("/create-iron", ironcenter.CreateIRON)
		authorized.GET("/get-first-iron", ironcenter.GetfirstIRON)
		authorized.GET("/list-iron", ironcenter.ListIRON)
		authorized.GET("/get-iron/:id", ironcenter.GetIRONbyID)
		authorized.GET("/get-iron-table", ironcenter.GetIRONTABLE)
		authorized.PATCH("/update-or-create-iron/:d", ironcenter.UpdateOrCreateIRON)
		authorized.DELETE("/delete-iron/:id", ironcenter.DeleteIRON)
		authorized.DELETE("/delete-iron-day/:id", ironcenter.DeleteAllIRONRecordsByDate)
		authorized.GET("/get-beforeafter-iron", ironcenter.GetBeforeAfterIRON)

		//mn
		authorized.POST("/create-mn", mncenter.CreateMN)
		authorized.GET("/get-first-mn", mncenter.GetfirstMN)
		authorized.GET("/list-mn", mncenter.ListMN)
		authorized.GET("/get-mn/:id", mncenter.GetMNbyID)
		authorized.GET("/get-mn-table", mncenter.GetMNTABLE)
		authorized.PATCH("/update-or-create-mn/:d", mncenter.UpdateOrCreateMN)
		authorized.DELETE("/delete-mn/:id", mncenter.DeleteMN)
		authorized.DELETE("/delete-mn-day/:id", mncenter.DeleteAllMNRecordsByDate)
		authorized.GET("/get-beforeafter-mn", mncenter.GetBeforeAfterMN)

		//ni
		authorized.POST("/create-ni", nicenter.CreateNI)
		authorized.GET("/get-first-ni", nicenter.GetfirstNI)
		authorized.GET("/list-ni", nicenter.ListNI)
		authorized.GET("/get-ni/:id", nicenter.GetNIbyID)
		authorized.GET("/get-ni-table", nicenter.GetNITABLE)
		authorized.PATCH("/update-or-create-ni/:d", nicenter.UpdateOrCreateNI)
		authorized.DELETE("/delete-ni/:id", nicenter.DeleteNI)
		authorized.DELETE("/delete-ni-day/:id", nicenter.DeleteAllNIRecordsByDate)
		authorized.GET("/get-beforeafter-ni", nicenter.GetBeforeAfterNI)

		//ntu
		authorized.POST("/create-ntu", ntucenter.CreateNTU)
		authorized.GET("/get-first-ntu", ntucenter.GetfirstNTU)
		authorized.GET("/list-ntu", ntucenter.ListNTU)
		authorized.GET("/get-ntu/:id", ntucenter.GetNTUbyID)
		authorized.GET("/get-ntu-table", ntucenter.GetNTUTABLE)
		authorized.PATCH("/update-or-create-ntu/:d", ntucenter.UpdateOrCreateNTU)
		authorized.DELETE("/delete-ntu/:id", ntucenter.DeleteNTU)
		authorized.DELETE("/delete-ntu-day/:id", ntucenter.DeleteAllNTURecordsByDate)
		authorized.GET("/get-beforeafter-ntu", ntucenter.GetBeforeAfterNTU)

		//pt
		authorized.POST("/create-pt", ptcenter.CreatePT)
		authorized.GET("/get-first-pt", ptcenter.GetfirstPT)
		authorized.GET("/list-pt", ptcenter.ListPT)
		authorized.GET("/get-pt/:id", ptcenter.GetPTbyID)
		authorized.GET("/get-pt-table", ptcenter.GetPTTABLE)
		authorized.PATCH("/update-or-create-pt/:d", ptcenter.UpdateOrCreatePT)
		authorized.DELETE("/delete-pt/:id", ptcenter.DeletePT)
		authorized.DELETE("/delete-pt-day/:id", ptcenter.DeleteAllPTRecordsByDate)
		authorized.GET("/get-beforeafter-pt", ptcenter.GetBeforeAfterPT)

		//tcod
		authorized.POST("/create-tcod", tcodcenter.CreateTCOD)
		authorized.GET("/get-first-tcod", tcodcenter.GetfirstTCOD)
		authorized.GET("/list-tcod", tcodcenter.ListTCOD)
		authorized.GET("/get-tcod/:id", tcodcenter.GetTCODbyID)
		authorized.GET("/get-tcod-table", tcodcenter.GetTCODTABLE)
		authorized.PATCH("/update-or-create-tcod/:d", tcodcenter.UpdateOrCreateTCOD)
		authorized.DELETE("/delete-tcod/:id", tcodcenter.DeleteTCOD)
		authorized.DELETE("/delete-tcod-day/:id", tcodcenter.DeleteAllTCODRecordsByDate)
		authorized.GET("/get-beforeafter-tcod", tcodcenter.GetBeforeAfterTCOD)

		//th
		authorized.POST("/create-th", thcenter.CreateTH)
		authorized.GET("/get-first-th", thcenter.GetfirstTH)
		authorized.GET("/list-th", thcenter.ListTH)
		authorized.GET("/get-th/:id", thcenter.GetTHbyID)
		authorized.GET("/get-th-table", thcenter.GetTHTABLE)
		authorized.PATCH("/update-or-create-th/:d", thcenter.UpdateOrCreateTH)
		authorized.DELETE("/delete-th/:id", thcenter.DeleteTH)
		authorized.DELETE("/delete-th-day/:id", thcenter.DeleteAllTHRecordsByDate)
		authorized.GET("/get-beforeafter-th", thcenter.GetBeforeAfterTH)

		//ttcb
		authorized.POST("/create-ttcb", ttcbcenter.CreateTTCB)
		authorized.GET("/get-first-ttcb", ttcbcenter.GetfirstTTCB)
		authorized.GET("/list-ttcb", ttcbcenter.ListTTCB)
		authorized.GET("/get-ttcb/:id", ttcbcenter.GetTTCBbyID)
		authorized.GET("/get-ttcb-table", ttcbcenter.GetTTCBTABLE)
		authorized.PATCH("/update-or-create-ttcb/:d", ttcbcenter.UpdateOrCreateTTCB)
		authorized.DELETE("/delete-ttcb/:id", ttcbcenter.DeleteTTCB)
		authorized.DELETE("/delete-ttcb-day/:id", ttcbcenter.DeleteAllTTCBRecordsByDate)
		authorized.GET("/get-beforeafter-ttcb", ttcbcenter.GetBeforeAfterTTCB)

		//Garbage
		//HazardousWaste
		authorized.POST("/create-hazardous", hazardousWaste.CreateHazardous)
		authorized.GET("/get-first-hazardous", hazardousWaste.GetfirstHazardous)
		authorized.GET("/list-hazardous", hazardousWaste.ListHazardous)
		authorized.GET("/get-hazardous/:id", hazardousWaste.GetHazardousbyID)
		authorized.GET("/get-hazardous-table", hazardousWaste.GetHazardousTABLE)
		authorized.GET("/get-last-day-hazardous", hazardousWaste.GetLastDayHazardous)
		authorized.PATCH("/update-or-create-hazardous/:d", hazardousWaste.UpdateOrCreateHazardous)
		authorized.DELETE("/delete-hazardous-day/:id", hazardousWaste.DeleteAllHazardousRecordsByDate)
		//ใช้ร่วมกัน
		authorized.GET("/check-target", hazardousWaste.CheckTarget)

		//GeneralWaste
		authorized.POST("/create-general", generalWaste.CreateGeneral)
		authorized.GET("/get-first-general", generalWaste.GetfirstGeneral)
		authorized.GET("/list-general", generalWaste.ListGeneral)
		authorized.GET("/get-general/:id", generalWaste.GetGeneralbyID)
		authorized.GET("/get-general-table", generalWaste.GetGeneralTABLE)
		authorized.GET("/get-last-day-general", generalWaste.GetLastDayGeneral)
		authorized.PATCH("/update-or-create-general/:d", generalWaste.UpdateOrCreateGeneral)
		authorized.DELETE("/delete-general-day/:id", generalWaste.DeleteAllGeneralRecordsByDate)

		//ChemicalWaste
		authorized.POST("/create-chemical", chemicalWaste.CreateChemical)
		authorized.GET("/get-first-chemical", chemicalWaste.GetfirstChemical)
		authorized.GET("/list-chemical", chemicalWaste.ListChemical)
		authorized.GET("/get-chemical/:id", chemicalWaste.GetChemicalbyID)
		authorized.GET("/get-chemical-table", chemicalWaste.GetChemicalTABLE)
		authorized.GET("/get-last-day-chemical", chemicalWaste.GetLastDayChemical)
		authorized.PATCH("/update-or-create-chemical/:d", chemicalWaste.UpdateOrCreateChemical)
		authorized.DELETE("/delete-chemical-day/:id", chemicalWaste.DeleteAllChemicalRecordsByDate)

		//infectiousWaste
		authorized.POST("/create-infectious", infectiousWaste.CreateInfectious)
		authorized.GET("/get-first-infectious", infectiousWaste.GetfirstInfectious)
		authorized.GET("/list-infectious", infectiousWaste.ListInfectious)
		authorized.GET("/get-infectious/:id", infectiousWaste.GetInfectiousbyID)
		authorized.GET("/get-infectious-table", infectiousWaste.GetInfectiousTABLE)
		authorized.GET("/get-last-day-infectious", infectiousWaste.GetLastDayInfectious)
		authorized.PATCH("/update-or-create-infectious/:d", infectiousWaste.UpdateOrCreateInfectious)
		authorized.DELETE("/delete-infectious-day/:id", infectiousWaste.DeleteAllInfectiousRecordsByDate)

		//RecycledWaste
		authorized.POST("/create-recycled", recycledWaste.CreateRecycled)
		authorized.GET("/get-first-recycled", recycledWaste.GetfirstRecycled)
		authorized.GET("/list-recycled", recycledWaste.ListRecycled)
		authorized.GET("/get-recycled/:id", recycledWaste.GetRecycledbyID)
		authorized.GET("/get-recycled-table", recycledWaste.GetRecycledTABLE)
		authorized.GET("/get-last-day-recycled", recycledWaste.GetLastDayRecycled)
		authorized.PATCH("/update-or-create-recycled/:d", recycledWaste.UpdateOrCreateRecycled)
		authorized.DELETE("/delete-recycled-day/:id", recycledWaste.DeleteAllRecycledRecordsByDate)

		//SelectBoxAll
		authorized.GET("/list-BeforeAfterTreatment", selectBoxAll.ListBeforeAfterTreatment)
		authorized.GET("/list-unit", selectBoxAll.ListUnit)
		authorized.GET("/api/positions", position.GetPositions)

		authorized.GET("/list-standard", selectBoxAll.ListStandard) //เก่า

		//น้ำ
		authorized.GET("/list-standard-middle", selectBoxAll.ListMiddleStandard)
		authorized.GET("/list-standard-range", selectBoxAll.ListRangeStandard)
		authorized.POST("/add-middle-standard", selectBoxAll.AddMiddleStandard)
		authorized.POST("/add-range-standard", selectBoxAll.AddRangeStandard)

		//ขยะ
		//hazardousWaste
		authorized.GET("/list-target-middle", selectBoxAll.ListMiddleTarget)
		authorized.GET("/list-target-range", selectBoxAll.ListRangeTarget)
		authorized.POST("/add-middle-target", selectBoxAll.AddMiddleTarget)
		authorized.POST("/add-range-target", selectBoxAll.AddRangeTarget)

		authorized.GET("/list-status", selectBoxAll.ListStatus)
		authorized.GET("/list-status-garbage", selectBoxAll.ListStatusGarbage)
	}

	public := r.Group("")
	{
		public.POST("/api/predict", predict.Predict)

		public.GET("/api/employees", employee.GetEmployees)
		public.POST("/api/employees", employee.CreateEmployee)

	}

	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// r.Run("localhost:" + PORT)
	r.Run("0.0.0.0:" + PORT)

}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// func CORSMiddleware() gin.HandlerFunc {
//     return func(c *gin.Context) {
//         c.Writer.Header().Set("Access-Control-Allow-Origin", "https://hospital-project-rose.vercel.app")
//         c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
//         c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
//         c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

//         if c.Request.Method == "OPTIONS" {
//             c.AbortWithStatus(204)
//             return
//         }

//         c.Next()
//     }
// }
