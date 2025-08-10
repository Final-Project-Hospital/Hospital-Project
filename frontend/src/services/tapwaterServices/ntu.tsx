import axios from "axios";
import { NTUcenterInterface, DeleteNTUInterface } from "../../interface/Itapwater/Intu";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createNTU = async (
  data: NTUcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-ntu`, data, {
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
    console.error("Error creating NTU record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstNTU = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-ntu`, {
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
    console.error("Error creating NTU record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistNTU = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-ntu`, {
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
    console.error("Error creating NTU record:", error.response?.data || error.message);
    return null;
  }
};

export const GetNTUTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-ntu-table`, {
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
    console.error("Error fetching NTU:", error);
    return null;
  }
};

export const UpdateOrCreateNTU = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-ntu/${payload.ID}`;
      console.log("PATCH URL:", url);
      console.log("Payload:", payload);

      response = await axios.patch(url, payload, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
    } else {
      // Create
      const url = `${apiUrl}/create-ntu`;
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
    console.error("Error in UpdateOrCreateNTU:", error);
    throw error;
  }
};

export const DeleteNTU = async (id: number): Promise<DeleteNTUInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-ntu/${id}`, {
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
    console.error("Error deleting NTU :", error.response?.data || error.message);
    return null;
  }
};

export const GetNTUbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-ntu/${id}`, {
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
    console.error("Error fetching NTU by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllNTURecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-ntu-day/${id}`, {
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
    console.error("Error deleting NTU records by date:", error.response?.data || error.message);
    return null;
  }
};