// import axios from "axios";
// import { BODcenterInterface, DeleteBODInterface } from "../../interface/Iwastewater/Ibod";
// import { apiUrl } from "../index"

// const getAuthHeader = () => {
//   const token = localStorage.getItem("token");
//   const tokenType = localStorage.getItem("token_type");
//   return { Authorization: `${tokenType} ${token}` };
// };

// export const createBOD = async (
//   data: BODcenterInterface
// ): Promise<any | null> => {
//   try {
//     const response = await axios.post(`${apiUrl}/create-bod`, data, {
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeader(),
//       },
//     });

//     if (response.status === 201 || response.status === 200) {
//       return response;
//     } else {
//       console.error("Unexpected status:", response.status);
//       return null;
//     }
//   } catch (error: any) {
//     console.error("Error creating BOD record:", error.response?.data || error.message);
//     return null;
//   }
// };
// export const GetfirstBOD = async (
// ): Promise<any | null> => {
//   try {
//     const response = await axios.get(`${apiUrl}/get-first-bod`, {
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeader(),
//       },
//     });

//     if (response.status === 200) {
//       return response;
//     } else {
//       console.error("Unexpected status:", response.status);
//       return null;
//     }
//   } catch (error: any) {
//     console.error("Error creating BOD record:", error.response?.data || error.message);
//     return null;
//   }
// };

// export const GetlistBOD = async (
// ): Promise<any | null> => {
//   try {
//     const response = await axios.get(`${apiUrl}/list-bod`, {
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeader(),
//       },
//     });

//     if (response.status === 200) {
//       return response;
//     } else {
//       console.error("Unexpected status:", response.status);
//       return null;
//     }
//   } catch (error: any) {
//     console.error("Error creating BOD record:", error.response?.data || error.message);
//     return null;
//   }
// };

// export const GetBODTABLE = async () => {
//   try {
//     const response = await axios.get(`${apiUrl}/get-bod-table`, {
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeader(),
//       },
//     });
//     if (response.status === 200) {
//       return response.data;
//     } else {
//       console.error("Unexpected status:", response.status);
//       return null;
//     }
//   } catch (error) {
//     console.error("Error fetching BOD:", error);
//     return null;
//   }
// };

// export const UpdateOrCreateBOD = async (payload: any) => {
//   try {
//     let response;

//     if (payload.ID) {
//       const url = `${apiUrl}/update-or-create-bod/${payload.ID}`;
//       console.log("PATCH URL:", url);
//       console.log("Payload:", payload);

//       response = await axios.patch(url, payload, {
//         headers: {
//           "Content-Type": "application/json",
//           ...getAuthHeader(),
//         },
//       });
//     } else {
//       // Create
//       const url = `${apiUrl}/create-bod`;
//       console.log("POST URL:", url);
//       console.log("Payload:", payload);

//       response = await axios.post(url, payload, {
//         headers: {
//           "Content-Type": "application/json",
//           ...getAuthHeader(),
//         },
//       });
//     }

//     return response.data;
//   } catch (error) {
//     console.error("Error in UpdateOrCreateBOD:", error);
//     throw error;
//   }
// };

// export const DeleteBOD = async (id: number): Promise<DeleteBODInterface[] | null> => {
//   try {
//     const response = await axios.delete(`${apiUrl}/delete-bod/${id}`, {
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeader(),
//       },
//     });

//     if (response.status === 200) {
//       return response.data;
//     } else {
//       console.error("Unexpected status:", response.status);
//       return null;
//     }
//   } catch (error: any) {
//     console.error("Error deleting BOD :", error.response?.data || error.message);
//     return null;
//   }
// };

// export const GetBODbyID = async (id: number): Promise<any | null> => {
//   try {
//     const response = await axios.get(`${apiUrl}/get-bod/${id}`, {
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeader(),
//       },
//     });

//     if (response.status === 200) {
//       return response;
//     } else {
//       console.error("Unexpected status:", response.status);
//       return null;
//     }
//   } catch (error: any) {
//     console.error("Error fetching BOD by ID:", error.response?.data || error.message);
//     return null;
//   }
// };

// export const DeleteAllBODRecordsByDate = async (
//   id: number
// ): Promise<any | null> => {
//   try {
//     const response = await axios.delete(`${apiUrl}/delete-bod-day/${id}`, {
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeader(),
//       },
//     });

//     if (response.status === 200) {
//       return response.data; // อาจเป็นข้อความยืนยัน หรือข้อมูลอื่นๆ จาก backend
//     } else {
//       console.error("Unexpected status:", response.status);
//       return null;
//     }
//   } catch (error: any) {
//     console.error("Error deleting BOD records by date:", error.response?.data || error.message);
//     return null;
//   }
// };