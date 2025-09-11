import { 
  Card, 
  List, 
  Spin, 
  Modal, 
  Button, 
  Input, 
  message, 
  Form 
} from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AccountItem from "./AccountItem";
import { ListNotification } from "../../../../services/hardware";
import { NotificationInterface } from "../../../../interface/INotification";
import { useNotificationContext } from "../NotificationContext";
import {
  GetLineMasterFirst,
  UpdateLineMasterByID,
  CreateNotification,
  IsEmployeePasswordValid, // ✅ ใช้จาก services/hardware ตามที่ให้มา
} from "../../../../services/hardware";
import { LineMasterInterface } from "../../../../interface/ILineMaster";
import { GetUserDataByUserID } from "../../../../services/httpLogin"; 
import { UsersInterface } from "../../../../interface/IUser"; 

// ✅ Icons
import { 
  PlusOutlined, 
  BellOutlined, 
  EditOutlined, 
  UserOutlined, 
  KeyOutlined 
} from "@ant-design/icons";

const { TextArea } = Input;

const EMPLOYEE_ID_FOR_VERIFY = 1; // ✅ ตรวจรหัสด้วยพนักงาน id = 1

const Account = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ Modal LINE Token
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lineMaster, setLineMaster] = useState<LineMasterInterface | null>(null);
  const [loadingToken, setLoadingToken] = useState<boolean>(false);
  const [newToken, setNewToken] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [tokenPassword, setTokenPassword] = useState<string>(""); // ✅ รหัสยืนยันใต้ช่อง Token

  // ✅ Modal Create Notification
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { reloadKey, triggerReload } = useNotificationContext();

  // ✅ Role Check
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userId = localStorage.getItem("employeeid");
        if (userId) {
          const user: UsersInterface | false = await GetUserDataByUserID(userId);
          if (user && user.Role?.RoleName === "Admin") setIsAdmin(true);
          else setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setIsAdmin(false);
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const res = await ListNotification();
      if (res) setNotifications(res);
      setLoading(false);
    };
    fetchNotifications();
  }, [reloadKey]);

  // ✅ เปิด Modal Token และโหลดค่า
  const showLineToken = async () => {
    if (!isAdmin) return;
    setIsModalOpen(true);
    setLoadingToken(true);
    setTokenPassword(""); // ล้างรหัสเดิมทุกครั้ง
    const res = await GetLineMasterFirst();
    if (res) {
      setLineMaster(res);
      setNewToken(res.Token);
    }
    setLoadingToken(false);
  };

  // ✅ Save Token (ตรวจรหัสผ่านก่อน)
  const handleSaveToken = async () => {
    if (!lineMaster || !isAdmin) return;

    if (!tokenPassword) {
      message.error("กรุณากรอกรหัสผ่านเพื่อยืนยันการเปลี่ยนแปลง");
      return;
    }

    setSaving(true);
    try {
      const ok = await IsEmployeePasswordValid(EMPLOYEE_ID_FOR_VERIFY, tokenPassword);
      if (!ok) {
        message.warning("รหัสผ่านไม่ถูกต้อง");
        setSaving(false);
        return;
      }

      const res = await UpdateLineMasterByID(lineMaster.ID, { Token: newToken });
      if (res) {
        setLineMaster(res);
        message.success("อัปเดต Token สำเร็จ");
        setIsModalOpen(false);
        setTokenPassword("");
      } else {
        message.error("ไม่สามารถอัปเดต Token ได้");
      }
    } catch (err) {
      console.error(err);
      message.error("เกิดข้อผิดพลาดขณะบันทึก");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Create Notification
  const handleCreateNotification = async () => {
    if (!isAdmin) return;
    try {
      const values = await form.validateFields();
      const res = await CreateNotification({
        Name: values.Name,
        UserID: values.UserID,
        Alert: false,
      });
      if (res) {
        message.success("สร้าง ข้อมูลผู้ได้รับการเเจ้งเตือน สำเร็จ");
        setIsCreateModalOpen(false);
        form.resetFields();
        triggerReload();
      } else {
        message.error("ไม่สามารถสร้าง ข้อมูลผู้ได้รับการเเจ้งเตือน ได้");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Card
        title={<span className="flex items-center gap-2 text-teal-600 font-semibold">{t("บัญชีทั้งหมด")}</span>}
        style={{ height: "100%" }}
        extra={
          isAdmin && (
            <>
              <Button
                size="small"
                style={{
                  background: "linear-gradient(to right, #14b8a6, #0d9488)",
                  color: "white",
                  border: "none",
                  fontSize: 12,
                  height: 28,
                  padding: "0 10px",
                }}
                icon={<PlusOutlined style={{ fontSize: 12 }} />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                เพิ่มผู้เเจ้งเตือน
              </Button>
              <Button
                type="link"
                size="small"
                onClick={showLineToken}
                style={{
                  fontSize: 12,
                  paddingInline: 4,
                  height: 28,
                }}
              >
                LINE Token
              </Button>
            </>
          )
        }
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
              renderItem={(item) => (
                <AccountItem item={item} isAdmin={isAdmin} />
              )}
              className="[&_.ant-list-item-meta-title]:font-normal"
            />
          )}
        </div>
      </Card>

      {/* ✅ Modal Create Notification */}
      <Modal
        title={
          <span className="text-teal-600 font-bold text-lg flex items-center gap-2">
            <BellOutlined /> สร้างผู้ได้รับการเเจ้งเตือน
          </span>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        centered
        width="500px"
        footer={
          isAdmin ? (
            [
              <Button key="cancel" onClick={() => setIsCreateModalOpen(false)}>
                ยกเลิก
              </Button>,
              <Button
                key="create"
                type="primary"
                onClick={handleCreateNotification}
                style={{
                  background: "linear-gradient(to right, #14b8a6, #0d9488)",
                  borderColor: "#0d9488",
                }}
              >
                บันทึก
              </Button>,
            ]
          ) : (
            <Button key="close" onClick={() => setIsCreateModalOpen(false)}>
              ปิด
            </Button>
          )
        }
      >
        {isAdmin && (
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
        )}
        {!isAdmin && <p className="text-red-500">คุณไม่มีสิทธิ์สร้างข้อมูลนี้</p>}
      </Modal>

      {/* ✅ Modal LINE Token (มีช่องยืนยันรหัสใต้ Token) */}
      <Modal
        title={
          <span className="text-teal-600 font-bold text-lg flex items-center gap-2">
            <KeyOutlined /> จัดการ LINE Token
          </span>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setTokenPassword("");
        }}
        centered
        width="600px"
        footer={
          isAdmin ? (
            [
              <Button key="close" onClick={() => setIsModalOpen(false)}>
                ปิด
              </Button>,
              <Button
                key="save"
                type="primary"
                loading={saving}
                onClick={handleSaveToken}
                style={{
                  background: "linear-gradient(to right, #14b8a6, #0d9488)",
                  borderColor: "#0d9488",
                }}
              >
                บันทึก
              </Button>,
            ]
          ) : (
            <Button key="close" onClick={() => setIsModalOpen(false)}>
              ปิด
            </Button>
          )
        }
        className="custom-line-token-modal"
      >
        {loadingToken ? (
          <div className="flex justify-center items-center py-6">
            <Spin />
          </div>
        ) : (
          isAdmin && (
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="flex items-center gap-1 font-semibold text-gray-700">
                  <EditOutlined /> Token
                </span>
                <TextArea
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="กรอก Line Token"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              </div>

              <div className="space-y-1">
                <span className="flex items-center gap-1 font-semibold text-gray-700">
                  <KeyOutlined /> รหัสผ่านยืนยันการเปลี่ยนแปลง
                </span>
                <Input.Password
                  value={tokenPassword}
                  onChange={(e) => setTokenPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านของคุณ"
                />
                <p className="text-xs text-gray-500">
                  ต้องกรอกรหัสผ่านเพื่อยืนยันก่อนบันทึกการเปลี่ยนแปลง Token
                </p>
              </div>
            </div>
          )
        )}
        {!isAdmin && <p className="text-red-500">คุณไม่มีสิทธิ์แก้ไข Token</p>}
      </Modal>
    </>
  );
};

export default Account;
