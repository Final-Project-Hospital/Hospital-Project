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

const AccountItem = ({ item }: { item: NotificationInterface }) => {
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
    try {
      const newAlert = !alert;
      const res = await UpdateAlertByNotificationID(item.ID, newAlert);
      if (res) {
        setAlert(res.Alert);
        triggerReload();
        bumpReload(); // ✅ ให้กราฟ/ตารางที่พึ่งพา reloadKey รีเฟรชด้วย
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
        message.success("ลบ ข้อมูลผู้ได้รับการเเจ้งเตื่อน สำเร็จ");
        triggerReload();
        bumpReload(); // ✅ จุดสำคัญ: กระตุ้นรีโหลดให้ RoomAdminTable/MainLine
      } else {
        message.error("ไม่สามารถลบ ข้อมูลผู้ได้รับการเเจ้งเตื่อน ได้");
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
    form.setFieldsValue({
      Name: item.Name,
      UserID: item.UserID,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await UpdateNotificationByID(item.ID, {
        name: values.Name,        // 👈 ต้องส่งเป็น name
        user_id: values.UserID,   // 👈 ต้องส่งเป็น user_id
      });
      if (res) {
        message.success("อัปเดต ข้อมูลผู้ได้รับการเเจ้งเตื่อน สำเร็จ");
        setIsEditModalOpen(false);
        triggerReload();
        bumpReload(); // ✅ อัปเดตแล้วก็รีโหลดได้เช่นกัน
      } else {
        message.error("ไม่สามารถอัปเดต ข้อมูลผู้ได้รับการเเจ้งเตื่อน ได้");
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
              <span
                style={{ color: token.colorLink }}
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
      </List.Item>

      {/* ✅ Modal ยืนยันการลบ */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            <span>ยืนยันการลบ ผู้ได้รับการเเจ้งเตื่อน</span>
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
            <EditOutlined /> แก้ไข ข้อมูลผู้ได้รับการเเจ้งเตื่อน
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        centered
        width="500px"
        footer={[
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
        ]}
      >
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
      </Modal>
    </>
  );
};

export default AccountItem;
