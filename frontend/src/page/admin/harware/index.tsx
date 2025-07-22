import React, { useEffect, useState, useRef } from 'react';
import { FaHome, FaEdit, FaTrash, FaBuilding, FaSearch, FaLayerGroup } from 'react-icons/fa';
import { Trash2 } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import Image from "../../../assets/operating-room_4246637.png";
import AddRoomModal from './data/room/create';
import EditRoomModal from './data/room/edit';
import Modal from '../harware/data/room/delete';
import { ListRoom, DeleteRoomById, ListBuilding } from '../../../services/hardware';
import { RoomInterface } from '../../../interface/IRoom';
import { BuildingInterface } from '../../../interface/IBuilding';

interface RoomCardProps {
  name: string;
  floor: string;
  building: string;
  image: string;
  onUpdate: () => void;
  onDelete: () => void;
  hardwareID: number;
}

const RoomCard: React.FC<RoomCardProps> = ({
  name,
  floor,
  building,
  image,
  onUpdate,
  onDelete,
  hardwareID,
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/admin/Room', { state: { hardwareID } })}
      className="bg-white rounded-2xl shadow p-4 flex flex-row items-center w-[450px] min-h-[120px] cursor-pointer transition hover:shadow-lg"
    >
      {/* Content left side */}
      <div className="flex flex-col flex-1 justify-center h-full">
        {/* Name & Buttons (row) */}
        <div className="flex items-center gap-2">
          <div className="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded text-sm">
            {name}
          </div>
          <button
            onClick={e => {
              e.stopPropagation();
              onUpdate();
            }}
            className="ml-1 text-gray-500 hover:text-blue-600"
          >
            <FaEdit size={15} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-1 text-gray-500 hover:text-red-600"
          >
            <FaTrash size={15} />
          </button>
        </div>
        {/* Floor & Building (ติดกับ Name) */}
        <div className="mt-1 ml-1">
          <div className="text-gray-700 text-[15px] font-medium">Floor {floor.replace("Floor ", "")}</div>
          <div className="text-gray-500 text-[15px] font-medium">{building}</div>
        </div>
      </div>
      {/* Image right side */}
      <img
        src={image}
        alt={name}
        className="w-20 h-20 object-contain ml-5"
        draggable={false}
        style={{ minWidth: 80, minHeight: 80 }}
      />
    </div>
  );
};



const Index: React.FC = () => {
  const [buildings, setBuildings] = useState<BuildingInterface[]>([]);
  const [rooms, setRooms] = useState<RoomInterface[]>([]);

  // filter state
  const [queryBuilding, setQueryBuilding] = useState<number | "">("");
  const [queryFloor, setQueryFloor] = useState<string>("");
  const [queryName, setQueryName] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const selectedRoomIdRef = useRef<number | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<RoomInterface | null>(null);

  // ดึงข้อมูล Building
  const fetchBuildings = async () => {
    const data = await ListBuilding();
    if (data && data.length > 0) {
      setBuildings(data);
    }
  };
  // ดึงข้อมูล Room
  const fetchRooms = async () => {
    const data = await ListRoom();
    if (data) setRooms(data);
  };

  useEffect(() => {
    fetchBuildings();
    fetchRooms();
  }, []);

  const handleCreateSuccess = () => {
    fetchRooms();
    setShowAddModal(false);
  };
  const handleUpdateSuccess = () => {
    fetchRooms();
    setShowEditModal(false);
    setSelectedRoom(null);
  };

  const handleDelete = (roomId: number, roomName: string) => {
    selectedRoomIdRef.current = roomId;
    setSelectedRoomName(roomName);
    setOpenConfirmModal(true);
  };
  const confirmDelete = async () => {
    if (selectedRoomIdRef.current === null) return;
    const success = await DeleteRoomById(selectedRoomIdRef.current);
    if (success) {
      fetchRooms();
      setOpenConfirmModal(false);
      selectedRoomIdRef.current = null;
      setSelectedRoomName("");
    } else {
      alert("ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };
  const cancelDelete = () => {
    selectedRoomIdRef.current = null;
    setSelectedRoomName("");
    setOpenConfirmModal(false);
  };
  const handleEditClick = (room: RoomInterface) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  // Query filter logic
  const allFloors = Array.from(new Set(rooms.map((r) => r.Floor))).sort((a: any, b: any) => a - b);
  const filterRooms = rooms.filter((room) => {
    if (queryBuilding && room.Building?.ID !== queryBuilding) return false;
    if (queryFloor && String(room.Floor) !== queryFloor) return false;
    if (queryName && !room.RoomName?.toLowerCase().includes(queryName.toLowerCase())) return false;
    return true;
  });

  // ==== MAIN RENDER ====
  return (
    <div className="min-h-screen bg-gray-100 mt-16 md:mt-0">
      <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-8 py-6 rounded-b-3xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold drop-shadow-md">ข้อมูลอาคาร</h1>
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

      {/* Query Section ขวาสุด */}
      <div className="flex md:justify-end mb-6 mx-2 md:mx-8">
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center w-full md:w-fit">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <FaBuilding className="text-teal-700" />
            <select
              value={queryBuilding}
              onChange={(e) => setQueryBuilding(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-lg border border-teal-200 px-3 py-2 bg-teal-50 focus:outline-none"
            >
              <option value="">ทุกอาคาร</option>
              {buildings.map((b) => (
                <option key={b.ID} value={b.ID}>
                  {b.BuildingName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <FaLayerGroup className="text-teal-700" />
            <select
              value={queryFloor}
              onChange={(e) => setQueryFloor(e.target.value)}
              className="rounded-lg border border-teal-200 px-3 py-2 bg-teal-50 focus:outline-none"
            >
              <option value="">ทุกชั้น</option>
              {allFloors.map((floor) => (
                <option key={floor} value={String(floor)}>
                  ชั้น {floor}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <FaSearch className="text-teal-700" />
            <input
              type="text"
              value={queryName}
              onChange={e => setQueryName(e.target.value)}
              placeholder="ค้นหาชื่อห้อง..."
              className="rounded-lg border border-teal-200 px-3 py-2 w-full bg-teal-50 focus:outline-none"
            />
          </div>
          <button
            className="text-teal-600 underline text-xs"
            onClick={() => {
              setQueryBuilding("");
              setQueryFloor("");
              setQueryName("");
            }}
          >
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* --- Group by Building Card --- */}
      <div className="px-2 md:px-8 pb-12">
        {buildings.map((building) => {
          const roomInBuilding = filterRooms.filter(r => r.Building?.ID === building.ID);
          if (roomInBuilding.length === 0) return null;
          return (
            <div
              key={building.ID}
              className="
                bg-white rounded-3xl shadow-md mb-10
                p-5
                flex flex-col
                transition hover:shadow-lg
              "
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-teal-400 via-white to-teal-100 shadow p-3 rounded-full flex items-center justify-center">
                  <FaBuilding className="text-teal-500 text-2xl drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-teal-700">{building.BuildingName || '-'}</h2>
                  <div className="text-gray-400 text-xs font-medium">
                    Room ทั้งหมดในอาคารนี้: <span className="font-semibold text-teal-600">{roomInBuilding.length}</span>
                  </div>
                </div>
              </div>
              {/* Room Cards Grid */}
              <div className="flex flex-wrap gap-6 justify-start p-1">
                {roomInBuilding.map((room, idx) => (
                  <RoomCard
                    key={room.ID ?? idx}
                    name={room.RoomName || 'No Data'}
                    floor={`Floor ${room.Floor !== undefined ? room.Floor : '-'}`}
                    building={building.BuildingName || 'No Data'}
                    image={Image}
                    onUpdate={() => handleEditClick(room)}
                    onDelete={() => handleDelete(room.ID!, room.RoomName || 'No Data')}
                    hardwareID={room.Hardware?.ID!}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AddRoomModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreateSuccess={handleCreateSuccess}
      />

      {selectedRoom && (
        <EditRoomModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSaveSuccess={handleUpdateSuccess}
          initialData={selectedRoom}
        />
      )}

      <Modal open={openConfirmModal} onClose={cancelDelete}>
        <div className="text-center w-56 relative">
          <Trash2 size={56} className="mx-auto text-red-500" />
          <div className="mx-auto my-4 w-48">
            <h3 className="text-lg font-black text-gray-800">ยืนยันการลบ</h3>
            <h2 className="font-semibold text-gray-700">{selectedRoomName}</h2>
            <p className="text-sm text-gray-500">
              คุณแน่ใจว่าต้องการลบรายการนี้ใช่หรือไม่?
            </p>
          </div>
          <div className="flex gap-4">
            <button
              className="btn btn-danger w-full"
              onClick={confirmDelete}
            >
              ลบ
            </button>
            <button
              className="btn btn-light w-full"
              onClick={cancelDelete}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Index;
 