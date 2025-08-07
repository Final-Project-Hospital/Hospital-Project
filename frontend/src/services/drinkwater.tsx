import axios from "axios";
import { 
    CreateDTCBInterface, 
    CreateDFCBInterface, 
    CreateEcoliInterface,
} from "../interface/IDrinkwater";
import {apiUrl} from "./index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

//TCB
export const CreateTCB = async (
    payload: CreateDTCBInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-dtcb`, payload, {
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
        });
        if (response.status === 201) {
            return response;
        }else{
            console.error("Unexpected status:", response.status);
            return null;
        }
    } catch (error) {
        console.error("CreateTCB error:", error);
        return null;
    }
};
export const GetfirstTCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-dtcb`,{
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
    console.error("Error creating TCB record:", error.response?.data || error.message);
    return null;
  }
};
//TFCB
export const CreateFCB = async (
    payload: CreateDFCBInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-dfcb`, payload, {
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
        });
        if (response.status === 201) {
            return response;
        }else{
            console.error("Unexpected status:", response.status);
            return null;
        }
    } catch (error) {
        console.error("CreateFCB error:", error);
        return null;
    }
};
export const GetfirstFCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-dfcb`,{
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
//Ecoin
export const CreateEcoli = async (
    payload: CreateEcoliInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-ecoin`, payload, {
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
        });
        if (response.status === 201) {
            return response;
        }else{
            console.error("Unexpected status:", response.status);
            return null;
        }
    } catch (error) {
        console.error("CreateE coli error:", error);
        return null;
    }
};
export const GetfirstEcoli = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-ecoin`,{
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
    console.error("Error creating E coli record:", error.response?.data || error.message);
    return null;
  }
};