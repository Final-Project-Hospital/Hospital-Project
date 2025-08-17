import { useTranslation } from "react-i18next";
import { FaMicrochip } from "react-icons/fa";
import { MediaCard } from "../MediaCard/index";
import { useEffect, useState } from "react";
import { ListHardware } from "../../../../services/hardware";
import { HardwareInterface } from "../../../../interface/IHardware";

const Node = () => {
  const { t } = useTranslation();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await ListHardware();
        if (res) {
          const hardwares = res as HardwareInterface[];
          setCount(hardwares.length); 
        }
      } catch (error) {
        console.error("Error fetching hardware count:", error);
      }
    };
    fetchCount();
  }, []);

  return (
    <MediaCard
      icon={<FaMicrochip />} // ✅ ใช้ icon sensor
      title={count.toString()} // ✅ จำนวนจริงจาก API
      desc={t("อุปกรณ์ที่ติดตั้ง")}
      style={{ backgroundColor: "#ff4d4f", color: "#fff" }}
      classNames={{ body: "p-4" }}
    />
  );
};

export default Node;
