import axios from "axios";
import { DTCBtankcenterInterface, DeleteDTCBtankInterface } from "../../../interface/Idrinkwater/tank/IdtcbT";
import { apiUrl } from "../../index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const createDTCBtank = async (
  data: DTCBtankcenterInterface
): Promise<any | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-dtcb-tank`, data, {
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
    console.error("Error creating DTCBtank record:", error.response?.data || error.message);
    return null;
  }
};
export const GetfirstDTCBtank = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-dtcb-tank`, {
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
    console.error("Error creating DTCBtank record:", error.response?.data || error.message);
    return null;
  }
};

export const GetlistDTCBtank = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-dtcb-tank`, {
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
    console.error("Error creating DTCBtank record:", error.response?.data || error.message);
    return null;
  }
};

export const GetDTCBtankTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-dtcb-tank-table`, {
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
    console.error("Error fetching DTCBtank:", error);
    return null;
  }
};

export const UpdateOrCreateDTCBtank = async (payload: any) => {
  try {
    let response;

    if (payload.ID) {
      const url = `${apiUrl}/update-or-create-dtcb-tank/${payload.ID}`;
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
      const url = `${apiUrl}/create-dtcb-tank`;
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
    console.error("Error in UpdateOrCreateDTCBtank:", error);
    throw error;
  }
};

export const DeleteDTCBtank = async (id: number): Promise<DeleteDTCBtankInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-dtcb-tank/${id}`, {
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
    console.error("Error deleting DTCBtank :", error.response?.data || error.message);
    return null;
  }
};

export const GetDTCBtankbyID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-dtcb-tank/${id}`, {
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
    console.error("Error fetching DTCBtank by ID:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteAllDTCBtankRecordsByDate = async (
  id: number
): Promise<any | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-dtcb-tank-day/${id}`, {
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
    console.error("Error deleting DTCBtank records by date:", error.response?.data || error.message);
    return null;
  }
};

export const GetBeforeAfterDTCBtank = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-beforeafter-dtcb-tank`, {
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
    console.error("Error creating DTCBtank record:", error.response?.data || error.message);
    return null;
  }
};