import axios, { AxiosResponse } from 'axios';
import { message } from 'antd';
import { CreatePHInterface } from "../interface/IpH";
import { UpdatePHInterface } from "../interface/IpH";
import { DeletePHInterface } from "../interface/IpH";
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

export const CreatePH = async (payload: CreatePHInterface): Promise<AxiosResponse<any> | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-ph`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 201) {
      return response;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error creating pH:", error.response?.data || error.message);
    message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    return null;
  }
};

export const UpdatePH = async (id: number): Promise<UpdatePHInterface[] | null> => {
  try {
    const response = await axios.patch(`${apiUrl}/update-ph/${id}`, {
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
    console.error("Error updating pH:", error.response?.data || error.message);
    return null;
  }
};

export const DeletePH = async (id: number): Promise<DeletePHInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-ph/${id}`, {
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
    console.error("Error deleting pH:", error.response?.data || error.message);
    return null;
  }
};

export const GetfirstPH = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-ph`,{
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
    console.error("Error creating PH record:", error.response?.data || error.message);
    return null;
  }
};
