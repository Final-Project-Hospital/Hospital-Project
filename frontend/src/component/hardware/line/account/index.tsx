import { Card, List, Spin } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AccountItem from "./AccountItem";
import { ListNotification } from "../../../../services/hardware";
import { NotificationInterface } from "../../../../interface/INotification";
import { useNotificationContext } from "../NotificationContext"; // ✅ ใช้ context

const Account = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { reloadKey } = useNotificationContext(); // ✅ ใช้ reloadKey

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const res = await ListNotification();
      if (res) {
        setNotifications(res);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [reloadKey]); // ✅ โหลดใหม่เมื่อ reloadKey เปลี่ยน

  return (
    <Card
      title={t("บัญชีทั้งหมด")}
      style={{height: "100%"}}
      classNames={{ body: "p-0 pb-6", header: "border-0" }}
    >
      <div className="max-h-60 px-2 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <Spin />
          </div>
        ) : (
          <List
            size="small"
            split={false}
            dataSource={notifications}
            renderItem={(item) => <AccountItem item={item} />}
            className="[&_.ant-list-item-meta-title]:font-normal"
          />
        )}
      </div>
    </Card>
  );
};

export default Account;
