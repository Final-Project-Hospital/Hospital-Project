import axios from "axios";
import { FogcenterInterface } from "../interface/IFogCenter";
import {apiUrl} from "./index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};


export const createFOG = async (
  data: FogcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-fog`, data, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 201 || response.status === 200) {
      return response;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error creating FOG record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstFOG = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-fog`,{
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error creating BOD record:", error.response?.data || error.message);
    return null;
  }
};