import axios from "axios";
import { BodcenterInterface } from "../interface/IBodCenter";
import {apiUrl} from "./index"

// const Authorization = localStorage.getItem("token");

// const Bearer = localStorage.getItem("token_type");

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

// const requestOptions = {

//   headers: {

//     "Content-Type": "application/json",

//     Authorization: `${Bearer} ${Authorization}`,

//   },

// };

export const createBOD = async (
  data: BodcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-bod`, data, {
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
    console.error("Error creating BOD record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstBOD = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-bod`,{
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

export const GetlistBOD = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-bod`,{
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
