import React from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
}

const AddRoomModal: React.FC<Props> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-xl relative">
        <h2 className="text-center text-lg font-bold bg-teal-600 text-white py-2 rounded-t-lg mb-6">
          เพิ่มข้อมูลพื้นที่ติดตั้งเซนเซอร์
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="ห้องผู้ป่วยนอก"
            className="border rounded-full px-4 py-2 w-full"
          />
          <select className="border rounded-full px-4 py-2 w-full">
            <option>เซนเซอร์ 01</option>
            <option>เซนเซอร์ 02</option>
          </select>
          <input
            type="text"
            placeholder="ชั้น 7"
            className="border rounded-full px-4 py-2 w-full"
          />
          <input
            type="text"
            placeholder="อาคารรัตนเวชพัฒน์"
            className="border rounded-full px-4 py-2 w-full"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => alert("ล้างข้อมูล")}
            className="px-6 py-2 rounded-full bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 transition"
          >
            รีเซ็ต
          </button>
          <button
            onClick={() => alert("บันทึกสำเร็จ")}
            className="px-6 py-2 rounded-full bg-teal-700 text-white hover:bg-teal-800 transition"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRoomModal;
