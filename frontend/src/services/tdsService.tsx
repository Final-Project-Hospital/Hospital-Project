import axios, { AxiosResponse } from 'axios';
import { message } from 'antd';
import { CreateTDSInterface } from "../interface/ITds";
import { UpdateTDSInterface } from "../interface/ITds";
import { DeleteTDSInterface } from "../interface/ITds";
import { apiUrl } from "./index"

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

export const GetTDS = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-tds`, {
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
    console.error("Error fetching TDS:", error);
    return null;
  }
};

export const GetTDSbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-tds/${id}`, {
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
    console.error("Error fetching TDS by ID:", error.response?.data || error.message);
    return null;
  }
};

export const CreateTDS = async (payload: CreateTDSInterface): Promise<AxiosResponse<any> | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-tds`, payload, {
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
    console.error("Error creating TDS:", error.response?.data || error.message);
    message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    return null;
  }
};

export const UpdateTDS = async (payload: UpdateTDSInterface) => {
  if (!payload.ID) {
    throw new Error("ID is required for update");
  }
  const url = `${apiUrl}/update-tds/${payload.ID}`;
  console.log("PATCH URL:", url);
  console.log("Payload:", payload);

  try {
    const response = await axios.patch(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    return response;
  } catch (error) {
    console.error("Error updating TDS:", error);
    throw error;
  }
};

export const UpdateOrCreateTDS = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      // ✅ Update
      const url = `${apiUrl}/update-tds/${payload.ID}`;
      console.log("PATCH URL:", url);
      console.log("Payload:", payload);

      response = await axios.patch(url, payload, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
    } else {
      // ✅ Create
      const url = `${apiUrl}/create-tds`;
      console.log("POST URL:", url);
      console.log("Payload:", payload);

      response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error in UpdateOrCreateTDS:", error);
    throw error;
  }
};

export const DeleteTDS = async (id: number): Promise<DeleteTDSInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-tds/${id}`, {
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
    console.error("Error deleting TDS:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllTDSRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-tds-day/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 200) {
      return response.data; // อาจเป็นข้อความยืนยัน หรือข้อมูลอื่นๆ จาก backend
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error deleting TDS records by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetfirstTDS = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-tds`, {
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
    console.error("Error creating TDS record:", error.response?.data || error.message);
    return null;
  }
};
