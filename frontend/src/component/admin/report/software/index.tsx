import React, { useEffect } from "react";
import NotificationItem from "../NotificationItem";

interface Props {
  onCountChange?: (count: number) => void;
}

const mockSoftwareNotifications = [
  {
    id: 1,
    title: "Login Failed",
    description: "ตรวจพบความพยายามเข้าสู่ระบบจาก IP 192.168.1.99",
  },
  {
    id: 2,
    title: "Service Crash",
    description: "พบการหยุดทำงานของ Service API เวลา 09:45 น.",
  },
];

const NotificationSoftware: React.FC<Props> = ({ onCountChange }) => {
  useEffect(() => {
    onCountChange?.(mockSoftwareNotifications.length);
  }, [onCountChange]);

  return (
    <div className="p-2" style={{ maxHeight: "300px", overflowY: "auto" }}>
      {mockSoftwareNotifications.length > 0 ? (
        mockSoftwareNotifications.map((item) => (
          <NotificationItem
            key={item.id}
            title={item.title}
            description={item.description}
          />
        ))
      ) : (
        <div className="text-center text-gray-400 py-10">
          No new notifications
        </div>
      )}
    </div>
  );
};

export default NotificationSoftware;
