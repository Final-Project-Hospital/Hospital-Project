import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { IconBaseProps } from 'react-icons'; // ✅ ต้อง import

interface RoomCardProps {
  name: string;
  floor: string;
  building: string;
  IconComponent: React.ComponentType<IconBaseProps>; // ✅ แก้ตรงนี้
  onUpdate: () => void;
  onDelete: () => void;
  hardwareID: number;
}

const RoomCard: React.FC<RoomCardProps> = ({
  name,
  floor,
  building,
  IconComponent,
  onUpdate,
  onDelete,
  hardwareID,
}) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate('/admin/Room', { state: { hardwareID } })}
      className="bg-white rounded-2xl shadow p-4 flex flex-row items-center w-[375px] min-h-[120px] cursor-pointer transition hover:shadow-lg"
    >
      <div className="flex flex-col flex-1 justify-center h-full">
        <div className="flex items-center gap-2">
          <div className="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded text-sm">
            {name}
          </div>
          <button onClick={e => { e.stopPropagation(); onUpdate(); }} className="ml-1 text-gray-500 hover:text-blue-600">
            <FaEdit size={15} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="ml-1 text-gray-500 hover:text-red-600">
            <FaTrash size={15} />
          </button>
        </div>
        <div className="mt-1 ml-1">
          <div className="text-gray-700 text-[15px] font-medium">ชั้น : {floor.replace("Floor ", "")}</div>
          <div className="text-gray-500 text-[15px] font-medium">อาคาร : {building}</div>
        </div>
      </div>
      <div className="ml-5">
        <IconComponent className="text-teal-600" size={48} />
      </div>
    </div>
  );
};

export default RoomCard;
