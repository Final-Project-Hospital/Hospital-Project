// 📄 Line.tsx
import { useTranslation } from "react-i18next";
import { RiTeamLine } from "react-icons/ri";
import { MediaCard } from "../MediaCard";
import { useEffect, useState } from "react";
import { ListNotification } from "../../../../services/hardware";
import { NotificationInterface } from "../../../../interface/INotification";
import { useNotificationContext } from "../../line/NotificationContext/index";

const Line: React.FC = () => {
  const { t } = useTranslation();
  const { reloadKey } = useNotificationContext(); // ✅ ฟังสัญญาณ reload
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCount = async () => {
    try {
      setLoading(true);
      const res = await ListNotification();
      if (res) {
        const notifications = res as NotificationInterface[];
        setCount(notifications.length);
      } else {
        setCount(0);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ รีเฟรชเมื่อ mount และเมื่อ reloadKey เปลี่ยน (เช่น หลัง Create สำเร็จ)
  useEffect(() => {
    fetchCount();
  }, [reloadKey]);

  return (
    <MediaCard
      icon={<RiTeamLine />}
      title={loading ? "..." : count.toString()}
      desc={t("บัญชี")}
      classNames={{ body: "p-4" }}
      style={{ backgroundColor: "#20c997", color: "#fff" }}
    />
  );
};

export default Line;
