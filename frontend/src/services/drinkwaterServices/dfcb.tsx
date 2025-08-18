import axios from "axios";
import { DFCBcenterInterface, DeleteDFCBInterface } from "../../interface/Idrinkwater/Idfcb";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createDFCB = async (
  data: DFCBcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-dfcb`, data, {
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
    console.error("Error creating DFCB record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstDFCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-dfcb`, {
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
    console.error("Error creating DFCB record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistDFCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-dfcb`, {
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
    console.error("Error creating DFCB record:", error.response?.data || error.message);
    return null;
  }
};

export const GetDFCBTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-dfcb-table`, {
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
    console.error("Error fetching DFCB:", error);
    return null;
  }
};

export const UpdateOrCreateDFCB = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-dfcb/${payload.ID}`;
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
      const url = `${apiUrl}/create-dfcb`;
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
    console.error("Error in UpdateOrCreateDFCB:", error);
    throw error;
  }
};

export const DeleteDFCB = async (id: number): Promise<DeleteDFCBInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-dfcb/${id}`, {
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
    console.error("Error deleting DFCB :", error.response?.data || error.message);
    return null;
  }
};

export const GetDFCBbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-dfcb/${id}`, {
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
    console.error("Error fetching DFCB by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllDFCBRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-dfcb-day/${id}`, {
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
    console.error("Error deleting DFCB records by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetBeforeAfterDFCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-beforeafter-dfcb`, {
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
    console.error("Error creating DFCB record:", error.response?.data || error.message);
    return null;
  }
};