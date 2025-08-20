import { useTranslation } from "react-i18next";
import { MdLocationCity } from "react-icons/md"; 
import { MediaCard } from "../MediaCard/index";
import { useEffect, useState } from "react";
import { ListBuilding } from "../../../../services/hardware"; 
import { BuildingInterface } from "../../../../interface/IBuilding";
import { useNotificationContext } from "../../line/NotificationContext"; // ✅ ใช้ context

const Building = () => {
  const { t } = useTranslation();
  const [count, setCount] = useState<number>(0);
  const { reloadKey } = useNotificationContext(); // ✅ ฟัง reloadKey

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
  }, [reloadKey]); 

  return (
    <MediaCard
      icon={<MdLocationCity />}
      title={count.toString()}
      desc={t("อาคาร")}
      style={{ backgroundColor: "#13c2c2", color: "#fff" }}
      classNames={{ body: "p-4" }}
    />
  );
};

export default Building;
