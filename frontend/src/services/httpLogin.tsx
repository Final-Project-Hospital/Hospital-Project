import axios from "axios";
import { LoginInterface } from "../interface/Login"
import { UsersInterface } from "../interface/IUser";
import {apiUrl} from "./index"

export interface SignupInput {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string; 
  Password: string;
  Profile?: string;
  PositionID: number;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return {
    "Authorization": `${tokenType} ${token}`,
    "Content-Type": "application/json",
  };
}
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

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

export const SignupUser = async (
  input: SignupInput
): Promise<UsersInterface | false> => {
  try {
    const response = await axios.post(
      `${apiUrl}/signup`,
      input,
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error("Signup error:", error.response?.data || error.message);
    return false;
  }
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

export const UpdateEmployeeByID = async (
  EmployeeID: number,
  data: Partial<UsersInterface>
): Promise<UsersInterface | null> => {
  try {
    const response = await axios.patch(
      `${apiUrl}/employees/${EmployeeID}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (response.status === 200) {
      // ถ้ากลับมาเป็น { user: ... } ให้ใช้ response.data.user
      return response.data.user || response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error updating employee:", error);
    return null;
  }
};


export {
  AddLogin,
};
