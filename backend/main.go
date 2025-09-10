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
		authorized.GET("/users", user.ListUsers)                            //
		authorized.GET("/user-data/:EmployeeID", user.GetDataByUserID)      //
		authorized.PATCH("/employees/:EmployeeID", user.UpdateEmployeeByID) //
		authorized.GET("/roles", employee.ListRole)                         //

		//Room
		authorized.GET("/rooms", room.ListRoom)                    //
		authorized.POST("/create-rooms", room.CreateRoom)          //
		authorized.PATCH("/update-room/:id", room.UpdateRoom)      //
		authorized.DELETE("/delete-room/:id", room.DeleteRoomById) //

		//Hardware
		authorized.GET("/hardwares", hardware.ListHardware)                                               //
		authorized.GET("/hardware-colors", hardware.ListColors)                                           //
		authorized.GET("/hardware-parameter/by-hardware/:id", hardware.ListHardwareParameterByHardwareID) //
		authorized.PATCH("/update-hardware-parameter/:id", hardware.UpdateHardwareParameterByID)          //
		authorized.GET("/hardware-parameter-ids", hardware.GetHardwareParametersWithGraph)                //
		authorized.PATCH("/hardware-parameters/:id/icon", hardware.UpdateIconByHardwareParameterID)       //
		authorized.PUT("/hardware-parameter/:id/group-display", hardware.UpdateGroupDisplayByID)          //
		authorized.PATCH("/sensor-data-parameter/:id/note", hardware.CreateNoteBySensorDataParameterID) //
		authorized.PATCH("/hardware-parameters/:id/layout-display", hardware.UpdateLayoutDisplayByID)       //
		authorized.PATCH("/update-hardware-parameter-color/:id", hardware.UpdateHardwareParameterColorByID) //
		authorized.POST("/employees/:id/check-password", hardware.CheckPasswordByID)                        //
		authorized.GET("/report-hardware", report.ListReportHardware)

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
		authorized.GET("/sensor-data-parameters/:id", sensordata.GetSensorDataParametersBySensorDataID)//
		authorized.GET("/sensor-data-by-hardware/:id", sensordata.GetSensorDataIDByHardwareID) //
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
	}

	public := r.Group("")
	{
		public.POST("/api/predict", predict.Predict)
		// public.GET("/uploads/*filename", user.ServeImage)

		//PH
		public.POST("/create-ph", phcenter.CreatePH)
		public.GET("/get-first-ph", phcenter.GetfirstPH)
		public.GET("/list-ph", phcenter.ListPH)
		public.GET("/get-ph/:id", phcenter.GetPHbyID)
		public.GET("/get-ph-table", phcenter.GetPHTABLE)
		public.PATCH("/update-or-create-ph/:d", phcenter.UpdateOrCreatePH)
		public.DELETE("/delete-ph/:id", phcenter.DeletePH)
		public.DELETE("/delete-ph-day/:id", phcenter.DeleteAllPHRecordsByDate)
		public.GET("/get-beforeafter-ph", phcenter.GetBeforeAfterPH)

		//TDS
		public.POST("/create-tds", tdscenter.CreateTDS)
		public.GET("/get-first-tds", tdscenter.GetfirstTDS)
		public.GET("/list-tds", tdscenter.ListTDS)
		public.GET("/get-tds/:id", tdscenter.GetTDSbyID)
		public.GET("/get-tds-table", tdscenter.GetTDSTABLE)
		public.PATCH("/update-or-create-tds/:d", tdscenter.UpdateOrCreateTDS)
		public.DELETE("/delete-tds/:id", tdscenter.DeleteTDS)
		public.DELETE("/delete-tds-day/:id", tdscenter.DeleteAllTDSRecordsByDate)
		public.GET("/get-beforeafter-tds", tdscenter.GetBeforeAfterTDS)

		public.GET("/check-units", tdscenter.CheckUnit)
		public.GET("/check-standard", tdscenter.CheckStandard)
		public.GET("/get-alert-software", tdscenter.GetAlertSoftware)

		//TKN
		public.POST("/create-tkn", tkncenter.CreateTKN)
		public.GET("/get-first-tkn", tkncenter.GetfirstTKN)
		public.GET("/list-tkn", tkncenter.ListTKN)
		public.GET("/get-tkn/:id", tkncenter.GetTKNbyID)
		public.GET("/get-tkn-table", tkncenter.GetTKNTABLE)
		public.PATCH("/update-or-create-tkn/:d", tkncenter.UpdateOrCreateTKN)
		public.DELETE("/delete-tkn/:id", tkncenter.DeleteTKN)
		public.DELETE("/delete-tkn-day/:id", tkncenter.DeleteAllTKNRecordsByDate)
		public.GET("/get-beforeafter-tkn", tkncenter.GetBeforeAfterTKN)

		//TS
		public.POST("/create-ts", tscenter.CreateTS)
		public.GET("/get-first-ts", tscenter.GetfirstTS)
		public.GET("/list-ts", tscenter.ListTS)
		public.GET("/get-ts/:id", tscenter.GetTSbyID)
		public.GET("/get-ts-table", tscenter.GetTSTABLE)
		public.PATCH("/update-or-create-ts/:d", tscenter.UpdateOrCreateTS)
		public.DELETE("/delete-ts/:id", tscenter.DeleteTS)
		public.DELETE("/delete-ts-day/:id", tscenter.DeleteAllTSRecordsByDate)
		public.GET("/get-beforeafter-ts", tscenter.GetBeforeAfterTS)

		//COD
		public.POST("/create-cod", codcenter.CreateCOD)
		public.GET("/get-first-cod", codcenter.GetfirstCOD)
		public.GET("/list-cod", codcenter.ListCOD)
		public.GET("/get-cod/:id", codcenter.GetCODbyID)
		public.GET("/get-cod-table", codcenter.GetCODTABLE)
		public.PATCH("/update-or-create-cod/:d", codcenter.UpdateOrCreateCOD)
		public.DELETE("/delete-cod/:id", codcenter.DeleteCOD)
		public.DELETE("/delete-cod-day/:id", codcenter.DeleteAllCODRecordsByDate)
		public.GET("/get-beforeafter-cod", codcenter.GetBeforeAfterCOD)

		//FCB
		public.POST("/create-fcb", fcbcenter.CreateFCB)
		public.GET("/get-first-fcb", fcbcenter.GetfirstFCB)
		public.GET("/list-fcb", fcbcenter.ListFCB)
		public.GET("/get-fcb/:id", fcbcenter.GetFCBbyID)
		public.GET("/get-fcb-table", fcbcenter.GetFCBTABLE)
		public.PATCH("/update-or-create-fcb/:d", fcbcenter.UpdateOrCreateFCB)
		public.DELETE("/delete-fcb/:id", fcbcenter.DeleteFCB)
		public.DELETE("/delete-fcb-day/:id", fcbcenter.DeleteAllFCBRecordsByDate)
		public.GET("/get-beforeafter-fcb", fcbcenter.GetBeforeAfterFCB)

		//RES
		public.POST("/create-res", rescenter.CreateRES)
		public.GET("/get-first-res", rescenter.GetfirstRES)
		public.GET("/list-res", rescenter.ListRES)
		public.GET("/get-res/:id", rescenter.GetRESbyID)
		public.GET("/get-res-table", rescenter.GetRESTABLE)
		public.PATCH("/update-or-create-res/:d", rescenter.UpdateOrCreateRES)
		public.DELETE("/delete-res/:id", rescenter.DeleteRES)
		public.DELETE("/delete-res-day/:id", rescenter.DeleteAllRESRecordsByDate)
		public.GET("/get-beforeafter-res", rescenter.GetBeforeAfterRES)

		//SUL
		public.POST("/create-sul", sulcenter.CreateSUL)
		public.GET("/get-first-sul", sulcenter.GetfirstSUL)
		public.GET("/list-sul", sulcenter.ListSUL)
		public.GET("/get-sul/:id", sulcenter.GetSULbyID)
		public.GET("/get-sul-table", sulcenter.GetSULTABLE)
		public.PATCH("/update-or-create-sul/:d", sulcenter.UpdateOrCreateSUL)
		public.DELETE("/delete-sul/:id", sulcenter.DeleteSUL)
		public.DELETE("/delete-sul-day/:id", sulcenter.DeleteAllSULRecordsByDate)
		public.GET("/get-beforeafter-sul", sulcenter.GetBeforeAfterSUL)

		//TCB
		public.POST("/create-tcb", tcbcenter.CreateTCB)
		public.GET("/get-first-tcb", tcbcenter.GetfirstTCB)
		public.GET("/list-tcb", tcbcenter.ListTCB)
		public.GET("/get-tcb/:id", tcbcenter.GetTCBbyID)
		public.GET("/get-tcb-table", tcbcenter.GetTCBTABLE)
		public.PATCH("/update-or-create-tcb/:d", tcbcenter.UpdateOrCreateTCB)
		public.DELETE("/delete-tcb/:id", tcbcenter.DeleteTCB)
		public.DELETE("/delete-tcb-day/:id", tcbcenter.DeleteAllTCBRecordsByDate)
		public.GET("/get-beforeafter-tcb", tcbcenter.GetBeforeAfterTCB)

		//BOD
		public.POST("/create-bod", bodcenter.CreateBod)
		public.GET("/get-first-bod", bodcenter.GetfirstBOD)
		public.GET("/list-bod", bodcenter.ListBOD)
		public.GET("/get-bod/:id", bodcenter.GetBODbyID)
		public.GET("/get-bod-table", bodcenter.GetBODTABLE)
		public.PATCH("/update-or-create-bod/:d", bodcenter.UpdateOrCreateBOD)
		public.DELETE("/delete-bod/:id", bodcenter.DeleteBOD)
		public.DELETE("/delete-bod-day/:id", bodcenter.DeleteAllBODRecordsByDate)
		public.GET("/get-beforeafter-bod", bodcenter.GetBeforeAfterBOD) //เพิ่ม

		//FOG
		public.POST("/create-fog", fogcenter.CreateFOG)
		public.GET("/get-first-fog", fogcenter.GetfirstFOG)
		public.GET("/list-fog", fogcenter.ListFOG)
		public.GET("/get-fog/:id", fogcenter.GetFOGbyID)
		public.GET("/get-fog-table", fogcenter.GetFOGTABLE)
		public.PATCH("/update-or-create-fog/:d", fogcenter.UpdateOrCreateFOG)
		public.DELETE("/delete-fog/:id", fogcenter.DeleteFOG)
		public.DELETE("/delete-fog-day/:id", fogcenter.DeleteAllFOGRecordsByDate)
		public.GET("/get-beforeafter-fog", fogcenter.GetBeforeAfterFOG)

		//drinkwater
		//ecoin(glass)
		public.POST("/create-eco", ecocenter.CreateECO)
		public.GET("/get-first-eco", ecocenter.GetfirstECO)
		public.GET("/list-eco", ecocenter.ListECO)
		public.GET("/get-eco/:id", ecocenter.GetECObyID)
		public.GET("/get-eco-table", ecocenter.GetECOTABLE)
		public.PATCH("/update-or-create-eco/:d", ecocenter.UpdateOrCreateECO)
		public.DELETE("/delete-eco/:id", ecocenter.DeleteECO)
		public.DELETE("/delete-eco-day/:id", ecocenter.DeleteAllECORecordsByDate)
		public.GET("/get-beforeafter-eco", ecocenter.GetBeforeAfterECO)

		//DFCB(glass)
		public.POST("/create-dfcb", dfcbcenter.CreateDFCB)
		public.GET("/get-first-dfcb", dfcbcenter.GetfirstDFCB)
		public.GET("/list-dfcb", dfcbcenter.ListDFCB)
		public.GET("/get-dfcb/:id", dfcbcenter.GetDFCBbyID)
		public.GET("/get-dfcb-table", dfcbcenter.GetDFCBTABLE)
		public.PATCH("/update-or-create-dfcb/:d", dfcbcenter.UpdateOrCreateDFCB)
		public.DELETE("/delete-dfcb/:id", dfcbcenter.DeleteDFCB)
		public.DELETE("/delete-dfcb-day/:id", dfcbcenter.DeleteAllDFCBRecordsByDate)
		public.GET("/get-beforeafter-dfcb", dfcbcenter.GetBeforeAfterDFCB)

		//DTCB(glass)
		public.POST("/create-dtcb", dtcbcenter.CreateDTCB)
		public.GET("/get-first-dtcb", dtcbcenter.GetfirstDTCB)
		public.GET("/list-dtcb", dtcbcenter.ListDTCB)
		public.GET("/get-dtcb/:id", dtcbcenter.GetDTCBbyID)
		public.GET("/get-dtcb-table", dtcbcenter.GetDTCBTABLE)
		public.PATCH("/update-or-create-dtcb/:d", dtcbcenter.UpdateOrCreateDTCB)
		public.DELETE("/delete-dtcb/:id", dtcbcenter.DeleteDTCB)
		public.DELETE("/delete-dtcb-day/:id", dtcbcenter.DeleteAllDTCBRecordsByDate)
		public.GET("/get-beforeafter-dtcb", dtcbcenter.GetBeforeAfterDTCB)

		//ecoin(tank)
		public.POST("/create-eco-tank", ecocenterT.CreateECOtank)
		public.GET("/get-first-eco-tank", ecocenterT.GetfirstECOtank)
		public.GET("/list-eco-tank", ecocenterT.ListECOtank)
		public.GET("/get-eco-tank/:id", ecocenterT.GetECOtankbyID)
		public.GET("/get-eco-tank-table", ecocenterT.GetECOtankTABLE)
		public.PATCH("/update-or-create-eco-tank/:d", ecocenterT.UpdateOrCreateECOtank)
		public.DELETE("/delete-eco-tank/:id", ecocenterT.DeleteECOtank)
		public.DELETE("/delete-eco-tank-day/:id", ecocenterT.DeleteAllECOtankRecordsByDate)
		public.GET("/get-beforeafter-eco-tank", ecocenterT.GetBeforeAfterECOtank)

		//DFCB(tank)
		public.POST("/create-dfcb-tank", dfcbcenterT.CreateDFCBtank)
		public.GET("/get-first-dfcb-tank", dfcbcenterT.GetfirstDFCBtank)
		public.GET("/list-dfcb-tank", dfcbcenterT.ListDFCBtank)
		public.GET("/get-dfcb-tank/:id", dfcbcenterT.GetDFCBtankbyID)
		public.GET("/get-dfcb-tank-table", dfcbcenterT.GetDFCBtankTABLE)
		public.PATCH("/update-or-create-dfcb-tank/:d", dfcbcenterT.UpdateOrCreateDFCBtank)
		public.DELETE("/delete-dfcb-tank/:id", dfcbcenterT.DeleteDFCBtank)
		public.DELETE("/delete-dfcb-tank-day/:id", dfcbcenterT.DeleteAllDFCBtankRecordsByDate)
		public.GET("/get-beforeafter-dfcb-tank", dfcbcenterT.GetBeforeAfterDFCBtank)

		//DTCB(tank)
		public.POST("/create-dtcb-tank", dtcbcenterT.CreateDTCBtank)
		public.GET("/get-first-dtcb-tank", dtcbcenterT.GetfirstDTCBtank)
		public.GET("/list-dtcb-tank", dtcbcenterT.ListDTCBtank)
		public.GET("/get-dtcb-tank/:id", dtcbcenterT.GetDTCBtankbyID)
		public.GET("/get-dtcb-tank-table", dtcbcenterT.GetDTCBtankTABLE)
		public.PATCH("/update-or-create-dtcb-tank/:d", dtcbcenterT.UpdateOrCreateDTCBtank)
		public.DELETE("/delete-dtcb-tank/:id", dtcbcenterT.DeleteDTCBtank)
		public.DELETE("/delete-dtcb-tank-day/:id", dtcbcenterT.DeleteAllDTCBtankRecordsByDate)
		public.GET("/get-beforeafter-dtcb-tank", dtcbcenterT.GetBeforeAfterDTCBtank)

		//tapwater
		//al
		public.POST("/create-al", alcenter.CreateAL)
		public.GET("/get-first-al", alcenter.GetfirstAL)
		public.GET("/list-al", alcenter.ListAL)
		public.GET("/get-al/:id", alcenter.GetALbyID)
		public.GET("/get-al-table", alcenter.GetALTABLE)
		public.PATCH("/update-or-create-al/:d", alcenter.UpdateOrCreateAL)
		public.DELETE("/delete-al/:id", alcenter.DeleteAL)
		public.DELETE("/delete-al-day/:id", alcenter.DeleteAllALRecordsByDate)
		public.GET("/get-beforeafter-al", alcenter.GetBeforeAfterAL)

		//iron
		public.POST("/create-iron", ironcenter.CreateIRON)
		public.GET("/get-first-iron", ironcenter.GetfirstIRON)
		public.GET("/list-iron", ironcenter.ListIRON)
		public.GET("/get-iron/:id", ironcenter.GetIRONbyID)
		public.GET("/get-iron-table", ironcenter.GetIRONTABLE)
		public.PATCH("/update-or-create-iron/:d", ironcenter.UpdateOrCreateIRON)
		public.DELETE("/delete-iron/:id", ironcenter.DeleteIRON)
		public.DELETE("/delete-iron-day/:id", ironcenter.DeleteAllIRONRecordsByDate)
		public.GET("/get-beforeafter-iron", ironcenter.GetBeforeAfterIRON)

		//mn
		public.POST("/create-mn", mncenter.CreateMN)
		public.GET("/get-first-mn", mncenter.GetfirstMN)
		public.GET("/list-mn", mncenter.ListMN)
		public.GET("/get-mn/:id", mncenter.GetMNbyID)
		public.GET("/get-mn-table", mncenter.GetMNTABLE)
		public.PATCH("/update-or-create-mn/:d", mncenter.UpdateOrCreateMN)
		public.DELETE("/delete-mn/:id", mncenter.DeleteMN)
		public.DELETE("/delete-mn-day/:id", mncenter.DeleteAllMNRecordsByDate)
		public.GET("/get-beforeafter-mn", mncenter.GetBeforeAfterMN)

		//ni
		public.POST("/create-ni", nicenter.CreateNI)
		public.GET("/get-first-ni", nicenter.GetfirstNI)
		public.GET("/list-ni", nicenter.ListNI)
		public.GET("/get-ni/:id", nicenter.GetNIbyID)
		public.GET("/get-ni-table", nicenter.GetNITABLE)
		public.PATCH("/update-or-create-ni/:d", nicenter.UpdateOrCreateNI)
		public.DELETE("/delete-ni/:id", nicenter.DeleteNI)
		public.DELETE("/delete-ni-day/:id", nicenter.DeleteAllNIRecordsByDate)
		public.GET("/get-beforeafter-ni", nicenter.GetBeforeAfterNI)

		//ntu
		public.POST("/create-ntu", ntucenter.CreateNTU)
		public.GET("/get-first-ntu", ntucenter.GetfirstNTU)
		public.GET("/list-ntu", ntucenter.ListNTU)
		public.GET("/get-ntu/:id", ntucenter.GetNTUbyID)
		public.GET("/get-ntu-table", ntucenter.GetNTUTABLE)
		public.PATCH("/update-or-create-ntu/:d", ntucenter.UpdateOrCreateNTU)
		public.DELETE("/delete-ntu/:id", ntucenter.DeleteNTU)
		public.DELETE("/delete-ntu-day/:id", ntucenter.DeleteAllNTURecordsByDate)
		public.GET("/get-beforeafter-ntu", ntucenter.GetBeforeAfterNTU)

		//pt
		public.POST("/create-pt", ptcenter.CreatePT)
		public.GET("/get-first-pt", ptcenter.GetfirstPT)
		public.GET("/list-pt", ptcenter.ListPT)
		public.GET("/get-pt/:id", ptcenter.GetPTbyID)
		public.GET("/get-pt-table", ptcenter.GetPTTABLE)
		public.PATCH("/update-or-create-pt/:d", ptcenter.UpdateOrCreatePT)
		public.DELETE("/delete-pt/:id", ptcenter.DeletePT)
		public.DELETE("/delete-pt-day/:id", ptcenter.DeleteAllPTRecordsByDate)
		public.GET("/get-beforeafter-pt", ptcenter.GetBeforeAfterPT)

		//tcod
		public.POST("/create-tcod", tcodcenter.CreateTCOD)
		public.GET("/get-first-tcod", tcodcenter.GetfirstTCOD)
		public.GET("/list-tcod", tcodcenter.ListTCOD)
		public.GET("/get-tcod/:id", tcodcenter.GetTCODbyID)
		public.GET("/get-tcod-table", tcodcenter.GetTCODTABLE)
		public.PATCH("/update-or-create-tcod/:d", tcodcenter.UpdateOrCreateTCOD)
		public.DELETE("/delete-tcod/:id", tcodcenter.DeleteTCOD)
		public.DELETE("/delete-tcod-day/:id", tcodcenter.DeleteAllTCODRecordsByDate)
		public.GET("/get-beforeafter-tcod", tcodcenter.GetBeforeAfterTCOD)

		//th
		public.POST("/create-th", thcenter.CreateTH)
		public.GET("/get-first-th", thcenter.GetfirstTH)
		public.GET("/list-th", thcenter.ListTH)
		public.GET("/get-th/:id", thcenter.GetTHbyID)
		public.GET("/get-th-table", thcenter.GetTHTABLE)
		public.PATCH("/update-or-create-th/:d", thcenter.UpdateOrCreateTH)
		public.DELETE("/delete-th/:id", thcenter.DeleteTH)
		public.DELETE("/delete-th-day/:id", thcenter.DeleteAllTHRecordsByDate)
		public.GET("/get-beforeafter-th", thcenter.GetBeforeAfterTH)

		//ttcb
		public.POST("/create-ttcb", ttcbcenter.CreateTTCB)
		public.GET("/get-first-ttcb", ttcbcenter.GetfirstTTCB)
		public.GET("/list-ttcb", ttcbcenter.ListTTCB)
		public.GET("/get-ttcb/:id", ttcbcenter.GetTTCBbyID)
		public.GET("/get-ttcb-table", ttcbcenter.GetTTCBTABLE)
		public.PATCH("/update-or-create-ttcb/:d", ttcbcenter.UpdateOrCreateTTCB)
		public.DELETE("/delete-ttcb/:id", ttcbcenter.DeleteTTCB)
		public.DELETE("/delete-ttcb-day/:id", ttcbcenter.DeleteAllTTCBRecordsByDate)
		public.GET("/get-beforeafter-ttcb", ttcbcenter.GetBeforeAfterTTCB)

		//Garbage
		//HazardousWaste
		public.POST("/create-hazardous", hazardousWaste.CreateHazardous)
		public.GET("/get-first-hazardous", hazardousWaste.GetfirstHazardous)
		public.GET("/list-hazardous", hazardousWaste.ListHazardous)
		public.GET("/get-hazardous/:id", hazardousWaste.GetHazardousbyID)
		public.GET("/get-hazardous-table", hazardousWaste.GetHazardousTABLE)
		public.GET("/get-last-day-hazardous", hazardousWaste.GetLastDayHazardous)
		public.PATCH("/update-or-create-hazardous/:d", hazardousWaste.UpdateOrCreateHazardous)
		public.DELETE("/delete-hazardous-day/:id", hazardousWaste.DeleteAllHazardousRecordsByDate)
		//ใช้ร่วมกัน
		public.GET("/check-target", hazardousWaste.CheckTarget)

		//GeneralWaste
		public.POST("/create-general", generalWaste.CreateGeneral)
		public.GET("/get-first-general", generalWaste.GetfirstGeneral)
		public.GET("/list-general", generalWaste.ListGeneral)
		public.GET("/get-general/:id", generalWaste.GetGeneralbyID)
		public.GET("/get-general-table", generalWaste.GetGeneralTABLE)
		public.GET("/get-last-day-general", generalWaste.GetLastDayGeneral)
		public.PATCH("/update-or-create-general/:d", generalWaste.UpdateOrCreateGeneral)
		public.DELETE("/delete-general-day/:id", generalWaste.DeleteAllGeneralRecordsByDate)

		//ChemicalWaste
		public.POST("/create-chemical", chemicalWaste.CreateChemical)
		public.GET("/get-first-chemical", chemicalWaste.GetfirstChemical)
		public.GET("/list-chemical", chemicalWaste.ListChemical)
		public.GET("/get-chemical/:id", chemicalWaste.GetChemicalbyID)
		public.GET("/get-chemical-table", chemicalWaste.GetChemicalTABLE)
		public.GET("/get-last-day-chemical", chemicalWaste.GetLastDayChemical)
		public.PATCH("/update-or-create-chemical/:d", chemicalWaste.UpdateOrCreateChemical)
		public.DELETE("/delete-chemical-day/:id", chemicalWaste.DeleteAllChemicalRecordsByDate)

		//infectiousWaste
		public.POST("/create-infectious", infectiousWaste.CreateInfectious)
		public.GET("/get-first-infectious", infectiousWaste.GetfirstInfectious)
		public.GET("/list-infectious", infectiousWaste.ListInfectious)
		public.GET("/get-infectious/:id", infectiousWaste.GetInfectiousbyID)
		public.GET("/get-infectious-table", infectiousWaste.GetInfectiousTABLE)
		public.GET("/get-last-day-infectious", infectiousWaste.GetLastDayInfectious)
		public.PATCH("/update-or-create-infectious/:d", infectiousWaste.UpdateOrCreateInfectious)
		public.DELETE("/delete-infectious-day/:id", infectiousWaste.DeleteAllInfectiousRecordsByDate)

		//RecycledWaste
		public.POST("/create-recycled", recycledWaste.CreateRecycled)
		public.GET("/get-first-recycled", recycledWaste.GetfirstRecycled)
		public.GET("/list-recycled", recycledWaste.ListRecycled)
		public.GET("/get-recycled/:id", recycledWaste.GetRecycledbyID)
		public.GET("/get-recycled-table", recycledWaste.GetRecycledTABLE)
		public.GET("/get-last-day-recycled", recycledWaste.GetLastDayRecycled)
		public.PATCH("/update-or-create-recycled/:d", recycledWaste.UpdateOrCreateRecycled)
		public.DELETE("/delete-recycled-day/:id", recycledWaste.DeleteAllRecycledRecordsByDate)

		public.GET("/api/employees", employee.GetEmployees)
		public.POST("/api/employees", employee.CreateEmployee)

		//SelectBoxAll
		public.GET("/list-BeforeAfterTreatment", selectBoxAll.ListBeforeAfterTreatment)
		public.GET("/list-unit", selectBoxAll.ListUnit)
		public.GET("/api/positions", position.GetPositions)

		public.GET("/list-standard", selectBoxAll.ListStandard) //เก่า

		//น้ำ
		public.GET("/list-standard-middle", selectBoxAll.ListMiddleStandard)
		public.GET("/list-standard-range", selectBoxAll.ListRangeStandard)
		public.POST("/add-middle-standard", selectBoxAll.AddMiddleStandard)
		public.POST("/add-range-standard", selectBoxAll.AddRangeStandard)

		//ขยะ
		//hazardousWaste
		public.GET("/list-target-middle", selectBoxAll.ListMiddleTarget)
		public.GET("/list-target-range", selectBoxAll.ListRangeTarget)
		public.POST("/add-middle-target", selectBoxAll.AddMiddleTarget)
		public.POST("/add-range-target", selectBoxAll.AddRangeTarget)

		public.GET("/list-status", selectBoxAll.ListStatus)
		public.GET("/list-status-garbage", selectBoxAll.ListStatusGarbage)

		//public.GET("/api/water-quality", dashboard.GetWaterQuality)
		//public.GET("/dashboard/environmental", dashboard.GetEnvironmentalDashboard)

	}

	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	r.Run("localhost:" + PORT)
	// r.Run("0.0.0.0:" + PORT)

}

// func CORSMiddleware() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
// 		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
// 		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
// 		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

// 		if c.Request.Method == "OPTIONS" {
// 			c.AbortWithStatus(204)
// 			return
// 		}

// 		c.Next()
// 	}
// }

func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "https://hospital-project-rose.vercel.app")
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
