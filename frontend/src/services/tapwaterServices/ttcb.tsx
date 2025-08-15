import axios from "axios";
import { TTCBcenterInterface, DeleteTTCBInterface } from "../../interface/Itapwater/Ittcb";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createTTCB = async (
  data: TTCBcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-ttcb`, data, {
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
    console.error("Error creating TTCB record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstTTCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-ttcb`, {
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
    console.error("Error creating TTCB record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistTTCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-ttcb`, {
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
    console.error("Error creating TTCB record:", error.response?.data || error.message);
    return null;
  }
};

export const GetTTCBTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-ttcb-table`, {
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
    console.error("Error fetching TTCB:", error);
    return null;
  }
};

export const UpdateOrCreateTTCB = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-ttcb/${payload.ID}`;
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
      const url = `${apiUrl}/create-ttcb`;
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
    console.error("Error in UpdateOrCreateTTCB:", error);
    throw error;
  }
};

export const DeleteTTCB = async (id: number): Promise<DeleteTTCBInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-ttcb/${id}`, {
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
    console.error("Error deleting TTCB :", error.response?.data || error.message);
    return null;
  }
};

export const GetTTCBbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-ttcb/${id}`, {
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
    console.error("Error fetching TTCB by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllTTCBRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-ttcb-day/${id}`, {
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
    console.error("Error deleting TTCB records by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetBeforeAfterTTCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-beforeafter-ttcb`, {
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
    console.error("Error creating TTCB record:", error.response?.data || error.message);
    return null;
  }
};