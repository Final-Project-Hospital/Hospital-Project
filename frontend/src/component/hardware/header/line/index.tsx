import { useTranslation } from "react-i18next";
import { RiTeamLine } from "react-icons/ri";
import { MediaCard } from "../MediaCard/index";
import { useEffect, useState } from "react";
import { ListNotification } from "../../../../services/hardware";
import { NotificationInterface } from "../../../../interface/INotification";

const Line = () => {
  const { t } = useTranslation();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await ListNotification();
        if (res) {
          const notifications = res as NotificationInterface[];
          setCount(notifications.length); 
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };
    fetchCount();
  }, []);

  return (
    <MediaCard
      icon={<RiTeamLine />}
      title={count.toString()} 
      desc={t("บัญชี")}
      classNames={{ body: "p-4" }}
      style={{ backgroundColor: "#20c997", color: "#fff" }}
    />
  );
};

export default Line;
