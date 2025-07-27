import axios from 'axios';
import { message } from 'antd';
import { CalendarInterface } from "../interface/ICalendar";
import { ListBeforeAfterTreatmentInterface } from "../interface/IBeforeAfterTreatment";
import { ListUnitInterface } from "../interface/IUnit";
import { ListMiddleStandardInterface, ListRangeStandardInterface, ListStandardInterface, AddMiddleStandardInterface, AddRangeStandardInterface } from "../interface/IStandard";

// export const apiUrl = "http://10.0.14.228:8000";
export const apiUrl = "http://localhost:8000";

const Authorization = localStorage.getItem("token");

const Bearer = localStorage.getItem("token_type");

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

const requestOptions = {

  headers: {

    "Content-Type": "application/json",

    Authorization: `${Bearer} ${Authorization}`,

  },

};


async function GetUsers() {

  return await axios

    .get(`${apiUrl}/users`, requestOptions)

    .then((res) => res)

    .catch((e) => e.response);

}

export const CreateCalendar = async (
  calendarData: CalendarInterface
): Promise<{ message: string; calendar: CalendarInterface } | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-calendar`, calendarData, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error creating calendar:", error.response?.data || error.message);
    return null;
  }
};


export const ListCalendars = async (): Promise<CalendarInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/calendars`, {
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
    console.error("Error fetching calendars:", error.response?.data || error.message);
    return null;
  }
};

export const UpdateCalendar = async (
  id: number,
  calendarData: CalendarInterface
): Promise<{ message: string; calendar: CalendarInterface } | null> => {
  try {
    const response = await axios.put(`${apiUrl}/update-calendar/${id}`, calendarData, {
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
    console.error("Error updating calendar:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteCalendar = async (
  id: number
): Promise<{ message: string } | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-calendar/${id}`, {
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
    console.error("Error deleting calendar:", error.response?.data || error.message);
    return null;
  }
};


//SelectBoxAll
export const ListBeforeAfterTreatment = async (): Promise<ListBeforeAfterTreatmentInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-BeforeAfterTreatment`, {
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
    console.error("Error fetching ListBeforeAfterTreatment:", error.response?.data || error.message);
    return null;
  }
};

export const ListUnit = async (): Promise<ListUnitInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-unit`, {
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
    console.error("Error fetching ListUnit:", error.response?.data || error.message);
    return null;
  }
};

// Standard
export const ListStandard = async (): Promise<ListStandardInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-standard`, {
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
    console.error("Error fetching ListStandard:", error.response?.data || error.message);
    return null;
  }
};

export const ListMiddleStandard = async (): Promise<ListMiddleStandardInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-standard-middle`, {
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
    console.error("Error fetching ListMiddleStandard:", error.response?.data || error.message);
    return null;
  }
};

export const ListRangeStandard = async (): Promise<ListRangeStandardInterface[] | null> => {
  try {
    const response = await axios.get(`${apiUrl}/list-standard-range`, {
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
    console.error("Error fetching ListRangeStandard:", error.response?.data || error.message);
    return null;
  }
};

export const AddMiddleStandard = async (
  payload: AddMiddleStandardInterface
): Promise<ListMiddleStandardInterface | null> => {
  try {
    const response = await axios.post(`${apiUrl}/add-middle-standard`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 201) {
      // message.success("บันทึกข้อมูลสำเร็จ");
      return response.data; // ✅ return ข้อมูลที่ตรงกับ interface
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error add-middle-standard:", error.response?.data || error.message);
    message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    return null;
  }
};

export const AddRangeStandard = async (
  payload: AddRangeStandardInterface
): Promise<ListRangeStandardInterface | null> => {
  try {
    const response = await axios.post(`${apiUrl}/add-range-standard`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 201) {
      // message.success("บันทึกข้อมูลสำเร็จ");
      return response.data; // ✅ return ข้อมูลที่ตรงกับ interface
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error add-range-standard:", error.response?.data || error.message);
    message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    return null;
  }
};

export const GetStandardByID = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${apiUrl}/get-standard/${id}`, {
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
    console.error("Error fetching standard by ID:", error.response?.data || error.message);
    return null;
  }
};

export {
  GetUsers,
};