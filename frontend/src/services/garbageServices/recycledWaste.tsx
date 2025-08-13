import axios from "axios";
import { RecycledcenterInterface, DeleteRecycledInterface } from "../../interface/Igarbage/IrecycledWaste";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createRecycled = async (
  data: RecycledcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-recycled`, data, {
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
    console.error("Error creating hazard record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstRecycled = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-recycled`, {
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
    console.error("Error creating Recycled record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistRecycled = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-recycled`, {
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
    console.error("Error creating Recycled record:", error.response?.data || error.message);
    return null;
  }
};

export const GetRecycledTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-recycled-table`, {
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
    console.error("Error fetching Recycled:", error);
    return null;
  }
};

export const UpdateOrCreateRecycled = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-recycled/${payload.ID}`;
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
      const url = `${apiUrl}/create-recycled`;
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
    console.error("Error in UpdateOrCreateRecycled:", error);
    throw error;
  }
};

export const DeleteRecycled = async (id: number): Promise<DeleteRecycledInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-recycled/${id}`, {
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
    console.error("Error deleting Recycled :", error.response?.data || error.message);
    return null;
  }
};

export const GetRecycledbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-recycled/${id}`, {
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
    console.error("Error fetching Recycled by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllRecycledRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-recycled-day/${id}`, {
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
    console.error("Error deleting Recycled records by date:", error.response?.data || error.message);
    return null;
  }
};