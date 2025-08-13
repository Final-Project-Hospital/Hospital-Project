import React, { ReactNode, useEffect, useState } from "react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
  ListHardwareParameterIDsByHardwareID,
} from "../../../../../services/hardware";

import * as GiIcons from "react-icons/gi";
import * as FaIcons from "react-icons/fa";
import * as IoIcons from "react-icons/io5";
import * as AiIcons from "react-icons/ai";
import * as LuIcons from "react-icons/lu";
import * as RiIcons from "react-icons/ri";

function getIconComponentByName(name: string): ReactNode {
  const allIcons = {
    ...GiIcons,
    ...FaIcons,
    ...IoIcons,
    ...AiIcons,
    ...LuIcons,
    ...RiIcons,
  };
  const IconComponent = allIcons[name as keyof typeof allIcons];
  return IconComponent ? <IconComponent className="text-4xl" /> : <GiIcons.GiChemicalDrop className="text-4xl" />;
}

interface BoxsdataProps {
  hardwareID: number;
  reloadKey?: any;
  onLoaded?: () => void;
}

interface SensorParameter {
  id: number;
  name: string;
  value: number;
}

interface ParameterMeta {
  color: string;
  unit?: string;
  standard?: number;
  icon?: string;
}

interface ParameterColorMap {
  [parameter: string]: ParameterMeta;
}

interface HardwareParameterWithColor {
  id: number;
  parameter: string;
  graph_id: number;
  graph: string;
  color?: string;
  unit?: string;
  standard?: number;
  icon?: string;
  Icon?: string;
}

interface ListHardwareParameterResponse {
  hardware_id: string;
  parameters: HardwareParameterWithColor[];
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

      const [sensorDataListRaw, paramInfoRaw] = await Promise.all([
        GetSensorDataByHardwareID(hardwareID),
        ListHardwareParameterIDsByHardwareID(hardwareID),
      ]);

      const sensorDataList: any[] = sensorDataListRaw || [];
      const paramInfo: ListHardwareParameterResponse = paramInfoRaw || {
        hardware_id: String(hardwareID),
        parameters: [],
      };

      const colorsMap: ParameterColorMap = {};
      if (paramInfo?.parameters) {
        for (const p of paramInfo.parameters) {
          colorsMap[p.parameter.toLowerCase()] = {
            color: p.color || "#999999",
            unit: p.unit || "",
            standard: p.standard,
            icon: p.icon || "",
          };
        }
        if (mounted) setParameterColors(colorsMap);
      }

      if (sensorDataList.length > 0) {
        const latestSensorDataID = sensorDataList[sensorDataList.length - 1].ID;
        const params = await GetSensorDataParametersBySensorDataID(latestSensorDataID);
        if (params && params.length > 0) {
          const latestParamsMap = new Map<string, SensorParameter>();
          params.forEach((param: any) => {
            const paramName = (param.HardwareParameter?.Parameter || "Unknown");
            latestParamsMap.set(paramName, {
              id: param.ParameterID,
              name: paramName,
              value: Number(param.Data),
            });
          });

          const latestParamsArray = Array.from(latestParamsMap.values());
          if (mounted) setParameters(latestParamsArray);
        } else {
          if (mounted) setParameters([]);
        }
      } else {
        if (mounted) setParameters([]);
      }

      setLoading(false);
      onLoaded?.();
    };

    fetchSensorAndParameters();
    return () => {
      mounted = false;
    };
  }, [hardwareID, reloadKey, onLoaded]);

  function withIconColor(icon: ReactNode, color: string): ReactNode {
    if (React.isValidElement(icon)) {
      const elem = icon as React.ReactElement<any, any>;
      const style = elem.props && typeof elem.props === "object" && "style" in elem.props ? elem.props.style : {};
      return React.cloneElement(elem, {
        style: { ...style, color, fontSize: "2rem" },
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

  const getValueColor = (value: number, standard?: number): string => {
    if (standard === undefined || standard === 0) return "text-black";
    const thresholdOrange = standard * 0.9;
    if (value >= standard) return "text-red-500";
    if (value >= thresholdOrange) return "text-orange-500";
    return "text-black";
  };

  return (
    <div className="w-full px-1">
      <div className="flex flex-col items-center">
        <div className="flex items-center w-full">
          {totalSlide > 1 && (
            <button onClick={handlePrev} className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-gray-200 shadow items-center justify-center text-blue-500 hover:text-blue-700 mr-2">
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
                const meta = parameterColors[param.name.toLowerCase()] || {
                  color: "#999999",
                  unit: "",
                  standard: undefined,
                  icon: "",
                };
                const color = meta.color;
                const unit = meta.unit || "";
                const standard = meta.standard;
                const icon = getIconComponentByName(meta.icon || "GiChemicalDrop");
                return (
                  <div key={param.id} className="flex flex-col items-center justify-center bg-white border-2 rounded-2xl shadow-sm h-[100px] min-h-[110px] w-full transition hover:bg-gray-50" style={{ borderColor: color }}>
                    <div>{withIconColor(icon, color)}</div>
                    <div className="text-center mt-1">
                      <h3 className="text-sm font-semibold text-gray-700">{param.name}</h3>
                      <b className={`text-xl flex items-center justify-center mt-1 ${getValueColor(param.value, standard)}`}>
                        {param.value.toFixed(2)} {unit}
                      </b>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 flex justify-center items-center min-h-[110px]">
                <p className="text-center text-gray-500 font-semibold">ไม่พบข้อมูล</p>
              </div>
            )}
          </div>

          {totalSlide > 1 && (
            <button onClick={handleNext} className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-gray-200 shadow items-center justify-center text-blue-500 hover:text-blue-700 ml-2">
              <AiOutlineRight size={22} />
            </button>
          )}
        </div>

        {totalSlide > 1 && (
          <>
            <div className="flex justify-center items-center gap-3 mt-2 sm:hidden">
              <button onClick={handlePrev} className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-blue-500">
                <AiOutlineLeft size={22} />
              </button>
              <span className="text-xs text-gray-500">{slideIndex + 1} / {totalSlide}</span>
              <button onClick={handleNext} className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-blue-500">
                <AiOutlineRight size={22} />
              </button>
            </div>
            <div className="hidden sm:block text-center mt-3 text-xs text-gray-500">
              {slideIndex + 1} / {totalSlide}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Boxsdata;
