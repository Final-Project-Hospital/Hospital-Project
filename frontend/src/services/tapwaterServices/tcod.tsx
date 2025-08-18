import axios from "axios";
import { TCODcenterInterface, DeleteTCODInterface } from "../../interface/Itapwater/Itcod";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createTCOD = async (
  data: TCODcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-tcod`, data, {
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
    console.error("Error creating TCOD record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstTCOD = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-tcod`, {
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
    console.error("Error creating TCOD record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistTCOD = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-tcod`, {
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
    console.error("Error creating TCOD record:", error.response?.data || error.message);
    return null;
  }
};

export const GetTCODTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-tcod-table`, {
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
    console.error("Error fetching TCOD:", error);
    return null;
  }
};

export const UpdateOrCreateTCOD = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-tcod/${payload.ID}`;
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
      const url = `${apiUrl}/create-tcod`;
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
    console.error("Error in UpdateOrCreateTCOD:", error);
    throw error;
  }
};

export const DeleteTCOD = async (id: number): Promise<DeleteTCODInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-tcod/${id}`, {
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
    console.error("Error deleting TCOD :", error.response?.data || error.message);
    return null;
  }
};

export const GetTCODbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-tcod/${id}`, {
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
    console.error("Error fetching TCOD by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllTCODRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-tcod-day/${id}`, {
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
    console.error("Error deleting TCOD records by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetBeforeAfterTCOD = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-beforeafter-tcod`, {
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
    console.error("Error creating TCOD record:", error.response?.data || error.message);
    return null;
  }
};