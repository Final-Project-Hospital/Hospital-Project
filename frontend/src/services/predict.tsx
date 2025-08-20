import axios from 'axios';
import { PredictionOutput } from "../interface/IPredict"
import { apiUrl } from "./index"

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export const fetchPrediction = async (

): Promise<PredictionOutput> => {
  const url = `${apiUrl}/api/predict`;
  try {
    const response = await axios.post<PredictionOutput>(url, {}, {
      headers: getAuthHeader(),
    });    
    return response.data; 
  } catch (error) {
    console.error("Failed to fetch prediction:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Axios error details:", error.response.data);
      console.error("Status:", error.response.status);
    }
    throw error;
  }
};