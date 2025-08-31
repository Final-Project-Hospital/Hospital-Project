import { useEffect } from "react";
import { TopProductsWrap } from "./average_date";

interface HardwareStat {
  id: number;
  name: string;
  popularityPercent: number;
  average: number;
  standard?: number;      // ค่ามาตรฐานสูงสุด
  standardMin?: number;   // ค่ามาตรฐานต่ำสุด
  unit?: string;
}

interface AveragedataProps {
  hardwareID: number;
  reloadKey?: any;
  onLoaded?: () => void;

  // ✅ รับข้อมูลจากพ่อ
  stats?: HardwareStat[];
  parameterColors?: Record<string, string>;
  loading?: boolean;
}

const Average: React.FC<AveragedataProps> = ({
  onLoaded,
  stats,
  parameterColors,
  loading,
}) => {
  // แจ้งพ่อว่าโหลดเสร็จเมื่อ loading=false
  useEffect(() => {
    if (!loading) onLoaded?.();
  }, [loading, onLoaded]);

  const hardwareStats = Array.isArray(stats) ? stats : [];
  const colors = parameterColors || {};

  // helper แสดงตัวเลขแบบ fix 2 ตำแหน่ง ถ้ามีค่า (รวม 0) ให้โชว์
  const renderNumberOrUnset = (val: number | undefined, unsetText: string) => {
    return typeof val === "number" && !Number.isNaN(val)
      ? <span className="text-gray-800 font-medium">{Number(val).toFixed(2)}</span>
      : <span className="text-teal-500 font-medium">{unsetText}</span>;
  };

  return (
    <TopProductsWrap>
      <div className="tbl-products overflow-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="text-left p-2">ลำดับ</th>
              <th className="text-left p-2">พารามิเตอร์ (หน่วย)</th>
              <th className="text-left p-2">ค่ามาตรฐานต่ำสุด</th>
              <th className="text-left p-2 w-[140px]">ค่ามาตรฐานสูงสุด</th>
              <th className="hidden md:table-cell text-left p-2">แถบแสดงค่าเฉลี่ย</th>
              <th className="text-left p-2">ค่าเฉลี่ย</th>
            </tr>
          </thead>
          <tbody>
            {hardwareStats.map((item, index) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: colors[item.name] || "#999999",
                      }}
                    />
                    {item.name}{" "}
                    {item.unit && <span className="text-xs text-gray-500">({item.unit})</span>}
                  </div>
                </td>

                {/* ค่ามาตรฐานต่ำสุด */}
                <td className="p-2">
                  {renderNumberOrUnset(item.standardMin, "ยังไม่กำหนดค่าต่ำสุด")}
                </td>

                {/* ค่ามาตรฐาน (สูงสุด) */}
                <td className="p-2">
                  {renderNumberOrUnset(item.standard, "ยังไม่กำหนดค่ามาตรฐาน")}
                </td>

                {/* แถบแสดงค่าเฉลี่ย */}
                <td className="hidden md:table-cell p-2">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${item.popularityPercent}%`,
                        background: colors[item.name] || "#999999",
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                </td>

                {/* ค่าเฉลี่ย */}
                <td className="p-2">
                  <div
                    className="text-white text-sm font-medium px-3 py-1 rounded-full text-center"
                    style={{
                      background: colors[item.name] || "#999999",
                      minWidth: 60,
                      display: "inline-block",
                    }}
                  >
                    {Number(item.average).toFixed(2)}
                  </div>
                </td>
              </tr>
            ))}

            {hardwareStats.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  {loading ? "กำลังโหลดข้อมูล..." : "ไม่พบข้อมูล"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </TopProductsWrap>
  );
};

export default Average;
