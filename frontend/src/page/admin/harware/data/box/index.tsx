import { FaChartPie } from "react-icons/fa";
import { AiOutlineDotChart } from "react-icons/ai";
import { LuChartSpline } from "react-icons/lu";
import { FaTemperatureHigh } from "react-icons/fa6";
import { IoWater, IoWifi } from "react-icons/io5";
import { GiChemicalDrop, GiWifiRouter } from "react-icons/gi";
import { RiCelsiusFill } from "react-icons/ri";

const Boxs = () => {
  const temperature = 27.4;
  const humidity = 65.2;
  const status = "Online";
  const formaldehyde = 3.85;

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Formaldehyde */}
      <div className="p-5 bg-white rounded-md border border-gray-200 flex items-center gap-4 hover:bg-gray-100 transition">
        <GiChemicalDrop className="text-4xl text-purple-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-600">Formaldehyde</h3>
          <b className="text-lg">{formaldehyde} ppm</b>
        </div>
        <AiOutlineDotChart className="text-4xl text-purple-500" />
      </div>

      {/* Temperature */}
      <div className="p-5 bg-white rounded-md border border-gray-200 flex items-center gap-4 hover:bg-gray-100 transition">
        <FaTemperatureHigh className="text-4xl text-red-500" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-600">Temperature</h3>
          <b className="text-lg flex items-center">
            {temperature.toFixed(1)} <RiCelsiusFill className="ml-1 w-5 h-5" />
          </b>
        </div>
        <FaChartPie className="text-4xl text-red-500" />
      </div>

      {/* Humidity */}
      <div className="p-5 bg-white rounded-md border border-gray-200 flex items-center gap-4 hover:bg-gray-100 transition">
        <IoWater className="text-4xl text-blue-500" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-600">Humidity</h3>
          <b className="text-lg">{humidity.toFixed(1)}%</b>
        </div>
        <LuChartSpline className="text-4xl text-blue-500" />
      </div>

      {/* Status */}
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

export default Boxs;
