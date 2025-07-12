import React, { ReactNode, useEffect, useState } from "react";
import {
  FaChartPie,
  FaTemperatureHigh
} from "react-icons/fa";
import { AiOutlineDotChart } from "react-icons/ai";
import { LuChartSpline } from "react-icons/lu";
import { IoWater, IoWifi } from "react-icons/io5";
import { GiChemicalDrop, GiWifiRouter } from "react-icons/gi";
import { RiCelsiusFill } from "react-icons/ri";

import { GetSensorDataByHardwareID, GetSensorDataParametersBySensorDataID } from "../../../../../services/hardware";

interface BoxsdataProps {
  hardwareID: number;
}

interface SensorParameter {
  id: number;
  name: string;
  value: number;
}

// แก้จาก JSX.Element เป็น ReactNode และลบ key ออกจากตรงนี้ (key ต้องใส่ที่ JSX map ด้านนอก)
const iconMap: Record<string, [ReactNode, ReactNode]> = {
  Formaldehyde: [
    <GiChemicalDrop className="text-4xl text-purple-600" />,
    <AiOutlineDotChart className="text-4xl text-purple-500" />
  ],
  Temperature: [
    <FaTemperatureHigh className="text-4xl text-red-500" />,
    <FaChartPie className="text-4xl text-red-500" />
  ],
  Humidity: [
    <IoWater className="text-4xl text-blue-500" />,
    <LuChartSpline className="text-4xl text-blue-500" />
  ],
  Status: [
    <IoWifi className="text-4xl text-gray-500" />,
    <GiWifiRouter className="text-4xl text-gray-500" />
  ],
};

const Boxsdata: React.FC<BoxsdataProps> = ({ hardwareID }) => {
  const [parameters, setParameters] = useState<SensorParameter[]>([]);//@ts-ignore
  const [status, setStatus] = useState("Online");

  useEffect(() => {
    const fetchSensorAndParameters = async () => {
      if (!hardwareID) return;

      const sensorDataList = await GetSensorDataByHardwareID(hardwareID);

      if (sensorDataList && sensorDataList.length > 0) {
        const latestSensorDataID = sensorDataList[sensorDataList.length - 1].ID;

        const params = await GetSensorDataParametersBySensorDataID(latestSensorDataID);

        if (params && params.length > 0) {
          const latestParamsMap = new Map<string, SensorParameter>();

          params.forEach((param: any) => {
            const paramName = param.HardwareParameter?.Parameter || "Unknown";
            latestParamsMap.set(paramName, {
              id: param.ParameterID,
              name: paramName,
              value: param.Data,
            });
          });

          const latestParamsArray = Array.from(latestParamsMap.values());
          setParameters(latestParamsArray);
        }
      }
    };

    fetchSensorAndParameters();
  }, [hardwareID]);

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {parameters.length > 0 ? (
        parameters.map((param) => (
          <div
            key={param.id}
            className="p-5 bg-white rounded-md border border-gray-200 flex items-center gap-4 hover:bg-gray-100 transition"
          >
            <div className="flex flex-col justify-center items-center gap-2">
              {iconMap[param.name]?.[0] || <GiChemicalDrop className="text-4xl text-gray-600" />}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-600">{param.name}</h3>
              <b className="text-lg flex items-center">
                {param.value.toFixed(2)}
                {param.name === "Temperature" && <RiCelsiusFill className="ml-1 w-5 h-5" />}
                {param.name === "Formaldehyde" && " ppm"}
                {param.name === "Humidity" && "%"}
              </b>
            </div>
            <div className="flex flex-col justify-center items-center gap-2">
              {iconMap[param.name]?.[1] || <AiOutlineDotChart className="text-4xl text-gray-400" />}
            </div>
          </div>
        ))
      ) : (
        <p>Loading data...</p>
      )}

      {/* Status card แยกไว้ */}
      <div className="p-5 bg-white rounded-md border border-gray-200 flex items-center gap-4 hover:bg-gray-100 transition">
        <IoWifi className="text-4xl text-gray-500" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-600">Status</h3>
          <b className="text-lg">{status}</b>
        </div>
        <GiWifiRouter className="text-4xl text-gray-500" />
      </div>
    </div>
  );
};

export default Boxsdata;
