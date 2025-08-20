import axios from "axios";
import { ECOtankcenterInterface, DeleteECOtankInterface } from "../../../interface/Idrinkwater/tank/IecoT";
import { apiUrl } from "../../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createECOtank = async (
  data: ECOtankcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-eco-tank`, data, {
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
    console.error("Error creating ECOtank reco-tankrd:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstECOtank = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-eco-tank`, {
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
    console.error("Error creating ECOtank reco-tankrd:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistECOtank = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-eco-tank`, {
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
    console.error("Error creating ECOtank reco-tankrd:", error.response?.data || error.message);
    return null;
  }
};

export const GetECOtankTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-eco-tank-table`, {
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
    console.error("Error fetching ECOtank:", error);
    return null;
  }
};

export const UpdateOrCreateECOtank = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-eco-tank/${payload.ID}`;
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
      const url = `${apiUrl}/create-eco-tank`;
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
    console.error("Error in UpdateOrCreateECOtank:", error);
    throw error;
  }
};

export const DeleteECOtank = async (id: number): Promise<DeleteECOtankInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-eco-tank/${id}`, {
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
    console.error("Error deleting ECOtank :", error.response?.data || error.message);
    return null;
  }
};

export const GetECOtankbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-eco-tank/${id}`, {
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
    console.error("Error fetching ECOtank by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllECOtankRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-eco-tank-day/${id}`, {
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
    console.error("Error deleting ECOtank reco-tankrds by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetBeforeAfterECOtank = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-beforeafter-eco-tank`, {
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
    console.error("Error creating ECOtank reco-tankrd:", error.response?.data || error.message);
    return null;
  }
};