// ใช้กับกราฟ
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { BarChart3, LineChart, Maximize2 } from "lucide-react";
import "./infectiousWaste.css"

const InfectiousWaste: React.FC = () => {
  return (
    <div>
      <div className="Infectious-title-header">
        <div>
          <h1>Infectious-Waste</h1>
          <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
        </div>
      </div>
     <div className="Infectious-graph-container">
  {/* ฝั่งซ้าย */}
  <div className="Infectious-graph-left">
    <div className="Infectious-graph-card">กราฟขยะ</div>
    <div className="Infectious-graph-card">กราฟขยะต่อคน</div>
  </div>

  {/* ฝั่งขวา */}
  <div className="Infectious-graph-right">
    <div className="Infectious-graph-card">AADC</div>
    <div className="Infectious-small-card-container">
      <div className="Infectious-graph-card">ผลรวมขยะต่อปี</div>
      <div className="Infectious-graph-card">เฉลี่ยขยะต่อวัน</div>
    </div>
  </div>
</div>

    </div>
  );
};

export default InfectiousWaste;