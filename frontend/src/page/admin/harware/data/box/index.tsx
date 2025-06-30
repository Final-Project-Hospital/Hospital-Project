import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
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
    <>
      <Swiper
        slidesPerView={4}
        spaceBetween={10}
        navigation={true}
        modules={[Navigation]}
        className="dashboardboxesSlider"
      >
        <SwiperSlide>
          <div className='box p-5 cursor-pointer hover:bg-[#f1f1f1] bg-white rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4'>
            <GiChemicalDrop className='text-[40px] text-purple-600'/>
            <div className='info w-[70%]'>
              <h3>Formaldehyde</h3>
              <b>{formaldehyde} ppm</b>
            </div>
            <AiOutlineDotChart className='text-[40px] text-purple-500'/>
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className='box p-5 cursor-pointer bg-white hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4'>
            <FaTemperatureHigh className='text-[40px] text-red-500'/>
            <div className='info w-[70%]'>
              <h3>Temperature</h3>
              <b className='flex'>
                {temperature.toFixed(1)} 
                <RiCelsiusFill className='w-[32px] h-[18px] mt-[3px]'/>
              </b>
            </div>
            <FaChartPie className='text-[40px] text-red-500'/>
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className='box p-5 cursor-pointer bg-white hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4'>
            <IoWater className='text-[40px] text-blue-500'/>
            <div className='info w-[70%]'>
              <h3>Humidity</h3>
              <b>{humidity.toFixed(1)} %</b>
            </div>
            <LuChartSpline className='text-[40px] text-blue-500'/>
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className='box p-5 cursor-pointer bg-white hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4'>
            <IoWifi className='text-[40px] text-gray-500'/>
            <div className='info w-[70%]'>
              <h3>Status</h3>
              <b>{status}</b> 
            </div>
            <GiWifiRouter className='text-[40px] text-gray-500'/>
          </div>
        </SwiperSlide>
      </Swiper>
    </>
  );
};

export default Boxs;
