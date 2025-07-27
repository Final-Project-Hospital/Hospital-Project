import React, { ReactNode, useEffect, useState } from "react";
import {
  FaChartPie,
  FaTemperatureHigh
} from "react-icons/fa";
import { AiOutlineDotChart, AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { LuChartSpline } from "react-icons/lu";
import { IoWater } from "react-icons/io5";
import { GiChemicalDrop } from "react-icons/gi";
import { RiCelsiusFill } from "react-icons/ri";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
  ListDataHardwareParameterByParameter
} from "../../../../../services/hardware";

const iconMap: Record<string, [ReactNode, ReactNode]> = {
  Formaldehyde: [
    <GiChemicalDrop className="text-4xl" />,
    <AiOutlineDotChart className="text-4xl" />
  ],
  Temperature: [
    <FaTemperatureHigh className="text-4xl" />,
    <FaChartPie className="text-4xl" />
  ],
  Humidity: [
    <IoWater className="text-4xl" />,
    <LuChartSpline className="text-4xl" />
  ],
};

interface BoxsdataProps {
  hardwareID: number;
  reloadKey?: any;
  onLoaded?: () => void; // เพิ่มตรงนี้
}
interface SensorParameter {
  id: number;
  name: string;
  value: number;
}
interface ParameterColorMap {
  [parameter: string]: string;
}
const MAX_SHOW = 4;

const Boxsdata: React.FC<BoxsdataProps> = ({ hardwareID, reloadKey, onLoaded }) => {
  const [parameters, setParameters] = useState<SensorParameter[]>([]);
  const [parameterColors, setParameterColors] = useState<ParameterColorMap>({});
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setParameterColors({});
    setParameters([]);
    setSlideIndex(0);
  }, [hardwareID, reloadKey]);

  useEffect(() => {
    let mounted = true;
    const fetchSensorAndParameters = async () => {
      setLoading(true);
      if (!hardwareID) {
        setLoading(false);
        onLoaded?.();
        return;
      }
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
              value: Number(param.Data),
            });
          });
          const latestParamsArray = Array.from(latestParamsMap.values());
          if (mounted) setParameters(latestParamsArray);

          const colorsMap: ParameterColorMap = {};
          await Promise.all(
            latestParamsArray.map(async (p) => {
              const res = await ListDataHardwareParameterByParameter(p.name);
              if (res && res.length > 0) {
                colorsMap[p.name] = res[0].HardwareParameterColor?.Code || "#999999";
              } else {
                colorsMap[p.name] = "#999999";
              }
            })
          );
          if (mounted) setParameterColors(colorsMap);
        } else {
          if (mounted) setParameters([]);
        }
      } else {
        if (mounted) setParameters([]);
      }
      setLoading(false);
      onLoaded?.(); // <<< ตรงนี้
    };

    fetchSensorAndParameters();
    return () => {
      mounted = false;
    };
  }, [hardwareID, reloadKey, onLoaded]);

  function withIconColor(icon: ReactNode, color: string): ReactNode {
    if (React.isValidElement(icon)) {
      const elem = icon as React.ReactElement<any, any>;
      const style = elem.props && typeof elem.props === "object" && "style" in elem.props
        ? elem.props.style
        : {};
      return React.cloneElement(elem, {
        style: { ...style, color, fontSize: "2rem" }
      });
    }
    return icon;
  }

  const totalSlide = parameters.length > MAX_SHOW ? Math.ceil(parameters.length / MAX_SHOW) : 1;
  const showParams = parameters.slice(slideIndex * MAX_SHOW, slideIndex * MAX_SHOW + MAX_SHOW);

  const handlePrev = () => {
    setSlideIndex(slideIndex === 0 ? totalSlide - 1 : slideIndex - 1);
  };
  const handleNext = () => {
    setSlideIndex(slideIndex === totalSlide - 1 ? 0 : slideIndex + 1);
  };

  return (
    <div className="w-full px-1">
      <div className="flex flex-col items-center">
        <div className="flex items-center w-full">
          {totalSlide > 1 && (
            <button
              onClick={handlePrev}
              className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-gray-200 shadow items-center justify-center transition hover:bg-blue-50 active:scale-95 active:bg-blue-100 text-blue-500 hover:text-blue-700 mr-2"
              aria-label="Slide Left"
            >
              <AiOutlineLeft size={22} />
            </button>
          )}
          <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-4 flex justify-center items-center min-h-[110px]">
                <p>Loading data...</p>
              </div>
            ) : showParams.length > 0 ? (
              showParams.map((param) => {
                const color = parameterColors[param.name] || "#999999";
                return (
                  <div
                    key={param.id}
                    className="flex flex-col items-center justify-center bg-white border-2 rounded-2xl shadow-sm h-[100px] min-h-[110px] w-full transition hover:bg-gray-50"
                    style={{ borderColor: color, minWidth: 0 }}
                  >
                    <div>
                      {withIconColor(iconMap[param.name]?.[0] || <GiChemicalDrop className="text-4xl" />, color)}
                    </div>
                    <div className="text-center mt-1">
                      <h3 className="text-sm font-semibold text-gray-700">{param.name}</h3>
                      <b className="text-xl flex items-center justify-center mt-1">
                        {param.value.toFixed(2)}
                        {param.name === "Temperature" && <RiCelsiusFill className="ml-1 w-5 h-5" />}
                        {param.name === "Formaldehyde" && " ppm"}
                        {param.name === "Humidity" && "%"}
                      </b>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 flex justify-center items-center min-h-[110px]">
                <p>No data</p>
              </div>
            )}
          </div>
          {totalSlide > 1 && (
            <button
              onClick={handleNext}
              className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-gray-200 shadow items-center justify-center transition hover:bg-blue-50 active:scale-95 active:bg-blue-100 text-blue-500 hover:text-blue-700 ml-2"
              aria-label="Slide Right"
            >
              <AiOutlineRight size={22} />
            </button>
          )}
        </div>
        <div className="flex justify-center items-center gap-3 mt-2 sm:hidden">
          {totalSlide > 1 && (
            <>
              <button onClick={handlePrev} className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-blue-500">
                <AiOutlineLeft size={22} />
              </button>
              <span className="text-xs text-gray-500">
                {slideIndex + 1} / {totalSlide}
              </span>
              <button onClick={handleNext} className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-blue-500">
                <AiOutlineRight size={22} />
              </button>
            </>
          )}
        </div>
        {totalSlide > 1 && (
          <div className="hidden sm:block text-center mt-3 text-xs text-gray-500">
            {slideIndex + 1} / {totalSlide}
          </div>
        )}
      </div>
    </div>
  );
};

export default Boxsdata;
