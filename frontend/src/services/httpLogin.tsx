import axios from "axios";
import { LoginInterface } from "../interface/Login"
import { UsersInterface } from "../interface/IUser"; 

const apiUrl = "http://localhost:8000";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return {
    "Authorization": `${tokenType} ${token}`,
    "Content-Type": "application/json",
  };
}

const requestOptions = {
  headers: getAuthHeaders(),
};

const getHeaders = (): Record<string, string> => {
  const Authorization = localStorage.getItem("token");
  const Bearer = localStorage.getItem("token_type");
  return {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  };
};


async function AddLogin(data: LoginInterface) {
  return await axios  
    .post(`${apiUrl}/login`, data, requestOptions)
    .then((res) => res) 
    .catch((e) => e.response);
}

export const GetUserDataByUserID = async (
  id: number | string
): Promise<UsersInterface | false> => {
  try {
    const response = await axios.get(`${apiUrl}/user-data/${id}`, {
      headers: getHeaders(),
    });

    console.log("Response from API:", response.data);
    return response.data.user; // return user object ที่ได้จาก backend
  } catch (error: any) {
    console.error(
      "Error fetching User data:",
      error.response?.data || error.message
    );
    return false;
  }
};


export {
  AddLogin,
};
