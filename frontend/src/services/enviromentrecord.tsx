import axios from "axios";
import { EnvironmentalRecordInterface } from "../interface/IEnvironmentalRecord";
import { Underline } from "react-feather";
const apiUrl = "http://localhost:8000";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const CreateTKN = async (tknrecord: EnvironmentalRecordInterface): Promise<EnvironmentalRecordInterface | null> => {
    try{
        const payload = {
            Date: tknrecord.date,
            Data: tknrecord.data,
            coomment: tknrecord.comment,
            BeforeAfterTreatmentID: tknrecord.BeforeAfterTreatment?.ID,
            EnvironmentID: tknrecord.EnvironmentID,
            ParameterID: tknrecord.ParameterID,
            StandardID: tknrecord.StandardID,
            UnitID: tknrecord.UnitID,
            EmployeeID: tknrecord.EmployeeID,
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

export const UpdateTKN  = async (
    id: number,
    tknrecord: Partial<EnvironmentalRecordInterface>
):
    Promise<EnvironmentalRecordInterface | null> => {
        try {
            const payload: Partial<EnvironmentalRecordInterface> = {};

            if(tknrecord.date !== undefined) payload.date = tknrecord.date;
            if(tknrecord.data !== undefined) payload.data = Number(tknrecord.data);
            if(tknrecord.comment !== undefined) payload.comment = tknrecord.comment;
            if(tknrecord.BeforeAfterTreatment?.ID  !== undefined) payload.BeforeAfterTreatmentID = tknrecord.BeforeAfterTreatment.ID;
            if(tknrecord.Environment?.ID !== undefined) payload.EnvironmentID = tknrecord.Environment.ID;
        }
    }