import axios, { AxiosResponse } from 'axios';
import { message } from 'antd';
import { CalendarInterface } from "../interface/ICalendar";
import { ListBeforeAfterTreatmentInterface } from "../interface/IBeforeAfterTreatment";
import { ListUnitInterface } from "../interface/IUnit";
import { ListStandardInterface } from "../interface/IStandard";
import { CreatePHInterface } from "../interface/IpH";
import { UpdatePHInterface } from "../interface/IpH";
import { DeletePHInterface } from "../interface/IpH";
import { CreateTDSInterface } from "../interface/ITds";
import { UpdateTDSInterface } from "../interface/ITds";
import { DeleteTDSInterface } from "../interface/ITds";

const apiUrl = "http://localhost:8000";

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

// PH
export const CreatePH = async (payload: CreatePHInterface): Promise<CreatePHInterface | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-ph`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 201) {
      message.success("บันทึกข้อมูลสำเร็จ"); // แสดงข้อความเมื่อสำเร็จ
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error creating pH:", error.response?.data || error.message);
    message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    return null;
  }
};

export const UpdatePH = async (id: number): Promise<UpdatePHInterface[] | null> => {
  try {
    const response = await axios.patch(`${apiUrl}/update-ph/${id}`, {
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
    console.error("Error updating pH:", error.response?.data || error.message);
    return null;
  }
};

export const DeletePH = async (id: number): Promise<DeletePHInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-ph/${id}`, {
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
    console.error("Error deleting pH:", error.response?.data || error.message);
    return null;
  }
};

// TDS
export const CreateTDS = async (payload: CreateTDSInterface): Promise<CreateTDSInterface | null> => {
  try {
    const response = await axios.post(`${apiUrl}/create-tds`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (response.status === 201) {
      message.success("บันทึกข้อมูลสำเร็จ"); // แสดงข้อความเมื่อสำเร็จ
      return response.data;
    } else {
      console.error("Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("Error creating TDS:", error.response?.data || error.message);
    return null;
  }
};

export const UpdateTDS = async (id: number): Promise<UpdateTDSInterface[] | null> => {
  try {
    const response = await axios.patch(`${apiUrl}/update-tds/${id}`, {
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
    console.error("Error updating TDS:", error.response?.data || error.message);
    return null;
  }
};

export const DeleteTDS = async (id: number): Promise<DeleteTDSInterface[] | null> => {
  try {
    const response = await axios.delete(`${apiUrl}/delete-tds/${id}`, {
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
    console.error("Error deleting TDS:", error.response?.data || error.message);
    return null;
  }
};

export {
  GetUsers,
};