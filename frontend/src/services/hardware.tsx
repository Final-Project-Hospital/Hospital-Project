import axios from "axios";
import { RoomInterface } from "../interface/IRoom"
import { BuildingInterface } from "../interface/IBuilding"
import { HardwareInterface } from "../interface/IHardware"
import { SensorDataParameterInterface } from "../interface/ISensorDataParameter"
import { HardwareGraphInterface } from "../interface/IHardwareGraph"
import { HardwareParameterColorInterface } from "../interface/IHardwareColor"
import { HardwareParameterInterface } from "../interface/IHardwareParameter"
import { NotificationInterface } from "../interface/INotification";
import { RoomNotificationInterface } from "../interface/IRoomNotification";
import { LineMasterInterface } from "../interface/ILineMaster"
import { apiUrl } from "./index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const ListRoom = async (): Promise<RoomInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/rooms`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching room list:", error);
    return null;
  }
};

// services/hardware.ts
export const CreateRoom = async (room: RoomInterface): Promise<RoomInterface | null> => {
  try {
    const payload = {
      RoomName: room.RoomName,
      Floor: Number(room.Floor),
      BuildingID: room.Building?.ID,
      EmployeeID: room.Employee?.ID,
      HardwareID: room.Hardware?.ID,
      Icon: room.Icon,
    };

    const response = await axios.post(`${apiUrl}/create-rooms`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      console.error("Unexpected response status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error creating room:", error);
    return null;
  }
};


export const UpdateRoom = async (
  id: number,
  room: Partial<RoomInterface>
): Promise<RoomInterface | null> => {
  try {
    const payload: any = {};

    if (room.RoomName !== undefined) payload.RoomName = room.RoomName;
    if (room.Floor !== undefined) payload.Floor = Number(room.Floor);
    if (room.Building?.ID !== undefined) payload.BuildingID = room.Building.ID;
    if (room.Employee?.ID !== undefined) payload.EmployeeID = room.Employee.ID;
    if (room.Hardware?.ID !== undefined) payload.HardwareID = room.Hardware.ID;
    if (room.Icon !== undefined) payload.Icon = room.Icon; // ✅ เพิ่มตรงนี้

    const response = await axios.patch(`${apiUrl}/update-room/${id}`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    return response.status === 200 ? response.data : null;
  } catch (error) {
    console.error("Error updating room:", error);
    return null;
  }
};

export const DeleteRoomById = async (id: number): Promise<boolean> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-room/${id}`, {
      headers: {
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return true;
    } else {
      console.error("Unexpected response status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error deleting room:", error);
    return false;
  }
};

export const ListHardware = async (): Promise<HardwareInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/hardwares`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching hardwares:", error);
    return null;
  }
};

export const UpdateHardwareByID = async (
  id: number,
  name: string
): Promise<HardwareInterface | null> => {
  try {
    const response = await axios.put(
      `${apiUrl}/update-hardware/${id}`,
      { name }, 
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error updating hardware:", error);
    return null;
  }
};

export const DeleteHardwareByID = async (
  id: number
): Promise<boolean> => {
  try {
    const response = await axios.delete(
      `${apiUrl}/delete-hardware/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return true;
    } else {
      console.error("Unexpected status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error deleting hardware:", error);
    return false;
  }
};

export const ListBuilding = async (): Promise<BuildingInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/buildings`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching buildings:", error);
    return null;
  }
};

// ✅ Create (map -> snake_case)
export const CreateBuilding = async (
  data: { BuildingName: string; EmployeeID?: number | null }
): Promise<BuildingInterface | null> => {
  const payload: any = {
    building_name: data.BuildingName,
  };
  if (data.EmployeeID !== undefined) payload.employee_id = data.EmployeeID;

  try {
    const response = await axios.post(`${apiUrl}/create-buildings`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200 || response.status === 201) {
      return response.data as BuildingInterface;
    } else {
      console.error("Unexpected status:", response.status, response.data);
      return null;
    }
  } catch (error: any) {
    if (error.response) {
      console.error("Error creating building:", error.response.status, error.response.data);
    } else {
      console.error("Error creating building:", error.message);
    }
    return null;
  }
};

// ✅ Update (partial + map -> snake_case)
export const UpdateBuildingByID = async (
  id: number,
  data: { BuildingName?: string; EmployeeID?: number | null }
): Promise<BuildingInterface | null> => {
  const payload: any = {};
  if (data.BuildingName !== undefined) payload.building_name = data.BuildingName;
  if (data.EmployeeID !== undefined) payload.employee_id = data.EmployeeID;

  try {
    const response = await axios.put(`${apiUrl}/update-buildings/${id}`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data as BuildingInterface;
    } else {
      console.error("Unexpected status:", response.status, response.data);
      return null;
    }
  } catch (error: any) {
    if (error.response) {
      console.error("Error updating building:", error.response.status, error.response.data);
    } else {
      console.error("Error updating building:", error.message);
    }
    return null;
  }
};

// ✅ Delete Building by ID
export const DeleteBuildingByID = async (id: number): Promise<boolean> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-buildings/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return true;
    } else {
      console.error("Unexpected status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error deleting building:", error);
    return false;
  }
};

export const GetSensorDataParametersBySensorDataID = async (
  id: number
): Promise<SensorDataParameterInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/sensor-data-parameters/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching sensor data parameters:", error);
    return null;
  }
};

export const DeleteSensorDataParametersByIds = async (
  ids: number[]
): Promise<{ message: string; deleted_ids: number[] } | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/sensor-data-parameters`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      data: { ids }, // ✅ ต้องส่ง data ผ่าน option เพราะ axios.delete ไม่รับ body โดยตรง
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error deleting sensor data parameters:", error);
    return null;
  }
};

export interface DeleteAllSensorDataParamsResponse {
  message: string;
  sensor_data_id: number;
}

export const DeleteAllSensorDataParametersBySensorDataID = async (
  sensorDataID: number
): Promise<DeleteAllSensorDataParamsResponse | null> => {
  try {
    const response = await axios.delete(
      `${apiUrl}/sensor-data-parameters/all/${sensorDataID}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return response.data as DeleteAllSensorDataParamsResponse;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error deleting all sensor data parameters by SensorDataID:", error);
    return null;
  }
};
export const CreateNoteBySensorDataParameterID = async (
  id: number,
  note: string | null | undefined
): Promise<boolean> => {
  try {
    const response = await axios.patch(
      `${apiUrl}/sensor-data-parameter/${id}/note`,
      { note: note ?? "" }, 
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error("Error creating note:", error);
    return false;
  }
};
export const ListDataHardwareParameterByParameter = async (
  parameter: string
): Promise<HardwareParameterInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/hardware-parameters-by-parameter`, {
      params: { parameter },
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching hardware parameters by parameter:", error);
    return null;
  }
};

export const GetSensorDataByHardwareID = async (
  id: number
): Promise<any[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/sensor-data-by-hardware/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching sensor data by hardware ID:", error);
    return null;
  }
};

export const ListDataGraph = async (): Promise<HardwareGraphInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/hardware-graphs`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching hardware graphs:", error);
    return null;
  }
};

export const ListHardwareColors = async (): Promise<HardwareParameterColorInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/hardware-colors`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching hardware colors:", error);
    return null;
  }
};

export const UpdateIconByHardwareParameterID = async (
  id: number,
  icon: string,
  alert: boolean
): Promise<boolean> => {
  try {
    const response = await axios.patch(
      `${apiUrl}/hardware-parameters/${id}/icon`,
      { icon, alert }, // ✅ ส่ง icon + alert พร้อมกัน
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return true;
    } else {
      console.error("Unexpected status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error updating hardware parameter:", error);
    return false;
  }
};


// ฟังก์ชันสำหรับอัปเดต HardwareParameter
export const UpdateHardwareParameterByID = async (
  id: number,
  payload: {
    parameter?: string;
    hardware_graph_id?: number;
    hardware_parameter_color_id?: number;
  }
): Promise<HardwareParameterInterface | null> => {
  try {
    const response = await axios.patch(
      `${apiUrl}/update-hardware-parameter/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error updating hardware parameter:", error);
    return null;
  }
};

export const ListHardwareParameterByHardwareID = async (
  hardwareID: number
): Promise<HardwareParameterInterface[] | null> => {
  try {
    const response = await axios.get(
      `${apiUrl}/hardware-parameter/by-hardware/${hardwareID}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );
    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching hardware parameters by hardwareID:", error);
    return null;
  }
};
export interface HardwareStandardInterface {
  ID?: number;
  MaxValueStandard?: number;
  MinValueStandard?: number;
}

export const UpdateStandardHardwareByID = async (
  id: number,
  data: HardwareStandardInterface
): Promise<any | null> => {
  try {
    const response = await axios.put(`${apiUrl}/update-standard-hardware/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error updating standard hardware:", error);
    return null;
  }
};

export type UpdateUnitHardwarePayload = {
  unit: string;          
  employee_id?: number;  
};


export const UpdateUnitHardwareByID = async (
  id: number,
  data: UpdateUnitHardwarePayload | { Unit: string; employee_id?: number }
): Promise<any | null> => {
  try {
    // map key ให้ตรงกับ backend (unit เป็นตัวพิมพ์เล็ก)
    const payload: UpdateUnitHardwarePayload = {
      unit: (data as any).unit ?? (data as any).Unit,
      employee_id: (data as any).employee_id,
    };

    const response = await axios.put(
      `${apiUrl}/update-unit-hardware/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error updating unit hardware:", error);
    return null;
  }
};

export interface HardwareParameterIDResponse {
  hardware_id: string;
  parameters: {
    id: number;
    parameter: string;
    graph_id: number;
    graph: string;
  }[];
}

export const ListHardwareParameterIDsByHardwareID = async (
  hardwareID: number
): Promise<HardwareParameterIDResponse | null> => {
  try {
    const response = await axios.get(`${apiUrl}/hardware-parameter-ids`, {
      params: { hardware_id: hardwareID },
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data as HardwareParameterIDResponse;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching hardware parameter IDs:", error);
    return null;
  }
};

export const ListReportHardware = async (): Promise<SensorDataParameterInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/report-hardware`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching report hardware data:", error);
    return null;
  }
};

export interface UpdateGroupAndIndexInput {
  group_display?: boolean;
  index?: number;     
  right?: boolean;    
}

type UpdateGroupDisplayResponse = { message: string; hardware_param: any };

export const UpdateGroupDisplay = async (
  id: number,
  data: UpdateGroupAndIndexInput
): Promise<UpdateGroupDisplayResponse | null> => {
  try {
    const payload: Record<string, any> = {};

    // ส่ง false ได้ด้วยการเช็ค !== undefined
    if (data.group_display !== undefined) {
      payload.group_display = data.group_display;
    }

    if (data.index !== undefined) {
      if (typeof data.index !== "number" || data.index < 1) {
        throw new Error("index must be >= 1");
      }
      payload.index = data.index;
    }

    if (data.right !== undefined) {
      payload.right = data.right;
    }

    if (Object.keys(payload).length === 0) {
      throw new Error("No fields to update (group_display or index or right required)");
    }

    const res = await axios.put(
      `${apiUrl}/hardware-parameter/${id}/group-display`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    return res.status === 200 ? (res.data as UpdateGroupDisplayResponse) : null;
  } catch (error: any) {
    console.error(
      "Error updating group_display/index/right:",
      error?.response?.data || error?.message || error
    );
    return null;
  }
};

export interface UpdateLayoutDisplayInput {
  layout_display: boolean;
}

export const UpdateLayoutDisplay = async (
  id: number,
  data: UpdateLayoutDisplayInput
): Promise<{ message: string; hardware_param: any } | null> => {
  try {
    const response = await axios.patch(
      `${apiUrl}/hardware-parameters/${id}/layout-display`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error(
      "Error updating layout_display:",
      error?.response?.data || error.message
    );
    return null;
  }
};

// 📌 ดึงรายการ Notification ทั้งหมด
export const ListNotification = async (): Promise<NotificationInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/notifications`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return null;
  }
};

// 📌 อัปเดต Alert ของ Notification ตาม ID
export const UpdateAlertByNotificationID = async (
  id: number,
  alert: boolean
): Promise<NotificationInterface | null> => {
  try {
    const response = await axios.patch(
      `${apiUrl}/notifications/${id}/alert`,
      { alert },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error(`Error updating alert for notification ${id}:`, error);
    return null;
  }
};

export const ListRoomNotification = async (): Promise<RoomNotificationInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/room-notifications`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching room notifications:", error);
    return null;
  }
};

export const DeleteNotificationByID = async (id: number): Promise<boolean> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-notifications/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return true; // ลบสำเร็จ
    } else {
      console.error("Unexpected status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
};

export const ListDataHardware = async (): Promise<any[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/data-sensorparameter`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching hardware data:", error);
    return null;
  }
};

export const DeleteRoomNotificationByNotificationID = async (id: number): Promise<boolean> => {
  try {
    const response = await axios.delete(`${apiUrl}/room-notifications/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return true;
    } else {
      console.error("Unexpected status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error deleting RoomNotification:", error);
    return false;
  }
};

interface CreateRoomNotificationPayload {
  room_id: number;
  notification_id: number;
}

// ✅ Service: Create RoomNotification
export const CreateRoomNotification = async (
  payload: CreateRoomNotificationPayload
): Promise<RoomNotificationInterface | null> => {
  try {
    const response = await axios.post(
      `${apiUrl}/room-notifications`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 201) {
      return response.data as RoomNotificationInterface;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error creating RoomNotification:", error);
    return null;
  }
};

export const UpdateNotificationIDByRoomID = async (
  roomId: number,
  notificationId: number
): Promise<RoomNotificationInterface | null> => {
  try {
    const response = await axios.put(
      `${apiUrl}/room-notification/${roomId}/notification`,
      { notification_id: notificationId },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return response.data.roomNotification as RoomNotificationInterface;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error updating NotificationID:", error);
    return null;
  }
};

// ดึง LineMaster record แรก
export const GetLineMasterFirst = async (): Promise<LineMasterInterface | null> => {
  try {
    const response = await axios.get(`${apiUrl}/line-master/first`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data as LineMasterInterface;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching line master:", error);
    return null;
  }
};

// อัปเดต Token ของ LineMaster ตาม ID
export const UpdateLineMasterByID = async (
  id: number,
  data: Partial<LineMasterInterface>
): Promise<LineMasterInterface | null> => {
  try {
    const response = await axios.put(`${apiUrl}/line-master/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data as LineMasterInterface;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error updating line master:", error);
    return null;
  }
};

export const UpdateHardwareParameterColorByID = async (
  id: number,
  code?: string,
  employee_id?: number
): Promise<HardwareParameterColorInterface | null> => {
  try {
    const payload: any = {};
    if (typeof code !== "undefined") payload.code = code;
    if (typeof employee_id !== "undefined") payload.employee_id = employee_id;

    const response = await axios.patch(
      `${apiUrl}/update-hardware-parameter-color/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      // backend ส่งกลับ object ของสี (ตามสัญญาเดิม)
      return response.data as HardwareParameterColorInterface;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error updating hardware parameter color:", error);
    return null;
  }
};

// ✅ Create Notification
export const CreateNotification = async (
  data: Partial<NotificationInterface>
): Promise<NotificationInterface | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-notification`, data, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error creating notification:", error.response?.data || error.message);
    return null;
  }
};

// ✅ Update Notification By ID (PATCH)
export const UpdateNotificationByID = async (
  id: number,
  data: { name: string; user_id: string }   // 👈 ใช้ key เล็กให้ตรง backend
): Promise<NotificationInterface | null> => {
  try {
    const response = await axios.patch(`${apiUrl}/update-notification/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error updating notification:", error.response?.data || error.message);
    return null;
  }
};

export interface CheckPasswordResponse {
  employee_id: number;
  valid: boolean;
}

export const CheckPasswordByID = async (
  employeeId: number,
  password: string
): Promise<CheckPasswordResponse | null> => {
  try {
    const response = await axios.post(
      `${apiUrl}/employees/${employeeId}/check-password`,
      { password },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      return response.data as CheckPasswordResponse;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error checking employee password:", error);
    return null;
  }
};

export const IsEmployeePasswordValid = async (
  employeeId: number,
  password: string
): Promise<boolean> => {
  const res = await CheckPasswordByID(employeeId, password);
  return !!res?.valid;
};