// RoomAdminTable.tsx
import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  message,
  Select,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  ListRoom,
  DeleteRoomById,
  ListRoomNotification,
} from "../../../../services/hardware";
import { RoomInterface } from "../../../../interface/IRoom";
import { RoomNotificationInterface } from "../../../../interface/IRoomNotification";
import AddRoomModal from "../data/room/create";
import EditRoomModal from "../data/room/edit";
import { FaHome } from "react-icons/fa";
import MainLine from "../../../../component/hardware/index";
import { useStateContext } from "../../../../contexts/ContextProvider";
import { LuUsers } from "react-icons/lu";
const { Option } = Select;

type ResponsibleItem = {
  id: string | number;
  name: string;
};

const RoomAdminTable: React.FC = () => {
  const [rooms, setRooms] = useState<RoomInterface[]>([]);
  const [filteredData, setFilteredData] = useState<RoomInterface[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState<RoomNotificationInterface[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | number>("");
  const [selectedFloor, setSelectedFloor] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomInterface | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isTabletView, setIsTabletView] = useState(false);

  const { activeMenu, reloadKey, bumpReload } = useStateContext(); // ✅
  console.log("reloadKey:", reloadKey);

  // ✅ modal ผู้รับผิดชอบ
  const [showResponsibleModal, setShowResponsibleModal] = useState<boolean>(false);
  const [modalRoomName, setModalRoomName] = useState<string>("");
  const [modalResponsibles, setModalResponsibles] = useState<ResponsibleItem[]>([]);

  const fetchRooms = async () => {
    setLoading(true);
    const data = await ListRoom();
    if (data) setRooms(data);
    setLoading(false);
  };

  const fetchRoomNotifications = async () => {
    const data = await ListRoomNotification();
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchRooms();
    fetchRoomNotifications();
  }, [reloadKey]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsTabletView(width >= 768 && width <= 1300);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let data = rooms;
    if (selectedBuilding) {
      data = data.filter((r) => r.Building?.ID === selectedBuilding);
    }
    if (selectedFloor) {
      data = data.filter((r) => r.Floor?.toString() === selectedFloor);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      data = data.filter((room) => {
        const buildingName = room.Building?.BuildingName ?? "";
        const hardwareName = room.Hardware?.Name ?? "";
        return (
          room.RoomName?.toLowerCase().includes(q) ||
          room.Floor?.toString().toLowerCase().includes(q) ||
          buildingName.toLowerCase().includes(q) ||
          hardwareName.toLowerCase().includes(q)
        );
      });
    }
    setFilteredData(data);
  }, [rooms, searchText, selectedBuilding, selectedFloor, reloadKey]);

  const handleEditClick = (room: RoomInterface) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const handleUpdateSuccess = async () => {
    setShowEditModal(false);
    setSelectedRoom(null);
    await fetchRooms();
    await fetchRoomNotifications();
    bumpReload(); // ✅ เดิม setReloadKey(prev => prev + 1)
  };

  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("กรุณาเลือกห้องก่อนลบ");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDeleteRooms = async () => {
    let successCount = 0;
    for (const id of selectedRowKeys) {
      const res = await DeleteRoomById(Number(id));
      if (res) successCount++;
    }
    if (successCount > 0) {
      message.success(`ลบข้อมูลห้องสำเร็จ ${successCount} รายการ`);
      setSelectedRowKeys([]);
      await fetchRooms();
      await fetchRoomNotifications();
      bumpReload(); // ✅ เดิม setReloadKey(prev => prev + 1)
    } else {
      message.error("ลบข้อมูลห้องไม่สำเร็จ");
    }
    setShowDeleteModal(false);
  };

  const buildingOptions = [
    ...Array.from(
      new Map(rooms.map((r) => [r.Building?.ID, r.Building?.BuildingName])).entries()
    ),
  ].filter(([id, name]) => !!id && !!name);

  const floorOptions = [
    ...Array.from(new Set(rooms.map((r) => r.Floor))).sort(
      (a: any, b: any) => a - b
    ),
  ].filter((f) => f);

  const columns: ColumnsType<RoomInterface> = [
    {
      title: <span className="text-teal-600 font-bold">ลำดับ</span>,
      key: "index",
      width: 70,
      render: (_: any, __: RoomInterface, index: number) => index + 1,
    },
    {
      title: <span className="text-teal-600 font-bold">ชื่อห้อง</span>,
      dataIndex: "RoomName",
      key: "RoomName",
      sorter: (a, b) => (a.RoomName ?? "").localeCompare(b.RoomName ?? ""),
    },
    {
      title: <span className="text-teal-600 font-bold">ชั้น</span>,
      dataIndex: "Floor",
      key: "Floor",
      sorter: (a, b) => Number(a.Floor ?? 0) - Number(b.Floor ?? 0),
    },
    {
      title: <span className="text-teal-600 font-bold">อาคาร</span>,
      key: "Building",
      render: (_, r) => r.Building?.BuildingName ?? "-",
    },
    {
      title: <span className="text-teal-600 font-bold">MAC Address</span>,
      key: "HardwareIP",
      render: (_, r) => (
        <span className="text-cyan-600 font-semibold">
          {r.Hardware?.MacAddress ?? "-"}
        </span>
      ),
    },
    {
      title: <span className="text-teal-600 font-bold">ชื่ออุปกรณ์เซนเซอร์</span>,
      key: "Hardware",
      render: (_, r) => (
        <span className="inline-block bg-teal-500 text-white px-3 py-1 rounded-xl text-center min-w-[90px]">
          {r.Hardware?.Name ?? "-"}
        </span>
      ),
    },
    {
      title: <span className="text-teal-600 font-bold">ผู้ได้รับการเเจ้งเตือน</span>,
      key: "Notification",
      render: (_, r) => {
        const related = notifications.filter((n) => n.Room?.ID === r.ID);
        if (related.length === 0) return "-";

        // ✅ เตรียมข้อมูล (เก็บทั้ง id และ name)
        const items: ResponsibleItem[] = related.map((n) => ({
          // รองรับหลายโครงสร้าง: User.ID → UserID → Notification.ID
          id:
            (n as any)?.Notification?.User?.ID ??
            (n as any)?.Notification?.UserID ??
            (n as any)?.Notification?.ID ??
            "-",
          name: (n as any)?.Notification?.Name ?? "-",
        }));

        if (items.length <= 2) {
          return (
            <div className="flex flex-col">
              <ul className=" list-inside space-y-1">
                {items.map((it, idx) => (
                  <li key={`${it.id}-${idx}`}>
                    {idx + 1} {it.name} ,{" "}
                    <span className="text-blue-600">
                      UserID: {it.id}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <Button
            type="link"
            onClick={() => {
              setModalRoomName(r.RoomName ?? "-");
              setModalResponsibles(items);
              setShowResponsibleModal(true);
            }}
          >
            ผู้ได้รับการแจ้งเตือนทั้งหมด ({items.length})
          </Button>
        );
      },
    },
    {
      title: <span className="text-teal-600 font-bold">จัดการ</span>,
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          icon={<EditOutlined />}
          className="bg-teal-500 text-white border-none font-semibold"
          style={{ borderRadius: 12 }}
          onClick={() => handleEditClick(record)}
        >
          เเก้ไขข้อมูล
        </Button>
      ),
    },
  ];

  const selectedRooms = filteredData.filter((room) =>
    selectedRowKeys.includes(room.ID!)
  );

  return (
    <>
      <div className="min-h-screen bg-gray-100 mt-16 md:mt-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-4 py-6 rounded-b-3xl mb-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">จัดการข้อมูลเซนเซอร์</h1>
              <p className="text-sm">จัดการห้องที่ติดตั้งเซนเซอร์ในแต่ละอาคาร</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-white text-teal-800 px-4 py-2 rounded-full hover:bg-teal-100 transition"
            >
              <FaHome />
              เพิ่มห้อง
            </button>
          </div>
        </div>

        {/* Main graph */}
        <div className="paddings">
          <MainLine reloadKey={reloadKey} />
        </div>

        <div
          className={`px-2 sm:px-6 pb-10 ${isTabletView
            ? activeMenu ? "w-[900px]" : "w-full"
            : "w-full"
            }`}
        >
          <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
            {/* Filters */}
            <div className="flex flex-col lg:flex-row justify-between gap-3 mb-4">
              {/* Filter group */}
              <div className="flex flex-col md:flex-row flex-wrap gap-2 w-full">
                <Select
                  allowClear
                  placeholder="ทุกอาคาร"
                  className="flex-1 min-w-[150px]"
                  value={selectedBuilding}
                  onChange={(val) => setSelectedBuilding(val)}
                >
                  <Option value="">ทุกอาคาร</Option>
                  {buildingOptions.map(([id, name]) => (
                    <Option key={id as React.Key} value={id as number | string}>
                      {name as string}
                    </Option>
                  ))}
                </Select>

                <Select
                  allowClear
                  placeholder="ทุกชั้น"
                  className="flex-1 min-w-[120px]"
                  value={selectedFloor}
                  onChange={(val) => setSelectedFloor(val)}
                >
                  <Option value="">ทุกชั้น</Option>
                  {floorOptions.map((floor) => (
                    <Option key={floor as React.Key} value={String(floor)}>
                      {`ชั้น ${floor}`}
                    </Option>
                  ))}
                </Select>

                <Input
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="ค้นหาทุกคอลัมน์..."
                  prefix={<SearchOutlined />}
                  className="flex-1 min-w-[200px]"
                />
              </div>

              {/* Delete button */}
              {selectedRowKeys.length > 0 && (
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteSelected}
                  className="w-full lg:w-auto"
                >
                  ลบที่เลือก ({selectedRowKeys.length})
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
              <div>
                <Table
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                  }}
                  columns={columns}
                  dataSource={filteredData}
                  rowKey="ID"
                  loading={loading}
                  pagination={{
                    pageSize: 5,
                    showSizeChanger: true,
                    pageSizeOptions: [5, 10, 20],
                    position: ["bottomCenter"],
                  }}
                  scroll={{ x: isTabletView ? 1000 : 1000 }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <AddRoomModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreateSuccess={async () => {
            await fetchRooms();
            await fetchRoomNotifications();
            bumpReload(); // ✅ สร้างเสร็จก็กระตุ้นรีโหลด
          }}
        />
        {selectedRoom && (
          <EditRoomModal
            show={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSaveSuccess={handleUpdateSuccess}
            initialData={selectedRoom}
          />
        )}

        {/* Delete confirm modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <ExclamationCircleOutlined style={{ color: "#faad14" }} />
              <span>ยืนยันการลบข้อมูลอาคาร</span>
            </div>
          }
          open={showDeleteModal}
          onOk={confirmDeleteRooms}
          onCancel={() => setShowDeleteModal(false)}
          centered
          okText="ลบ"
          cancelText="ยกเลิก"
          okButtonProps={{ danger: true }}
        >
          <p>
            คุณต้องการลบห้อง{" "}
            <span className="font-semibold text-red-500">
              {selectedRooms.map((room) => room.RoomName).join(", ")}
            </span>{" "}
            ใช่หรือไม่?
          </p>
        </Modal>

        <Modal
          title={
            <div className="flex items-center gap-2 text-teal-600 font-bold text-lg mb-1">
              <LuUsers className="text-lg" />
              <span>
                ผู้ได้รับการแจ้งเตือนของห้อง :{" "}
                <span className="font-semibold">{modalRoomName || "-"}</span>
              </span>
            </div>
          }
          open={showResponsibleModal}
          onCancel={() => setShowResponsibleModal(false)}
          centered
          footer={null}
        >
          {modalResponsibles && modalResponsibles.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {modalResponsibles.map((it, idx) => (
                <li key={`${it.id}-${idx}`}>
                  {idx + 1}. {it.name} ,{" "}
                  <span className="text-blue-600">
                    UserID: {it.id}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>ไม่พบข้อมูลผู้ได้รับการแจ้งเตือน</p>
          )}
        </Modal>
      </div>
    </>
  );
};

export default RoomAdminTable;
