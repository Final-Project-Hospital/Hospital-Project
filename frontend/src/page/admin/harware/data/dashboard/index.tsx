import picture1 from "../../../../../assets/ESP32.png";
import Boxsdata from "../box/index";
import TableData from "../table/index"
import Avergare from "../footer/index";
import LineChart from "../chart/index"

const Index = () => {
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
        <Boxsdata />
      </section>

      <div>
        <TableData />
      </div>

      <div>
        <LineChart />
      </div>
      <br />
      <div>
        <Avergare />
      </div>

    </>
  );
};

export default Index;
