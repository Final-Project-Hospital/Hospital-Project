import axios from "axios";
import { LoginInterface } from "../interface/Login"
import { UsersInterface } from "../interface/IUser";
import { EmployeeInterface } from "../interface/IEmployee";
import { RoleInterface } from "../interface/IRole";
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
): Promise<UsersInterface> => {
  const response = await axios.post(`${apiUrl}/signup`, input, {
    headers: getHeaders(),
  });
  return response.data;
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
      return response.data.user || response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error updating employee:", error);
    throw error; // ✅ โยน error ออกไปให้ catch ใน component
  }
};


export const ListEmployees = async (): Promise<EmployeeInterface[] | null> => {
  try {
    const res = await axios.get(`${apiUrl}/api/employees`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (res.status === 200) {
      return res.data as EmployeeInterface[];
    } else {
      console.error("Unexpected status:", res.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error fetching employees:", error?.response?.data || error?.message);
    return null;
  }
};

export const ListRole = async (): Promise<RoleInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/roles`, {
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
    console.error("Error fetching roles:", error);
    return null;
  }
};

// Interface สำหรับผลลัพธ์จาก API
export interface CheckEmailResponse {
  exists: boolean;
  email: string;
}

export const CheckEmail = async (email: string): Promise<CheckEmailResponse | null> => {
  try {
    const response = await axios.get(`${apiUrl}/check-email`, {
      params: { email },
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
    console.error("Error checking email:", error);
    return null;
  }
};

export interface ResetPasswordInput {
  email: string;
  newPassword: string;
}

export const ResetPassword = async (
  input: ResetPasswordInput
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${apiUrl}/reset-password`,
      input,
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
    console.error("Error resetting password:", error);
    return false;
  }
};

export {
  AddLogin,
};
