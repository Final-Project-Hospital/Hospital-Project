import React, { useEffect, useState } from "react";
import { Table, Input, Button, Modal, message } from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ListRoom, DeleteRoomById } from "../../../../services/hardware";
import { RoomInterface } from "../../../../interface/IRoom";
import AddRoomModal from '../data/room/create';
import EditRoomModal from '../data/room/edit';
import { FaHome } from "react-icons/fa";

const RoomAdminTable: React.FC = () => {
    const [rooms, setRooms] = useState<RoomInterface[]>([]);
    const [searchText, setSearchText] = useState("");
    const [filteredData, setFilteredData] = useState<RoomInterface[]>([]);
    const [loading, setLoading] = useState(false);

    // สำหรับ modal add room
    const [showAddModal, setShowAddModal] = useState(false);

    // สำหรับ modal edit room
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<RoomInterface | null>(null);

    // สำหรับ modal delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<{ id: number, name: string } | null>(null);

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
        if (!searchText) {
            setFilteredData(rooms);
        } else {
            setFilteredData(
                rooms.filter((room) => {
                    const bName = room.Building?.BuildingName ?? "";
                    const hardwareName = room.Hardware?.Name ?? "";
                    return (
                        (room.RoomName ?? "").toString().toLowerCase().includes(searchText.toLowerCase()) ||
                        (room.Floor ?? "").toString().toLowerCase().includes(searchText.toLowerCase()) ||
                        bName.toString().toLowerCase().includes(searchText.toLowerCase()) ||
                        hardwareName.toString().toLowerCase().includes(searchText.toLowerCase())
                    );
                })
            );
        }
    }, [rooms, searchText]);

    // Modal AddRoom
    const handleAddRoomSuccess = () => {
        setShowAddModal(false);
        fetchRooms();
    };

    // Modal EditRoom
    const handleEditClick = (room: RoomInterface) => {
        setSelectedRoom(room);
        setShowEditModal(true);
    };
    const handleUpdateSuccess = () => {
        setShowEditModal(false);
        setSelectedRoom(null);
        fetchRooms();
    };

    // Modal DeleteRoom
    const handleDeleteClick = (id?: number, name?: string) => {
        if (!id) return;
        setRoomToDelete({ id, name: name || "ไม่ทราบชื่อห้อง" });
        setShowDeleteModal(true);
    };

    const confirmDeleteRoom = async () => {
        if (!roomToDelete?.id) return;
        const res = await DeleteRoomById(roomToDelete.id);
        if (res) {
            message.success("ลบข้อมูลสำเร็จ");
            setShowDeleteModal(false);
            setRoomToDelete(null);
            fetchRooms();
        } else {
            message.error("ลบข้อมูลไม่สำเร็จ");
        }
    };

    // columns สำหรับ Table
    const columns: ColumnsType<RoomInterface> = [
        {
            title: (
                <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-transparent font-bold">
                    ID
                </span>
            ),
            dataIndex: "ID",
            key: "ID",
            width: 70,
            sorter: (a, b) => (a.ID ?? 0) - (b.ID ?? 0),
        },
        {
            title: (
                <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-transparent font-bold">
                    Room Name
                </span>
            ),
            dataIndex: "RoomName",
            key: "RoomName",
            sorter: (a, b) => (a.RoomName ?? "").localeCompare(b.RoomName ?? ""),
        },
        {
            title: (
                <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-transparent font-bold">
                    Floor
                </span>
            ),
            dataIndex: "Floor",
            key: "Floor",
            sorter: (a, b) => {
                const fa = isNaN(Number(a.Floor)) ? a.Floor ?? "" : Number(a.Floor);
                const fb = isNaN(Number(b.Floor)) ? b.Floor ?? "" : Number(b.Floor);

                if (typeof fa === "number" && typeof fb === "number") {
                    return fa - fb;
                }
                return fa.toString().localeCompare(fb.toString());
            },
        },
        {
            title: (
                <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-transparent font-bold">
                    Building
                </span>
            ),
            key: "Building",
            render: (_, record) => record.Building?.BuildingName ?? "-",
        },
        {
            title: (
                <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-transparent font-bold">
                    Hardware Name
                </span>
            ),
            key: "Hardware",
            render: (_, record) => (
                <span
                    className="inline-block bg-gradient-to-r from-teal-400 to-teal-600 text-white font-semibold px-3 py-1 rounded-lg shadow-sm border border-teal-300"
                    style={{ minWidth: 90, textAlign: "center" }}
                >
                    {record.Hardware?.Name ?? "-"}
                </span>
            ),
        },
        {
            title: (
                <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-transparent font-bold">
                    Action
                </span>
            ),
            key: "action",
            width: 140,
            render: (_, record) => (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 w-full">
                    <Button
                        icon={<EditOutlined />}
                        className="bg-gradient-to-r from-teal-400 to-teal-500 text-white border-none font-semibold shadow hover:scale-105 w-full sm:w-auto"
                        style={{ borderRadius: 12 }}
                        onClick={() => handleEditClick(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        type="primary"
                        style={{ borderRadius: 12 }}
                        className="w-full sm:w-auto"
                        onClick={() => handleDeleteClick(record.ID, record.RoomName)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 mt-16 md:mt-0">
            <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-8 py-6 rounded-b-3xl mb-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold drop-shadow-md">จัดการข้อมูลเซนเซอร์</h1>
                        <p className="text-sm drop-shadow-sm">
                            โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-white text-teal-800 px-4 py-2 rounded-full hover:bg-teal-100 transition whitespace-nowrap"
                    >
                        <FaHome />
                        เพิ่มห้อง
                    </button>
                </div>
            </div>

            <div className="paddings">
                <div className="bg-white rounded-2xl shadow-xl p-6 ">
                    <div className="mb-4 w-full md:w-1/3">
                        <Input
                            allowClear
                            prefix={<SearchOutlined className="text-teal-400" />}
                            placeholder="Search all columns..."
                            className="rounded-xl border-teal-200 focus:border-teal-400 shadow"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                    </div>
                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="ID"
                        loading={loading}
                        pagination={{
                            pageSize: 5,
                            showSizeChanger: true,
                            pageSizeOptions: [5, 10, 20, 50],
                            position: ["bottomCenter"],
                        }}
                        className="rounded-2xl overflow-hidden"
                        scroll={{ x: "max-content" }} // ให้ scroll แนวนอนบนจอแคบ
                    />
                </div>
            </div>

            {/* Modal เพิ่มห้อง */}
            <AddRoomModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreateSuccess={handleAddRoomSuccess}
            />

            {/* Modal Edit ห้อง */}
            {selectedRoom && (
                <EditRoomModal
                    show={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSaveSuccess={handleUpdateSuccess}
                    initialData={selectedRoom}
                />
            )}

            {/* Modal Delete ห้อง */}
            <Modal
                open={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                footer={null}
                centered
                closeIcon={false}
            >
                <div className="flex flex-col items-center gap-4">
                    <FaHome size={54} className="text-red-400 mb-2 drop-shadow-lg" />
                    <div className="font-bold text-lg text-gray-800 mb-2">ยืนยันการลบห้อง</div>
                    <div className="font-semibold text-red-600 text-md mb-2">{roomToDelete?.name}</div>
                    <div className="text-gray-500 text-sm mb-4 text-center">
                        คุณแน่ใจหรือไม่ว่าต้องการ <span className="text-red-500 font-semibold">ลบห้องนี้</span> ?<br />
                        ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบออกจากระบบ!
                    </div>
                    <div className="flex gap-2 w-full mt-4">
                        <Button
                            type="primary"
                            danger
                            className="w-1/2"
                            onClick={confirmDeleteRoom}
                        >
                            ลบ
                        </Button>
                        <Button
                            className="w-1/2"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            ยกเลิก
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default RoomAdminTable;
