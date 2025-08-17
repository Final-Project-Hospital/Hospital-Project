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
import { ListRoom, DeleteRoomById } from "../../../../services/hardware";
import { RoomInterface } from "../../../../interface/IRoom";
import AddRoomModal from "../data/room/create";
import EditRoomModal from "../data/room/edit";
import { FaHome } from "react-icons/fa";
import MainLine from "../../../../component/hardware/index"
const { Option } = Select;

const RoomAdminTable: React.FC = () => {
    const [rooms, setRooms] = useState<RoomInterface[]>([]);
    const [filteredData, setFilteredData] = useState<RoomInterface[]>([]);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false);

    const [selectedBuilding, setSelectedBuilding] = useState<string | number>("");
    const [selectedFloor, setSelectedFloor] = useState<string>("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<RoomInterface | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [isTabletView, setIsTabletView] = useState(false);

    const fetchRooms = async () => {
        setLoading(true);
        const data = await ListRoom();
        if (data) setRooms(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRooms();
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

    const handleUpdateSuccess = () => {
        setShowEditModal(false);
        setSelectedRoom(null);
        fetchRooms();
    };

    const handleDeleteSelected = () => {
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
            title: <span className="text-teal-600 font-bold">ID</span>,
            dataIndex: "ID",
            key: "ID",
            width: 60,
            sorter: (a, b) => (a.ID ?? 0) - (b.ID ?? 0),
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
                <span className="text-cyan-600 font-semibold">{r.Hardware?.MacAddress ?? "-"}</span>
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

                <div className="paddings">
                    <MainLine />
                </div>

                <div className="px-2 sm:px-6 pb-10">
                    <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-col lg:flex-row justify-between gap-3 mb-4">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full">
                                <Select
                                    allowClear
                                    placeholder="ทุกอาคาร"
                                    className="w-full sm:w-40"
                                    value={selectedBuilding}
                                    onChange={(val) => setSelectedBuilding(val)}
                                >
                                    <Option value="">ทุกอาคาร</Option>
                                    {buildingOptions.map(([id, name]) => (
                                        <Option key={id} value={id}>{name}</Option>
                                    ))}
                                </Select>

                                <Select
                                    allowClear
                                    placeholder="ทุกชั้น"
                                    className="w-full sm:w-32"
                                    value={selectedFloor}
                                    onChange={(val) => setSelectedFloor(val)}
                                >
                                    <Option value="">ทุกชั้น</Option>
                                    {floorOptions.map((floor) => (
                                        <Option key={floor} value={String(floor)}>{`ชั้น ${floor}`}</Option>
                                    ))}
                                </Select>

                                <Input
                                    allowClear
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="ค้นหาทุกคอลัมน์..."
                                    prefix={<SearchOutlined />}
                                    className="w-full sm:w-64"
                                />
                            </div>

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
                            <div className={isTabletView ? "min-w-[600px]" : "min-w-[1000px]"}>
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
                                    scroll={{ x: isTabletView ? 600 : 1000 }}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <Modal
                    open={showDeleteModal}
                    onCancel={() => setShowDeleteModal(false)}
                    onOk={confirmDeleteRooms}
                    okText="ลบ"
                    cancelText="ยกเลิก"
                    centered
                    title={null}
                    footer={null}
                    bodyStyle={{ padding: 0 }}
                >
                    <div className="rounded-lg p-6 bg-white">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full mb-3 shadow-sm">
                                <DeleteOutlined className="text-red-500 text-2xl" />
                            </div>
                            <h2 className="text-lg text-red-600 font-medium">ยืนยันการลบห้องที่เลือก</h2>
                            <p className="text-sm text-gray-700 mt-1 mb-3">
                                คุณแน่ใจหรือไม่ว่าต้องการลบห้องทั้งหมด <span className="text-red-500">{selectedRowKeys.length}</span> รายการ?
                            </p>

                            <ul className="bg-gray-50 border border-gray-200 rounded-md max-h-40 overflow-y-auto px-4 py-2 text-left w-full text-sm text-gray-700 list-disc list-inside">
                                {selectedRooms.map((room) => (
                                    <li key={room.ID}>{room.RoomName}</li>
                                ))}
                            </ul>

                            <p className="text-xs text-gray-500 mt-3">การลบนี้ไม่สามารถย้อนกลับได้</p>
                        </div>

                        <div className="mt-6 flex justify-center gap-4">
                            <Button
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-md"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="primary"
                                danger
                                onClick={confirmDeleteRooms}
                                className="bg-red-400 hover:bg-red-500 text-white font-semibold rounded-md border-none"
                            >
                                ลบ
                            </Button>
                        </div>
                    </div>
                </Modal>

                <AddRoomModal
                    show={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onCreateSuccess={fetchRooms}
                />
                {selectedRoom && (
                    <EditRoomModal
                        show={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        onSaveSuccess={handleUpdateSuccess}
                        initialData={selectedRoom}
                    />
                )}
            </div></>
    );
};

export default RoomAdminTable;
