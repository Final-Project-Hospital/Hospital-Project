import { Avatar, Badge, List, theme, Typography, message, Modal, Button } from "antd";
import { NotificationInterface } from "../../../../../interface/INotification";
import { UpdateAlertByNotificationID, DeleteNotificationByID } from "../../../../../services/hardware";
import { useState } from "react";
import { useNotificationContext } from "../../NotificationContext";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const { useToken } = theme;

const AccountItem = ({ item }: { item: NotificationInterface }) => {
  const { token } = useToken();
  const [alert, setAlert] = useState<boolean>(item.Alert);
  const { triggerReload } = useNotificationContext();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ✅ Toggle Alert
  const handleToggleAlert = async () => {
    try {
      const newAlert = !alert;
      const res = await UpdateAlertByNotificationID(item.ID, newAlert);
      if (res) {
        setAlert(res.Alert);
        triggerReload(); // refresh list
        message.success(
          `อัปเดตสถานะเรียบร้อย: ${res.Alert ? "แจ้งเตือน" : "ไม่แจ้งเตือน"}`
        );
      } else {
        message.error("ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  // ✅ Delete Notification
  const handleDelete = async () => {
    try {
      const res = await DeleteNotificationByID(item.ID);
      if (res) {
        message.success("ลบ Notification สำเร็จ");
        triggerReload(); // refresh list
      } else {
        message.error("ไม่สามารถลบ Notification ได้");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <List.Item
        key={item.ID}
        className="cursor-pointer flex justify-between items-center"
      >
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
            <Typography.Paragraph
              type={"secondary"}
              className="text-xs m-0"
            >
              <span
                style={{ color: token.colorLink }}
                className="cursor-pointer"
              >
                UserID: {item.UserID || "N/A"}
              </span>
            </Typography.Paragraph>
          }
        />

        <div className="flex items-center gap-3">
          {/* Toggle Alert */}
          <div onClick={handleToggleAlert} className="cursor-pointer">
            <Badge
              count={alert ? "แจ้งเตือน" : "ไม่แจ้งเตือน"}
              color={alert ? "green" : "red"}
            />
          </div>

          {/* Delete Button */}
          <Button
            danger
            type="primary"
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => setIsDeleteModalOpen(true)}
          />
        </div>
      </List.Item>

      {/* ✅ Modal ยืนยันการลบ */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            <span>ยืนยันการลบ Notification</span>
          </div>
        }
        open={isDeleteModalOpen}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="ลบ"
        cancelText="ยกเลิก"
        centered
        okButtonProps={{ danger: true }}
      >
        <p>
          คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
          <b style={{ color: token.colorError }}>{item.Name || "ไม่มีชื่อ"}</b> ?
        </p>
      </Modal>
    </>
  );
};

export default AccountItem;
