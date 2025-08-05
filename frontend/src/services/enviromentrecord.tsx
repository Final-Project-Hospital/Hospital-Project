import axios from "axios";
import { 
  EnvironmentalRecordInterface, 
  CreateTKNInterface, 
  CreateTSInterface, 
  CreateCODInterface, 
  CreateFCBInterface, 
  CreateRESInterface,
  CreateSulfidInterface,
  CreateTCBInterface,
} from "../interface/IEnvironmentalRecord";
import {apiUrl} from "./index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

//TKN
export const CreateTKN = async (
    payload: CreateTKNInterface
): Promise<EnvironmentalRecordInterface | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-tkn`, payload, {
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
        console.error("CreateTKN error:", error);
        return null;
    }
};

export const GetTKN = async (): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/get-tkn` , {
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
}

export const GetfirstTKN = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-tkn`,{
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

export const ReadTKNByID = async (
    id: number
): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/read-tkn/${id}` , {
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

export const DeleteTKN = async (id: number): Promise<boolean> => {
    try {
        const response = await axios.delete(`${apiUrl}/delete-tkn/${id}`,{
            headers: {
        ...getAuthHeader(),
        },
    });

    if (response.status === 200) {
        return true;
    } else {
        console.error("Unexpected response status:", response.status);
        return false;
    }
    } catch (error) {
        console.error("Error deleting TKN:", error);
        return false;
    }
};

//TS
export const CreateTS = async (
    payload: CreateTSInterface
): Promise<EnvironmentalRecordInterface | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-ts`, payload, {
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
        console.error("CreateTS error:", error);
        return null;
    }
};

export const GetTS = async (): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/get-ts` , {
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
        console.error("Error fetching TS:", error);
        return null;
    }
}

export const GetfirstTS = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-ts`,{
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
    console.error("Error creating TS record:", error.response?.data || error.message);
    return null;
  }
};

export const ReadTSByID = async (
    id: number
): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/read-ts/${id}` , {
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
        console.error("Error fetching TS:", error);
        return null;
    }
};

export const DeleteTS = async (id: number): Promise<boolean> => {
    try {
        const response = await axios.delete(`${apiUrl}/delete-ts/${id}`,{
            headers: {
        ...getAuthHeader(),
        },
    });

    if (response.status === 200) {
        return true;
    } else {
        console.error("Unexpected response status:", response.status);
        return false;
    }
    } catch (error) {
        console.error("Error deleting TS:", error);
        return false;
    }
};

export const GetTSTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-ts-table`, {
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
    console.error("Error fetching TS:", error);
    return null;
  }
};

//COD
export const CreateCOD = async (
    payload: CreateCODInterface
): Promise<EnvironmentalRecordInterface | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-cod`, payload, {
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

export const GetCOD = async (): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/get-cod` , {
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
        console.error("Error fetching COD:", error);
        return null;
    }
}

export const GetfirstCOD = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-cod`,{
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

export const ReadCODByID = async (
    id: number
): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/read-cod/${id}` , {
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
        console.error("Error fetching COD:", error);
        return null;
    }
};

export const GetCODTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-cod-table`, {
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
    console.error("Error fetching COD:", error);
    return null;
  }
};

export const DeleteCOD = async (id: number): Promise<boolean> => {
    try {
        const response = await axios.delete(`${apiUrl}/delete-cod/${id}`,{
            headers: {
        ...getAuthHeader(),
        },
    });

    if (response.status === 200) {
        return true;
    } else {
        console.error("Unexpected response status:", response.status);
        return false;
    }
    } catch (error) {
        console.error("Error deleting COD:", error);
        return false;
    }
};

//FCB
export const CreateFCB = async (
    payload: CreateFCBInterface
): Promise<EnvironmentalRecordInterface | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-fcb`, payload, {
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
        console.error("Create FCB error:", error);
        return null;
    }
};

export const GetFCB = async (): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/get-fcb` , {
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
        console.error("Error fetching FCB:", error);
        return null;
    }
}

export const GetfirstFCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-fcb`,{
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

export const ReadFCBByID = async (
    id: number
): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/read-fcb/${id}` , {
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
        console.error("Error fetching FCB:", error);
        return null;
    }
};

export const GetFCBTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-fcb-table`, {
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
    console.error("Error fetching fcb:", error);
    return null;
  }
};

export const DeleteFCB = async (id: number): Promise<boolean> => {
    try {
        const response = await axios.delete(`${apiUrl}/delete-fcb/${id}`,{
            headers: {
        ...getAuthHeader(),
        },
    });

    if (response.status === 200) {
        return true;
    } else {
        console.error("Unexpected response status:", response.status);
        return false;
    }
    } catch (error) {
        console.error("Error deleting fcb:", error);
        return false;
    }
};

//RES
export const CreateRES = async (
    payload: CreateRESInterface
): Promise<EnvironmentalRecordInterface | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-res`, payload, {
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
        console.error("Create Residual error:", error);
        return null;
    }
};

export const GetRES = async (): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/get-res` , {
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
        console.error("Error fetching Residual:", error);
        return null;
    }
}

export const GetfirstRES = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-res`,{
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
    console.error("Error creating Residual record:", error.response?.data || error.message);
    return null;
  }
};

export const ReadRESByID = async (
    id: number
): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/read-res/${id}` , {
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
        console.error("Error fetching Residual:", error);
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
    console.error("Error fetching Residual:", error);
    return null;
  }
};

export const DeleteRES = async (id: number): Promise<boolean> => {
    try {
        const response = await axios.delete(`${apiUrl}/delete-res/${id}`,{
            headers: {
        ...getAuthHeader(),
        },
    });

    if (response.status === 200) {
        return true;
    } else {
        console.error("Unexpected response status:", response.status);
        return false;
    }
    } catch (error) {
        console.error("Error deleting Residual:", error);
        return false;
    }
};

//SUL
export const CreateSUL = async (
    payload: CreateSulfidInterface
): Promise<EnvironmentalRecordInterface | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-sul`, payload, {
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
        console.error("Create Sulfide error:", error);
        return null;
    }
};

export const GetSUL = async (): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/get-sul` , {
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
        console.error("Error fetching Sulfide:", error);
        return null;
    }
}

export const GetfirstSUL = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-sul`,{
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
    console.error("Error creating Sulfide record:", error.response?.data || error.message);
    return null;
  }
};

export const ReadSULByID = async (
    id: number
): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/read-sul/${id}` , {
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
        console.error("Error fetching Sulfide:", error);
        return null;
    }
};

export const GetSULTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-sul-table`, {
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
    console.error("Error fetching Sulfide:", error);
    return null;
  }
};

export const DeleteSUL = async (id: number): Promise<boolean> => {
    try {
        const response = await axios.delete(`${apiUrl}/delete-sul/${id}`,{
            headers: {
        ...getAuthHeader(),
        },
    });

    if (response.status === 200) {
        return true;
    } else {
        console.error("Unexpected response status:", response.status);
        return false;
    }
    } catch (error) {
        console.error("Error deleting Sulfide:", error);
        return false;
    }
};

//TCB
export const CreateTCB = async (
    payload: CreateTCBInterface
): Promise<EnvironmentalRecordInterface | null> => {
    try {
        const response = await axios.post(`${apiUrl}/create-tcb`, payload, {
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

export const GetTCB = async (): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/get-tcb` , {
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
        console.error("Error fetching TCB:", error);
        return null;
    }
}

export const GetfirstTCB = async (
): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-first-tcb`,{
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

export const ReadTCBByID = async (
    id: number
): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/read-tcb/${id}` , {
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
        console.error("Error fetching TCB:", error);
        return null;
    }
};

export const GetTCBTABLE = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get-TCB-table`, {
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
    console.error("Error fetching TCB:", error);
    return null;
  }
};

export const DeleteTCB = async (id: number): Promise<boolean> => {
    try {
        const response = await axios.delete(`${apiUrl}/delete-tcb/${id}`,{
            headers: {
        ...getAuthHeader(),
        },
    });

    if (response.status === 200) {
        return true;
    } else {
        console.error("Unexpected response status:", response.status);
        return false;
    }
    } catch (error) {
        console.error("Error deleting TCB:", error);
        return false;
    }
};