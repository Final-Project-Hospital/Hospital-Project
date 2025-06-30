import React, { useEffect, useState, useRef } from 'react';
import { FaHome, FaEdit, FaTrash } from 'react-icons/fa';
import { Trash2 } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import Image from "../../../assets/operating-room_4246637.png";
import AddRoomModal from './data/room/create';        
import EditRoomModal from './data/room/edit';         
import Modal from '../harware/data/room/delete';      
import { ListRoom, DeleteRoomById } from '../../../services/hardware';
import { RoomInterface } from '../../../interface/IRoom';

interface RoomCardProps {
  name: string;
  floor: string;
  building: string;
  image: string;
  onUpdate: () => void;
  onDelete: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({
  name,
  floor,
  building,
  image,
  onUpdate,
  onDelete
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/admin/Room')}
      className="bg-white rounded-2xl shadow-lg p-6 flex justify-between items-center w-full max-w-md transition hover:shadow-xl cursor-pointer"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="bg-teal-100 text-teal-800 font-bold px-2 py-1 rounded w-fit">
            {name}
          </div>
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate();
              }}
              className="text-gray-600 hover:text-blue-600"
            >
              <FaEdit size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-gray-600 hover:text-red-600"
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>

        <p className="text-gray-700">{floor}</p>
        <p className="text-gray-700">{building}</p>
      </div>

      <img src={image} alt={name} className="w-24 h-24 object-contain" />
    </div>
  );
};

const Index: React.FC = () => {
  const [rooms, setRooms] = useState<RoomInterface[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const selectedRoomIdRef = useRef<number | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");

  // เก็บข้อมูลห้องที่เลือกแก้ไข
  const [selectedRoom, setSelectedRoom] = useState<RoomInterface | null>(null);

  const fetchRooms = async () => {
    const data = await ListRoom();
    if (data) setRooms(data);
  };

  useEffect(() => {
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

  // กดปุ่ม edit
  const handleEditClick = (room: RoomInterface) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 mt-24 md:mt-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-8 py-6 rounded-b-3xl mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold drop-shadow-md">ข้อมูลเซนเซอร์</h1>
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

      {/* Room Cards */}
      <div className="flex gap-6 flex-wrap justify-start p-6">
        {rooms.map((room, index) => (
          <RoomCard
            key={index}
            name={room.RoomName ?? 'No Data'}
            floor={`Floor ${room.Floor}`}
            building={room.Building?.BuildingName || 'No Data Building'}
            image={Image}
            onUpdate={() => handleEditClick(room)}  
            onDelete={() => handleDelete(room.ID!, room.RoomName ?? 'No Data')}
          />
        ))}
      </div>

      {/* Modal เพิ่มห้อง */}
      <AddRoomModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreateSuccess={handleCreateSuccess}
      />

      {/* Modal แก้ไขห้อง */}
      {selectedRoom && (
        <EditRoomModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSaveSuccess={handleUpdateSuccess}
          initialData={selectedRoom}
        />
      )}

      {/* Modal ยืนยันการลบ */}
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
