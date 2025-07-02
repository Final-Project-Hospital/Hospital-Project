import picture1 from "../../../../../assets/ESP32.png";
import Boxsdata from "../box/index";
import TableData from "../table/index";
import Avergare from "../footer/index";
import LineChart from "../chart/index";
import { useLocation } from 'react-router-dom';
import { useEffect } from "react";

const Index = () => {
  const location = useLocation();
  const { hardwareID } = location.state || {};

  useEffect(() => {
    console.log("HardwareID:", hardwareID);
  }, [hardwareID]);

  return (
    <>
      <section className="max-w-screen-2xl mx-auto p-5 bg-white border border-gray-200 rounded-lg shadow-md mb-8 mt-24 md:mt-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight mb-4">
            Good Morning
            <br />
            <span className="inline-flex items-center gap-2 text-teal-700 justify-center md:justify-start">
              Environmental Engineering
            </span>
          </h1>
          <p className="text-xs md:text-base text-gray-700 mb-6 max-w-xl mx-auto md:mx-0">
            Environmental engineers monitor temperature, humidity, and formaldehyde levels to assess air quality and ensure a safe and healthy environment!
          </p>
        </div>

        <img
          src={picture1}
          alt="ESP32 Hardware"
          className="w-36 md:w-60 max-w-full object-contain mx-auto md:mx-0"
        />
      </section>

      <section>
        <Boxsdata hardwareID={hardwareID} />
      </section>

      <div>
        <TableData hardwareID={hardwareID}/>
      </div>

      {/* บรรจุ 2 กราฟให้อยู่ข้างกัน */}
      <div className="flex flex-col md:flex-row gap-6 max-w-full overflow-x-auto p-1">
        <div className="flex-1 bg-white p-4 rounded shadow min-w-[320px]">
          <LineChart />
        </div>
        <div className="flex-1 bg-white p-4 rounded shadow min-w-[320px]">
          <LineChart />
        </div>
      </div>

      <br />

      <div>
        <Avergare hardwareID={hardwareID} />
      </div>
    </>
  );
};

export default Index;
