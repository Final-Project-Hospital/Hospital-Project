import axios from "axios";
import { REScenterInterface, DeleteRESInterface } from "../../interface/Iwastewater/Ires";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createRES = async (
  data: REScenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-res`, data, {
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
    console.error("Error creating RES record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstRES = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-res`, {
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
    console.error("Error creating RES record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistRES = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-res`, {
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
    console.error("Error creating RES record:", error.response?.data || error.message);
    return null;
  }
};

export const GetRESTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-res-table`, {
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
    console.error("Error fetching RES:", error);
    return null;
  }
};

export const UpdateOrCreateRES = async (payload: any) => {
  try {
    let response;
    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-res/${payload.ID}`;
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
      const url = `${apiUrl}/create-res`;
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
    console.error("Error in UpdateOrCreateRES:", error);
    throw error;
  }
};

export const DeleteRES = async (id: number): Promise<DeleteRESInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-res/${id}`, {
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
    console.error("Error deleting RES :", error.response?.data || error.message);
    return null;
  }
};

export const GetRESbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-res/${id}`, {
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
    console.error("Error fetching RES by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllRESRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-res-day/${id}`, {
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
    console.error("Error deleting RES records by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetBeforeAfterRES = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-beforeafter-res`,{
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
    console.error("Error creating RES record:", error.response?.data || error.message);
    return null;
  }
};