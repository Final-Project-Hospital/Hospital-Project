import axios from "axios";
import { 
    CreateALInterface, 
    CreateIronInterface, 
    CreateMnInterface,
    CreateNiInterface,
    CreateNTUInterface,
    CreatePTInterface,
    CreateTCODInterface,
    CreateTHInterface,
    CreateTTCBInterface,
} from "../interface/ITapwater";
import {apiUrl} from "./index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

//Al
export const CreateAL = async (
    payload: CreateALInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-al`, payload, {
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
        console.error("CreateAl error:", error);
        return null;
    }
};
export const GetfirstAL = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-al`,{
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
    console.error("Error creating AL record:", error.response?.data || error.message);
    return null;
  }
};
//iron
export const CreateIron = async (
    payload: CreateIronInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-iron`, payload, {
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
        console.error("Create Iron error:", error);
        return null;
    }
};
export const GetfirstIron = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-iron`,{
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
    console.error("Error creating Iron record:", error.response?.data || error.message);
    return null;
  }
};
//Mn
export const CreateMn = async (
    payload: CreateMnInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-mn`, payload, {
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
        console.error("Create Mn error:", error);
        return null;
    }
};
export const GetfirstMn = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-mn`,{
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
    console.error("Error creating MN record:", error.response?.data || error.message);
    return null;
  }
};
//Ni
export const CreateNi = async (
    payload: CreateNiInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-ni`, payload, {
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
        console.error("Create Ni error:", error);
        return null;
    }
};
export const GetfirstNi = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-ni`,{
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
    console.error("Error creating Ni record:", error.response?.data || error.message);
    return null;
  }
};
//NTU
export const CreateNTU = async (
    payload: CreateNTUInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-ntu`, payload, {
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
        console.error("Create NTU error:", error);
        return null;
    }
};
export const GetfirstNTU = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-ntu`,{
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
    console.error("Error creating NTU record:", error.response?.data || error.message);
    return null;
  }
};
//PT
export const CreatePT = async (
    payload: CreatePTInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-pt`, payload, {
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
        console.error("Create PT error:", error);
        return null;
    }
};
export const GetfirstPT = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-pt`,{
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
    console.error("Error creating PT record:", error.response?.data || error.message);
    return null;
  }
};
//COD
export const CreateTCOD = async (
    payload: CreateTCODInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-tcod`, payload, {
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
        console.error("Create COD error:", error);
        return null;
    }
};
export const GetfirstTCOD = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-tcod`,{
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
    console.error("Error creating COD record:", error.response?.data || error.message);
    return null;
  }
};
//TH
export const CreateTH = async (
    payload: CreateTHInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-th`, payload, {
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
        console.error("Create TH error:", error);
        return null;
    }
};
export const GetfirstTH = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-th`,{
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
    console.error("Error creating TH record:", error.response?.data || error.message);
    return null;
  }
};
//TCB
export const CreateTCB = async (
    payload: CreateTTCBInterface
): Promise<any | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-ttcb`, payload, {
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
        console.error("Create TCB error:", error);
        return null;
    }
};
export const GetfirstTCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-ttcb`,{
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