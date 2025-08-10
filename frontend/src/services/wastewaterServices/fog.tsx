import axios from "axios";
import { FOGcenterInterface, DeleteFOGInterface } from "../../interface/Iwastewater/Ifog";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createFOG = async (
  data: FOGcenterInterface
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
    const response = await axios.get(`${apiUrl}/get-first-fog`, {
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
    console.error("Error creating FOG record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistFOG = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-fog`, {
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
    console.error("Error creating FOG record:", error.response?.data || error.message);
    return null;
  }
};

export const GetFOGTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-fog-table`, {
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
    console.error("Error fetching FOG:", error);
    return null;
  }
};

export const UpdateOrCreateFOG = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-fog/${payload.ID}`;
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
      const url = `${apiUrl}/create-fog`;
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
    console.error("Error in UpdateOrCreateFOG:", error);
    throw error;
  }
};

export const DeleteFOG = async (id: number): Promise<DeleteFOGInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-fog/${id}`, {
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
    console.error("Error deleting FOG :", error.response?.data || error.message);
    return null;
  }
};

export const GetFOGbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-fog/${id}`, {
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
    console.error("Error fetching FOG by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllFOGRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-fog-day/${id}`, {
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
    console.error("Error deleting FOG records by date:", error.response?.data || error.message);
    return null;
  }
};