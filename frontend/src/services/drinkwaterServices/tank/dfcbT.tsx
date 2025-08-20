import axios from "axios";
import { DFCBtankcenterInterface, DeleteDFCBtankInterface } from "../../../interface/Idrinkwater/tank/IdfcbT";
import { apiUrl } from "../../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createDFCBtank = async (
  data: DFCBtankcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-dfcb-tank`, data, {
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
    console.error("Error creating DFCBtank record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstDFCBtank = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-dfcb-tank`, {
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
    console.error("Error creating DFCBtank record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistDFCBtank = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-dfcb-tank`, {
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
    console.error("Error creating DFCBtank record:", error.response?.data || error.message);
    return null;
  }
};

export const GetDFCBtankTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-dfcb-tank-table`, {
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
    console.error("Error fetching DFCBtank:", error);
    return null;
  }
};

export const UpdateOrCreateDFCBtank = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-dfcb-tank/${payload.ID}`;
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
      const url = `${apiUrl}/create-dfcb-tank`;
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
    console.error("Error in UpdateOrCreateDFCBtank:", error);
    throw error;
  }
};

export const DeleteDFCBtank = async (id: number): Promise<DeleteDFCBtankInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-dfcb-tank/${id}`, {
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
    console.error("Error deleting DFCBtank :", error.response?.data || error.message);
    return null;
  }
};

export const GetDFCBtankbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-dfcb-tank/${id}`, {
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
    console.error("Error fetching DFCBtank by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllDFCBtankRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-dfcb-tank-day/${id}`, {
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
    console.error("Error deleting DFCBtank records by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetBeforeAfterDFCBtank = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-beforeafter-dfcb-tank`, {
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
    console.error("Error creating DFCBtank record:", error.response?.data || error.message);
    return null;
  }
};