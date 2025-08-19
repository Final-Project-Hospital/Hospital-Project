import { useTranslation } from "react-i18next";
import { MdMeetingRoom } from "react-icons/md";
import { MediaCard } from "../MediaCard/index";
import { useEffect, useState } from "react";
import { ListRoom } from "../../../../services/hardware";
import { RoomInterface } from "../../../../interface/IRoom";

interface RoomProps {
  reloadKey?: number; // ✅ รับ prop reloadKey
}

const Room: React.FC<RoomProps> = ({ reloadKey }) => {
  const { t } = useTranslation();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await ListRoom();
        if (res) {
          const rooms = res as RoomInterface[];
          setCount(rooms.length); 
        }
      } catch (error) {
        console.error("Error fetching room count:", error);
      }
    };
    fetchCount();
  }, [reloadKey]); 

  return (
    <MediaCard
      icon={<MdMeetingRoom />}
      title={count.toString()}
      desc={t("ห้อง")}
      style={{ backgroundColor: "#ffa940", color: "#fff" }}
      classNames={{ body: "p-4" }}
    />
  );
};

export default Room;
