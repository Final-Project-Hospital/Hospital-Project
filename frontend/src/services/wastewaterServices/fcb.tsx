import axios from "axios";
import { FCBcenterInterface, DeleteFCBInterface } from "../../interface/Iwastewater/Ifcb";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createFCB = async (
  data: FCBcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-fcb`, data, {
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
    console.error("Error creating FCB record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstFCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-fcb`, {
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
    console.error("Error creating FCB record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistFCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-fcb`, {
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
    console.error("Error creating FCB record:", error.response?.data || error.message);
    return null;
  }
};

export const GetFCBTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-fcb-table`, {
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
    console.error("Error fetching FCB:", error);
    return null;
  }
};

export const UpdateOrCreateFCB = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-fcb/${payload.ID}`;
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
      const url = `${apiUrl}/create-fcb`;
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
    console.error("Error in UpdateOrCreateFCB:", error);
    throw error;
  }
};

export const DeleteFCB = async (id: number): Promise<DeleteFCBInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-fcb/${id}`, {
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
    console.error("Error deleting FCB :", error.response?.data || error.message);
    return null;
  }
};

export const GetFCBbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-fcb/${id}`, {
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
    console.error("Error fetching FCB by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllFCBRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-fcb-day/${id}`, {
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
    console.error("Error deleting FCB records by date:", error.response?.data || error.message);
    return null;
  }
};