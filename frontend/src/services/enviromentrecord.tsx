import axios from "axios";
import { EnvironmentalRecordInterface } from "../interface/IEnvironmentalRecord";
const apiUrl = "http://localhost:8000";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const CreateTKN = async (tknrecord: EnvironmentalRecordInterface): Promise<EnvironmentalRecordInterface | null> => {
    try{
        const payload = {
            Date:                   tknrecord.date,
            Data:                   tknrecord.data,
            note:                   tknrecord.note,
            BeforeAfterTreatmentID: tknrecord.BeforeAfterTreatment?.ID,
            EnvironmentID:          tknrecord.Environment?.ID,
            ParameterID:            tknrecord.Parameter?.ID,
            StandardID:             tknrecord.Standard?.ID,
            UnitID:                 tknrecord.Unit?.ID,
            EmployeeID:             tknrecord.Employee?.ID,
        }
        const response = await axios.post(`${apiUrl}/create-tkn`, payload,{
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
        });

        if (response.status === 201) {
            return response.data
        } else {
            console.error("Unexpercted response status:", response.status);
            return null;
        }

    } catch(error){
        console.error("Error Creating TKN:", error);
        return null;
    }
}

export const ReadTKN = async (): Promise<EnvironmentalRecordInterface[] | null> => {
    try {
        const response = await axios.get(`${apiUrl}/read-tkn` , {
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

export const ReadTKNByID = async (
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
        console.error("Error fetching TKN:", error);
        return null;
    }
};

export const UpdateTKN  = async (
    id: number,
    tknrecord: Partial<EnvironmentalRecordInterface>
): Promise<EnvironmentalRecordInterface | null> => {
        try {
            const payload: any = {};

            if(tknrecord.date !== undefined) payload.date = tknrecord.date;
            if(tknrecord.data !== undefined) payload.data = Number(tknrecord.data);
            if(tknrecord.note !== undefined) payload.note = tknrecord.note;
            if(tknrecord.BeforeAfterTreatment?.ID !== undefined)
                payload.BeforeAfterTreatmentID = tknrecord.BeforeAfterTreatment.ID;

            if (tknrecord.Environment?.ID !== undefined)
                payload.EnvironmentID = tknrecord.Environment.ID;

            if (tknrecord.Parameter?.ID !== undefined)
                payload.ParameterID = tknrecord.Parameter.ID;

            if (tknrecord.Standard?.ID !== undefined)
                payload.StandardID = tknrecord.Standard.ID;

            if (tknrecord.Unit?.ID !== undefined)
                payload.UnitID = tknrecord.Unit.ID;

            if (tknrecord.Employee?.ID !== undefined)
                payload.EmployeeID = tknrecord.Employee.ID;
            
            const response = await axios.patch(`${apiUrl}/update-tkn/${id}`, payload,{
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader(),
                },
            });

            if (response.status === 200) {
                return response.data;
            } else {
                console.error("Unexpected response status:",response.status);
                return null;
            }
            } catch (error) {
                console.error("Error updating TKN record:", error);
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