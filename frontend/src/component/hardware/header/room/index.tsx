import { useTranslation } from "react-i18next";
import { MdMeetingRoom } from "react-icons/md";
import { MediaCard } from "../MediaCard/index";
import { useEffect, useState } from "react";
import { ListRoom } from "../../../../services/hardware";
import { RoomInterface } from "../../../../interface/IRoom";

const Room = () => {
  const { t } = useTranslation();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await ListRoom();
        if (res) {
          const rooms = res as RoomInterface[];
          setCount(rooms.length); // ✅ นับจำนวนห้อง
        }
      } catch (error) {
        console.error("Error fetching room count:", error);
      }
    };
    fetchCount();
  }, []);

  return (
    <MediaCard
      icon={<MdMeetingRoom  />}
      title={count.toString()} // ✅ ใช้จำนวนห้องจริง
      desc={t("ห้อง")}
      style={{ backgroundColor: "#ffa940", color: "#fff" }}
      classNames={{ body: "p-4" }}
    />
  );
};

export default Room;
