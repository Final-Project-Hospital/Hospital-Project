import { Card, List, Spin, Modal, Button, Input, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AccountItem from "./AccountItem";
import { ListNotification } from "../../../../services/hardware";
import { NotificationInterface } from "../../../../interface/INotification";
import { useNotificationContext } from "../NotificationContext";
import {
  GetLineMasterFirst,
  UpdateLineMasterByID,
} from "../../../../services/hardware";
import { LineMasterInterface } from "../../../../interface/ILineMaster"; // ✅ interface

const { TextArea } = Input; // ✅ ใช้ TextArea ของ AntD

const Account = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ state สำหรับ Modal Line Token
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lineMaster, setLineMaster] = useState<LineMasterInterface | null>(null);
  const [loadingToken, setLoadingToken] = useState<boolean>(false);
  const [newToken, setNewToken] = useState<string>(""); // ✅ สำหรับแก้ไข Token
  const [saving, setSaving] = useState<boolean>(false);

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
  }, [reloadKey]);

  // ✅ ฟังก์ชันเปิด Modal และโหลด Token
  const showLineToken = async () => {
    setIsModalOpen(true);
    setLoadingToken(true);
    const res = await GetLineMasterFirst();
    if (res) {
      setLineMaster(res);
      setNewToken(res.Token); // ตั้งค่า token ใน textarea
    }
    setLoadingToken(false);
  };

  // ✅ ฟังก์ชันบันทึกการแก้ไข Token
  const handleSaveToken = async () => {
    if (!lineMaster) return;
    setSaving(true);
    const res = await UpdateLineMasterByID(lineMaster.ID, { Token: newToken });
    if (res) {
      setLineMaster(res);
      message.success("อัปเดต Token สำเร็จ");
      setIsModalOpen(false); // ✅ ปิด Modal อัตโนมัติเมื่อบันทึกสำเร็จ
    } else {
      message.error("ไม่สามารถอัปเดต Token ได้");
    }
    setSaving(false);
  };

  return (
    <>
      <Card
        title={t("บัญชีทั้งหมด")}
        style={{ height: "100%" }}
        extra={
          <Button type="link" onClick={showLineToken}>
            LINE Token
          </Button>
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
              renderItem={(item) => <AccountItem item={item} />}
              className="[&_.ant-list-item-meta-title]:font-normal"
            />
          )}
        </div>
      </Card>

      {/* ✅ Modal แสดงและแก้ไข Token */}
      <Modal
        title={<span className="text-teal-600 font-bold text-lg">จัดการ LINE Token</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        centered
        width="600px"
        footer={[
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
        ]}
        className="custom-line-token-modal"
      >
        {loadingToken ? (
          <div className="flex justify-center items-center py-6">
            <Spin />
          </div>
        ) : (
          <div className="space-y-1">
            <p
              style={{
                background: "linear-gradient(to right, #14b8a6, #0d9488)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "bold",
              }}
            >
            </p>
            <TextArea
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="กรอก Line Token"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </div>
        )}
      </Modal>

      {/* ✅ Responsive CSS */}
      <style>
        {`
          @media (max-width: 768px) {
            .custom-line-token-modal .ant-modal {
              width: 90% !important;
              max-width: none !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default Account;
