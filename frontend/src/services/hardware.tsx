import axios from "axios";
import {RoomInterface} from "../interface/IRoom"
import {BuildingInterface} from "../interface/IBuilding"
import {HardwareInterface} from "../interface/IHardware"
const apiUrl = "http://localhost:8000";

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