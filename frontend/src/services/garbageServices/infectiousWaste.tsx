import axios from "axios";
import { InfectiouscenterInterface } from "../../interface/Igarbage/IinfectiousWaste";
import { apiUrl } from "../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createInfectious = async (
  data: InfectiouscenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-infectious`, data, {
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
export const GetfirstInfectious = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-infectious`, {
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
    console.error("Error creating Infectious record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistInfectious = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-infectious`, {
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
    console.error("Error creating Infectious record:", error.response?.data || error.message);
    return null;
  }
};

export const GetInfectiousTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-infectious-table`, {
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
    console.error("Error fetching Infectious:", error);
    return null;
  }
};

export const UpdateOrCreateInfectious = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-infectious/${payload.ID}`;
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
      const url = `${apiUrl}/create-infectious`;
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
    console.error("Error in UpdateOrCreateInfectious:", error);
    throw error;
  }
};

export const GetInfectiousbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-infectious/${id}`, {
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
    console.error("Error fetching Infectious by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllInfectiousRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-infectious-day/${id}`, {
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
    console.error("Error deleting Infectious records by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetBeforeAfterInfectious = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-beforeafter-infectious`, {
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
    console.error("Error creating Infectious record:", error.response?.data || error.message);
    return null;
  }
};

export const GetLastDayInfectious = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-last-day-infectious`, {
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
    console.error("Error creating Infectious record:", error.response?.data || error.message);
    return null;
  }
};