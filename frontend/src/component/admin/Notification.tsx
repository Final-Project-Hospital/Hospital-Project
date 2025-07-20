import { MdOutlineCancel } from "react-icons/md";
import { useStateContext } from "../../contexts/ContextProvider";

const mockReports = [
  {
    ID: 1,
    Title: "Temperature Over Limit",
    Description: "อุณหภูมิสูงเกิน 30°C ที่ห้อง 202 อาคารวิจัย เมื่อ 09:15 น.",
  },
  {
    ID: 2,
    Title: "Humidity Over Limit",
    Description: "ความชื้นสัมพัทธ์เกิน 85% ที่ห้องแล็บชั้น 3 อาคาร A เมื่อ 13:42 น.",
  },
  {
    ID: 3,
    Title: "Formaldehyde Over Limit",
    Description: "ตรวจพบค่า Formaldehyde 0.14 ppm (เกินมาตรฐาน) ที่ห้องเก็บตัวอย่าง อาคาร B เวลา 10:27 น.",
  },
  {
    ID: 4,
    Title: "Temperature Drop Below Limit",
    Description: "อุณหภูมิต่ำกว่าค่ากำหนด 15°C ในห้องเซิร์ฟเวอร์ อาคาร C เมื่อ 04:20 น.",
  },
  {
    ID: 5,
    Title: "Formaldehyde Stable",
    Description: "ค่า Formaldehyde กลับสู่ระดับปลอดภัยที่ห้องประชุม อาคาร D เวลา 16:10 น.",
  },
];


const Notification = () => { //@ts-ignore
  const [reports] = [mockReports]; 
  const { handleClick } = useStateContext();

  return (
    <div className="z-50 nav-item absolute right-5 md:right-40 top-16 bg-white p-8 rounded-lg w-96 shadow">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <p className="font-semibold text-lg">Report Notifications</p>
          <span
            className="flex items-center justify-center h-6 text-white text-xs rounded-full px-3 py-1 font-semibold bg-gradient-to-r from-teal-500 to-cyan-400 shadow-sm"
            style={{
              backgroundImage: "linear-gradient(to right, #14b8a6, #22d3ee)",
            }}
          >
            {mockReports.length} massage
          </span>
        </div>
        <button
          type="button"
          className="text-gray-400 hover:bg-gray-100 rounded-full p-2 transition"
          onClick={() => handleClick("notification")}
          aria-label="Close"
        >
          <MdOutlineCancel size={24} />
        </button>
      </div>

      <div className="mt-5" style={{ maxHeight: "350px", overflowY: "auto" }}>
        {mockReports.map((item, index) => (
          <div key={index} className="flex gap-5 border-b p-3 items-start">
            <div className="flex flex-col w-full">
              <div
                className="font-semibold text-xs rounded-full px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-400 text-white w-fit shadow-sm"
                style={{
                  backgroundImage: "linear-gradient(to right, #14b8a6, #22d3ee)",
                }}
              >
                {item.Title}
              </div>
              <p className="text-gray-500 text-sm mt-1">{item.Description}</p>
            </div>
          </div>
        ))}
        {mockReports.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            No new notifications
          </div>
        )}
      </div>
    </div>
  );
};

export { Notification };
