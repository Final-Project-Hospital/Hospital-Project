import { useTranslation } from "react-i18next";
import { MdLocationCity } from "react-icons/md"; 
import { MediaCard } from "../MediaCard/index";
import { useEffect, useState } from "react";
import { ListBuilding } from "../../../../services/hardware"; 
import { BuildingInterface } from "../../../../interface/IBuilding";

const Building = () => {
  const { t } = useTranslation();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await ListBuilding();
        if (res) {
          const buildings = res as BuildingInterface[];
          setCount(buildings.length); 
        }
      } catch (error) {
        console.error("Error fetching building count:", error);
      }
    };
    fetchCount();
  }, []);

  return (
    <MediaCard
      icon={<MdLocationCity />} // ✅ เปลี่ยน icon อาคาร
      title={count.toString()}   // ✅ จำนวนจริงจาก API
      desc={t("อาคาร")}
      style={{ backgroundColor: "#13c2c2", color: "#fff" }}
      classNames={{ body: "p-4" }}
    />
  );
};

export default Building;
