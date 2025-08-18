import { Avatar, Badge, List, theme, Typography, message } from "antd";
import { NotificationInterface } from "../../../../../interface/INotification";
import { UpdateAlertByNotificationID } from "../../../../../services/hardware";
import { useState } from "react";
import { useNotificationContext } from "../../NotificationContext";

const { useToken } = theme;

const AccountItem = ({ item }: { item: NotificationInterface }) => {
  const { token } = useToken();
  const [alert, setAlert] = useState<boolean>(item.Alert);
  const { triggerReload } = useNotificationContext();

  const handleToggleAlert = async () => {
    try {
      const newAlert = !alert;
      const res = await UpdateAlertByNotificationID(item.ID, newAlert);
      if (res) {
        setAlert(res.Alert);
        triggerReload(); // ✅ สั่ง reload graph
        message.success(
          `อัปเดตสถานะเรียบร้อย: ${
            res.Alert ? "แจ้งเตือน" : "ไม่แจ้งเตือน"
          }`
        );
      } else {
        message.error("ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  return (
    <List.Item key={item.ID} className="cursor-pointer">
      <List.Item.Meta
        avatar={
          item.UserID ? (
            <Avatar
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${item.UserID}`}
              size={40}
            />
          ) : (
            <Avatar src="https://via.placeholder.com/40" size={40} />
          )
        }
        title={
          <>
            {item.Name || "No name"}{" "}
            <span className="text-xs text-gray-500">
              {"created at"}{" "}
              {item.CreatedAt
                ? new Date(item.CreatedAt).toLocaleString()
                : "Unknown"}
            </span>
          </>
        }
        description={
          <Typography.Paragraph type={"secondary"} className="text-xs m-0">
            <span
              style={{ color: token.colorLink }}
              className="cursor-pointer"
            >
              UserID: {item.UserID || "N/A"}
            </span>
          </Typography.Paragraph>
        }
      />
      <div onClick={handleToggleAlert} className="cursor-pointer">
        <Badge
          count={alert ? "แจ้งเตือน" : "ไม่แจ้งเตือน"}
          color={alert ? "green" : "red"}
        />
      </div>
    </List.Item>
  );
};

export default AccountItem;
