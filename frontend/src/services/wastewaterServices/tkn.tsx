import axios from "axios";
import { TKNcenterInterface, DeleteTKNInterface } from "../../interface/Iwastewater/Itkn";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createTKN = async (
  data: TKNcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-tkn`, data, {
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
    console.error("Error creating TKN record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstTKN = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-tkn`, {
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
    console.error("Error creating TKN record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistTKN = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-tkn`, {
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
    console.error("Error creating TKN record:", error.response?.data || error.message);
    return null;
  }
};

export const GetTKNTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-tkn-table`, {
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
    console.error("Error fetching TKN:", error);
    return null;
  }
};

export const UpdateOrCreateTKN = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-tkn/${payload.ID}`;
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
      const url = `${apiUrl}/create-tkn`;
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
    console.error("Error in UpdateOrCreateTKN:", error);
    throw error;
  }
};

export const DeleteTKN = async (id: number): Promise<DeleteTKNInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-tkn/${id}`, {
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
    console.error("Error deleting TKN :", error.response?.data || error.message);
    return null;
  }
};

export const GetTKNbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-tkn/${id}`, {
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
    console.error("Error fetching TKN by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllTKNRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-tkn-day/${id}`, {
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
    console.error("Error deleting TKN records by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetBeforeAfterTKN = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-beforeafter-tkn`, {
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
    console.error("Error creating TKN record:", error.response?.data || error.message);
    return null;
  }
};