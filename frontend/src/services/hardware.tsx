import axios from "axios";
import { RoomInterface } from "../interface/IRoom"
import { BuildingInterface } from "../interface/IBuilding"
import { HardwareInterface } from "../interface/IHardware"
import { SensorDataParameterInterface } from "../interface/ISensorDataParameter"
import { HardwareGraphInterface } from "../interface/IHardwareGraph"
import { HardwareParameterColorInterface } from "../interface/IHardwareColor"
import { HardwareParameterInterface } from "../interface/IHardwareParameter"
const apiUrl = "http://localhost:8000";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};


const Authorization = localStorage.getItem("token");

const Bearer = localStorage.getItem("token_type");

const requestOptions = {

  headers: {

    "Content-Type": "application/json",

    Authorization: `${Bearer} ${Authorization}`,

  },

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

export const CreateRoom = async (room: RoomInterface): Promise<RoomInterface | null> => {
  try {
    const payload = {
      RoomName: room.RoomName,
      Floor: Number(room.Floor),
      BuildingID: room.Building?.ID,
      EmployeeID: room.Employee?.ID,
      HardwareID: room.Hardware?.ID,
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

    const response = await axios.patch(`${apiUrl}/update-room/${id}`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected response status:", response.status);
      return null;
    }
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


async function ListDataHardware() {

  return await axios

    .get(`${apiUrl}/data-sensorparameter`, requestOptions)

    .then((res) => res)

    .catch((e) => e.response);

}

export {
  ListDataHardware,
}

