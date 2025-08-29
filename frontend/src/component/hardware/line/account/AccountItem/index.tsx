// AccountItem.tsx
import {
  Avatar,
  Badge,
  List,
  theme,
  Typography,
  message,
  Modal,
  Button,
  Form,
  Input
} from "antd";
import { NotificationInterface } from "../../../../../interface/INotification";
import {
  UpdateAlertByNotificationID,
  DeleteNotificationByID,
  UpdateNotificationByID
} from "../../../../../services/hardware";
import { useState } from "react";
import { useNotificationContext } from "../../NotificationContext";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useStateContext } from "../../../../../contexts/ContextProvider";

const { useToken } = theme;

interface AccountItemProps {
  item: NotificationInterface;
  isAdmin: boolean; // ✅ รับค่า isAdmin จาก Account.tsx
}

const AccountItem = ({ item, isAdmin }: AccountItemProps) => {
  const { token } = useToken();
  const [alert, setAlert] = useState<boolean>(item.Alert);
  const { triggerReload } = useNotificationContext();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ✅ State Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // ✅ ใช้ reloadKey ส่วนกลาง
  const { bumpReload } = useStateContext();

  // ✅ Toggle Alert
  const handleToggleAlert = async () => {
    if (!isAdmin) return; // ❌ ถ้าไม่ใช่ Admin ห้ามทำงาน
    try {
      const newAlert = !alert;
      const res = await UpdateAlertByNotificationID(item.ID, newAlert);
      if (res) {
        setAlert(res.Alert);
        triggerReload();
        bumpReload();
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
    if (!isAdmin) return; // ❌ ถ้าไม่ใช่ Admin ห้ามทำงาน
    try {
      const res = await DeleteNotificationByID(item.ID);
      if (res) {
        message.success("ลบ ข้อมูลผู้ได้รับการเเจ้งเตือน สำเร็จ");
        triggerReload();
        bumpReload();
      } else {
        message.error("ไม่สามารถลบ ข้อมูลผู้ได้รับการเเจ้งเตือน ได้");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  // ✅ Edit Notification
  const handleEdit = () => {
    if (!isAdmin) return; // ❌ ถ้าไม่ใช่ Admin ห้ามทำงาน
    form.setFieldsValue({
      Name: item.Name,
      UserID: item.UserID,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!isAdmin) return; // ❌ ถ้าไม่ใช่ Admin ห้ามทำงาน
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await UpdateNotificationByID(item.ID, {
        name: values.Name,
        user_id: values.UserID,
      });
      if (res) {
        message.success("อัปเดต ข้อมูลผู้ได้รับการเเจ้งเตือน สำเร็จ");
        setIsEditModalOpen(false);
        triggerReload();
        bumpReload();
      } else {
        message.error("ไม่สามารถอัปเดต ข้อมูลผู้ได้รับการเเจ้งเตือน ได้");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการอัปเดต");
    } finally {
      setSaving(false);
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
              <span style={{ color: token.colorLink }}>
                UserID: {item.UserID || "N/A"}
              </span>
            </Typography.Paragraph>
          }
        />

        {isAdmin && ( // ✅ แสดงปุ่มเฉพาะ Admin
          <div className="flex items-center gap-3">
            {/* Toggle Alert */}
            <div onClick={handleToggleAlert} className="cursor-pointer">
              <Badge
                count={alert ? "แจ้งเตือน" : "ไม่แจ้งเตือน"}
                color={alert ? "green" : "red"}
              />
            </div>

            {/* Edit Button */}
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={handleEdit}
              style={{
                backgroundColor: "#14b8a6",
                borderColor: "#14b8a6",
              }}
            />

            {/* Delete Button */}
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => setIsDeleteModalOpen(true)}
            />
          </div>
        )}
      </List.Item>

      {/* ✅ Modal ยืนยันการลบ */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            <span>ยืนยันการลบ ผู้ได้รับการเเจ้งเตือน</span>
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

      {/* ✅ Modal แก้ไข Notification */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-teal-600 font-bold">
            <EditOutlined /> แก้ไข ข้อมูลผู้ได้รับการเเจ้งเตือน
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        centered
        width="500px"
        footer={
          isAdmin
            ? [
                <Button key="cancel" onClick={() => setIsEditModalOpen(false)}>
                  ยกเลิก
                </Button>,
                <Button
                  key="save"
                  type="primary"
                  loading={saving}
                  onClick={handleSaveEdit}
                  style={{
                    background: "linear-gradient(to right, #14b8a6, #0d9488)",
                    borderColor: "#0d9488",
                  }}
                >
                  บันทึก
                </Button>,
              ]
            : [
                <Button key="close" onClick={() => setIsEditModalOpen(false)}>
                  ปิด
                </Button>,
              ]
        }
      >
        {isAdmin ? (
          <Form layout="vertical" form={form}>
            <Form.Item
              label={
                <span className="flex items-center gap-1">
                  <EditOutlined /> ชื่อ-สกุล
                </span>
              }
              name="Name"
              rules={[{ required: true, message: "กรุณากรอก Name" }]}
            >
              <Input placeholder="ชื่อ Notification" />
            </Form.Item>
            <Form.Item
              label={
                <span className="flex items-center gap-1">
                  <UserOutlined /> UserID
                </span>
              }
              name="UserID"
              rules={[{ required: true, message: "กรุณากรอก UserID" }]}
            >
              <Input placeholder="UserID" />
            </Form.Item>
          </Form>
        ) : (
          <p className="text-red-500">คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้</p>
        )}
      </Modal>
    </>
  );
};

export default AccountItem;
