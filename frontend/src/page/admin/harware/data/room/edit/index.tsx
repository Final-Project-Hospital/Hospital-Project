import React, { useState, useEffect } from "react";
import {
  Input,
  Select,
  Button,
  message,
  List,
  Avatar,
} from "antd";
import {
  FaMicroscope,
  FaVial,
  FaFlask,
  FaLaptopMedical,
  FaBiohazard,
  FaDna,
  FaSyringe,
  FaNotesMedical,
  FaProcedures,
  FaBriefcaseMedical,
  FaCapsules,
  FaHeartbeat,
  FaStethoscope,
  FaThermometerHalf,
  FaRadiation,
} from "react-icons/fa";
import { IconType } from "react-icons";
import {
  UpdateRoom,
  ListBuilding,
  ListHardware,
  ListRoomNotification,
  ListNotification,
  DeleteRoomNotificationByNotificationID,
  CreateRoomNotification,
} from "../../../../../../services/hardware";
import { GetUserDataByUserID } from "../../../../../../services/httpLogin";
import { UsersInterface } from "../../../../../../interface/IUser";
import { RoomInterface } from "../../../../../../interface/IRoom";
import { BuildingInterface } from "../../../../../../interface/IBuilding";
import { HardwareInterface } from "../../../../../../interface/IHardware";
import { RoomNotificationInterface } from "../../../../../../interface/IRoomNotification";
import { NotificationInterface } from "../../../../../../interface/INotification";

const { Option } = Select;

const iconOptions: { name: string; label: string; component: IconType }[] = [
  { name: "FaMicroscope", label: "กล้องจุลทรรศน์", component: FaMicroscope },
  { name: "FaVial", label: "ขวดทดลอง", component: FaVial },
  { name: "FaFlask", label: "ขวดรูปชมพู่", component: FaFlask },
  { name: "FaLaptopMedical", label: "โน้ตบุ๊กการแพทย์", component: FaLaptopMedical },
  { name: "FaBiohazard", label: "สัญลักษณ์ชีวภาพ", component: FaBiohazard },
  { name: "FaDna", label: "ดีเอ็นเอ", component: FaDna },
  { name: "FaSyringe", label: "เข็มฉีดยา", component: FaSyringe },
  { name: "FaNotesMedical", label: "สมุดบันทึกการแพทย์", component: FaNotesMedical },
  { name: "FaProcedures", label: "ผู้ป่วยบนเตียง", component: FaProcedures },
  { name: "FaBriefcaseMedical", label: "กระเป๋าพยาบาล", component: FaBriefcaseMedical },
  { name: "FaCapsules", label: "แคปซูลยา", component: FaCapsules },
  { name: "FaHeartbeat", label: "หัวใจเต้น", component: FaHeartbeat },
  { name: "FaStethoscope", label: "หูฟังแพทย์", component: FaStethoscope },
  { name: "FaThermometerHalf", label: "เทอร์โมมิเตอร์", component: FaThermometerHalf },
  { name: "FaRadiation", label: "สัญลักษณ์รังสี", component: FaRadiation },
];

interface Props {
  show: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  initialData: RoomInterface;
}

const EditRoomModal: React.FC<Props> = ({
  show,
  onClose,
  onSaveSuccess,
  initialData,
}) => {
  const [room, setRoom] = useState<RoomInterface>(initialData);
  const [buildings, setBuildings] = useState<BuildingInterface[]>([]);
  const [hardwares, setHardwares] = useState<HardwareInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeid, setEmployeeid] = useState<number>(
    Number(localStorage.getItem("employeeid")) || 0
  );

  const [responsibles, setResponsibles] = useState<RoomNotificationInterface[]>([]);
  const [notifications, setNotifications] = useState<NotificationInterface[]>([]);
  const [newNotificationId, setNewNotificationId] = useState<number | null>(null);

  // state เก็บการเปลี่ยนแปลง
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [addedIds, setAddedIds] = useState<number[]>([]);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const selectedIcon = iconOptions.find((i) => i.name === room.Icon)?.component;

  useEffect(() => {
    const fetchUserRole = async () => {
      const userId = localStorage.getItem("employeeid");
      if (userId) {
        const user: UsersInterface | false = await GetUserDataByUserID(userId);
        if (user && user.Role?.RoleName === "Admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    };

    setEmployeeid(Number(localStorage.getItem("employeeid")));
    if (show) {
      setRoom(initialData);
      (async () => {
        const b = await ListBuilding();
        const h = await ListHardware();
        const rn = await ListRoomNotification();
        const noti = await ListNotification();

        if (b) setBuildings(b);
        if (h) setHardwares(h);
        if (rn) setResponsibles(rn.filter((n) => n.Room?.ID === initialData.ID));
        if (noti) setNotifications(noti);

        setDeletedIds([]);
        setAddedIds([]);
      })();

      fetchUserRole();
    }
  }, [show, initialData]);

  const handleChange = (field: keyof RoomInterface, value: any) => {
    setRoom((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ ลบ (Admin เท่านั้น)
  const handleDeleteResponsible = (notificationID: number) => {
    if (!isAdmin) return;
    setResponsibles((prev) =>
      prev.filter((r) => r.Notification?.ID !== notificationID)
    );
    setDeletedIds((prev) => [...prev, notificationID]);
    setAddedIds((prev) => prev.filter((id) => id !== notificationID));
  };

  // ✅ เพิ่ม (Admin เท่านั้น)
  const handleAddResponsible = () => {
    if (!isAdmin) return;
    if (!newNotificationId) {
      message.warning("กรุณาเลือกผู้ได้รับการเเจ้งเตือนก่อน");
      return;
    }
    const exists = responsibles.some((r) => r.Notification?.ID === newNotificationId);
    if (exists) {
      message.warning("มีผู้ผู้ได้รับการเเจ้งเตือนนี้อยู่แล้ว");
      return;
    }

    const noti = notifications.find((n) => n.ID === newNotificationId);
    if (noti) {
      setResponsibles((prev) => [
        ...prev,
        { Notification: noti, Room: room } as RoomNotificationInterface,
      ]);
      setAddedIds((prev) => [...prev, newNotificationId]);
    }
    setNewNotificationId(null);
  };

  // ✅ Submit รวมทั้งหมด
  const handleSubmit = async () => {
    if (
      !room.RoomName ||
      !room.Floor ||
      !room.Building?.ID ||
      !room.Hardware?.ID ||
      !room.Icon
    ) {
      message.error("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    setLoading(true);

    const res = await UpdateRoom(room.ID!, {
      RoomName: room.RoomName,
      Floor: room.Floor,
      Building: room.Building,
      Hardware: room.Hardware,
      Icon: room.Icon,
      Employee: { ID: employeeid },
    });

    if (!res) {
      message.error("เกิดข้อผิดพลาดในการแก้ไข");
      setLoading(false);
      return;
    }

    // ✅ Admin เท่านั้นที่แก้ไข Notification ได้
    if (isAdmin) {
      for (const id of deletedIds) {
        await DeleteRoomNotificationByNotificationID(id);
      }
      for (const id of addedIds) {
        await CreateRoomNotification({ room_id: room.ID!, notification_id: id });
      }
    }

    setLoading(false);
    message.success("แก้ไขข้อมูลห้องสำเร็จ");
    onSaveSuccess();
  };

  if (!show) return null;

  const availableNotifications = notifications.filter(
    (n) => !responsibles.some((r) => r.Notification?.ID === n.ID)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-xl relative">
        <h2 className="text-center text-lg font-bold bg-teal-600 text-white py-3 rounded-t-lg mb-6 shadow">
          แก้ไขข้อมูลพื้นที่ติดตั้งเซนเซอร์
        </h2>

        {/* Icon Preview */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md border border-teal-600">
            {selectedIcon
              ? React.createElement(selectedIcon, {
                  size: 40,
                  className: "text-teal-600",
                })
              : null}
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            placeholder="ชื่อห้อง"
            value={room.RoomName}
            onChange={(e) => handleChange("RoomName", e.target.value)}
            allowClear
          />
          <Select
            placeholder="เลือกเซนเซอร์"
            value={room.Hardware?.ID || undefined}
            onChange={(val) =>
              handleChange("Hardware", hardwares.find((h) => h.ID === val))
            }
            allowClear
            className="w-full"
          >
            {hardwares.map((hw) => (
              <Option key={hw.ID} value={hw.ID}>
                {hw.Name}
              </Option>
            ))}
          </Select>
          <Input
            placeholder="ชั้น เช่น 7"
            value={room.Floor}
            maxLength={2}
            onChange={(e) =>
              handleChange("Floor", e.target.value.replace(/[^0-9]/g, ""))
            }
            allowClear
          />
          <Select
            placeholder="เลือกอาคาร"
            value={room.Building?.ID || undefined}
            onChange={(val) =>
              handleChange("Building", buildings.find((b) => b.ID === val))
            }
            allowClear
            className="w-full"
          >
            {buildings.map((b) => (
              <Option key={b.ID} value={b.ID}>
                {b.BuildingName}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="เลือกไอคอน"
            value={room.Icon || undefined}
            onChange={(val) => handleChange("Icon", val)}
            allowClear
            className="w-full col-span-2"
            showSearch
            optionLabelProp="label"
          >
            {iconOptions.map(({ name, label, component: Icon }) => (
              <Option key={name} value={name} label={label}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-teal-600 flex items-center justify-center shadow">
                    <Icon size={20} className="text-teal-600" />
                  </div>
                  <span className="text-gray-800 font-medium">{label}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        {/* Section ผู้รับผิดชอบ - Admin เท่านั้น */}
        {isAdmin && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-md font-semibold text-gray-700 mb-3">
              ผู้รับผิดชอบ ({responsibles.length})
            </h3>
            {responsibles.length > 0 ? (
              <List
                dataSource={responsibles}
                renderItem={(r) => (
                  <List.Item
                    actions={[
                      <Button
                        danger
                        size="small"
                        onClick={() => handleDeleteResponsible(r.Notification?.ID!)}
                      >
                        ลบ
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: "#20c997" }}>
                          {r.Notification?.Name?.charAt(0) || "U"}
                        </Avatar>
                      }
                      title={r.Notification?.Name ?? "-"}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีผู้รับผิดชอบ</p>
            )}
            <div className="flex gap-2 mt-4">
              <Select
                placeholder="เลือกผู้ที่ได้รับการเเจ้งเตือน"
                value={newNotificationId || undefined}
                onChange={(val) => setNewNotificationId(val)}
                className="w-full"
                allowClear
              >
                {availableNotifications.map((n) => (
                  <Option key={n.ID} value={n.ID}>
                    {n.Name} ({n.UserID})
                  </Option>
                ))}
              </Select>
              <Button type="primary" onClick={handleAddResponsible}>
                เพิ่ม
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            style={{
              background: "linear-gradient(to right, #14b8a6, #0d9488)",
              borderColor: "#0d9488",
              color: "#fff", 
            }}
          >
            บันทึก
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditRoomModal;
