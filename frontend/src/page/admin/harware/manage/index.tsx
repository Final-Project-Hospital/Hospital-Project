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
const { Option } = Select;

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

    const [reloadKey, setReloadKey] = useState(0);
    //@ts-ignore
    const [showResponsibleModal, setShowResponsibleModal] = useState(false);//@ts-ignore
    const [modalRoomName, setModalRoomName] = useState<string>("");//@ts-ignore
    const [modalResponsibles, setModalResponsibles] = useState<string[]>([]);

    const { activeMenu } = useStateContext();

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
    }, []);

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
    }, [rooms, searchText, selectedBuilding, selectedFloor]);

    const handleEditClick = (room: RoomInterface) => {
        setSelectedRoom(room);
        setShowEditModal(true);
    };

    const handleUpdateSuccess = async () => {
        setShowEditModal(false);
        setSelectedRoom(null);
        await fetchRooms();
        await fetchRoomNotifications();
        setReloadKey((prev) => prev + 1);
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
            message.success(`ลบสำเร็จ ${successCount} รายการ`);
            setSelectedRowKeys([]);
            fetchRooms();
            fetchRoomNotifications();
            setReloadKey((prev) => prev + 1);
        } else {
            message.error("ลบข้อมูลไม่สำเร็จ");
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
            title: <span className="text-teal-600 font-bold">ผู้รับผิดชอบ</span>,
            key: "Notification",
            render: (_, r) => {
                const related = notifications.filter((n) => n.Room?.ID === r.ID);
                if (related.length === 0) return "-";

                const names = related.map((n, idx) => `${idx + 1}. ${n.Notification?.Name ?? "-"}`);

                if (names.length <= 2) {
                    return (
                        <div className="flex flex-col">
                            {names.map((n, idx) => (
                                <span key={idx}>{n}</span>
                            ))}
                        </div>
                    );
                }

                return (
                    <Button
                        type="link"
                        onClick={() => {
                            setModalRoomName(r.RoomName ?? "-");
                            setModalResponsibles(names);
                            setShowResponsibleModal(true);
                        }}
                    >
                        ผู้รับผิดชอบทั้งหมด ({names.length})
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
                    Edit
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
                                        <Option key={id} value={id}>
                                            {name}
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
                                        <Option key={floor} value={String(floor)}>
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
                        setReloadKey((prev) => prev + 1);
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
                    title="ยืนยันการลบห้อง"
                    open={showDeleteModal}
                    onOk={confirmDeleteRooms}
                    onCancel={() => setShowDeleteModal(false)}
                    okText="ลบ"
                    cancelText="ยกเลิก"
                    centered
                >
                    <p>คุณต้องการลบห้องต่อไปนี้หรือไม่?</p>
                    <ul className="list-disc ml-6 mt-2">
                        {selectedRooms.map((room) => (
                            <li key={room.ID}>{room.RoomName}</li>
                        ))}
                    </ul>
                </Modal>
            </div>
        </>
    );
};

export default RoomAdminTable;
