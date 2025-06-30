import React, { useEffect, useState } from 'react';
import { FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Image from "../../../assets/operating-room_4246637.png";
import AddRoomModal from './data/room/index';
import { ListRoom } from '../../../services/hardware';
import { RoomInterface } from '../../../interface/IRoom';

const RoomCard: React.FC<{
  name: string;
  floor: string;
  building: string;
  image: string;
}> = ({ name, floor, building, image }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/admin/Room')}
      className="bg-white rounded-2xl shadow-lg p-6 flex justify-between items-center w-full max-w-md transition hover:shadow-xl cursor-pointer"
    >
      <div>
        <div className="bg-teal-100 text-teal-800 font-bold px-2 py-1 rounded w-fit mb-2">{name}</div>
        <p className="text-gray-700">{floor}</p>
        <p className="text-gray-700">{building}</p>
      </div>
      <img src={image} alt={name} className="w-24 h-24 object-contain" />
    </div>
  );
};

const Index: React.FC = () => {
  const [rooms, setRooms] = useState<RoomInterface[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchRooms = async () => {
    const data = await ListRoom();
    if (data) {
      setRooms(data);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateSuccess = () => {
    fetchRooms();
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 mt-24 md:mt-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-400 text-white p-6 rounded-2xl shadow-md mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ข้อมูลเซนเซอร์</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-white text-teal-800 px-4 py-2 rounded-full shadow-md hover:bg-teal-100 transition"
        >
          <FaHome />
          เพิ่มห้อง
        </button>
      </div>

      {/* Room Cards */}
      <div className="flex gap-6 flex-wrap justify-start">
        {rooms.map((room, index) => (
          <RoomCard
            key={index}
            name={room.RoomName ?? 'No Data'}
            floor={`Floor ${room.Floor}`}
            building={room.Building?.BuildingName || 'No Data Building'}
            image={Image}
          />
        ))}
      </div>

      {/* Modal Component */}
      <AddRoomModal show={showModal} onClose={() => setShowModal(false)} onCreateSuccess={handleCreateSuccess} />
    </div>
  );
};

export default Index;
