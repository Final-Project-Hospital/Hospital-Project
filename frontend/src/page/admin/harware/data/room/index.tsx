import React, { useEffect, useState } from 'react';
import { Input, Select, Button, message } from 'antd';
import { CreateRoom, ListBuilding, ListHardware } from '../../../../../services/hardware';
import { RoomInterface } from '../../../../../interface/IRoom';
import { BuildingInterface } from '../../../../../interface/IBuilding';
import { HardwareInterface } from '../../../../../interface/IHardware';

const { Option } = Select;

interface Props {
  show: boolean;
  onClose: () => void;
  onCreateSuccess: () => void;
}

const AddRoomModal: React.FC<Props> = ({ show, onClose, onCreateSuccess }) => {
  const [room, setRoom] = useState<RoomInterface>({
    RoomName: '',
    Floor: '',
    Employee: { ID: 1 }, // default 1
  });

  const [buildings, setBuildings] = useState<BuildingInterface[]>([]);
  const [hardwares, setHardwares] = useState<HardwareInterface[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const b = await ListBuilding();
      const h = await ListHardware();

      if (b) setBuildings(b);
      if (h) setHardwares(h);
    };

    if (show) {
      fetchData();
      setRoom((prev) => ({ ...prev, Employee: { ID: 1 } }));
    }
  }, [show]);

  const handleChange = (field: keyof RoomInterface, value: any) => {
    setRoom((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!room.RoomName || !room.Floor || !room.Building?.ID || !room.Hardware?.ID) {
      message.error('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    setLoading(true);

    const payload: RoomInterface = {
      RoomName: room.RoomName,
      Floor: room.Floor,
      Building: buildings.find((b) => b.ID === Number(room.Building?.ID)),
      Employee: { ID: 1 },
      Hardware: hardwares.find((h) => h.ID === Number(room.Hardware?.ID)),
    };

    const res = await CreateRoom(payload);
    setLoading(false);

    if (res) {
      message.success('บันทึกสำเร็จ');
      onCreateSuccess();  // แจ้งให้ parent โหลดข้อมูลใหม่และปิด modal
    } else {
      message.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleReset = () => {
    setRoom({ RoomName: '', Floor: '', Employee: { ID: 1 } });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-xl relative">
        <h2 className="text-center text-lg font-bold bg-teal-600 text-white py-2 rounded-t-lg mb-6">
          เพิ่มข้อมูลพื้นที่ติดตั้งเซนเซอร์
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* RoomName Input */}
          <Input
            placeholder="ห้องผู้ป่วยนอก"
            name="RoomName"
            value={room.RoomName}
            onChange={(e) => handleChange('RoomName', e.target.value)}
            allowClear
          />

          {/* Hardware Select */}
          <Select
            placeholder="เลือกเซนเซอร์"
            value={room.Hardware?.ID || undefined}
            onChange={(val) => handleChange('Hardware', { ID: val })}
            allowClear
            className="w-full"
          >
            {hardwares.map((hw) => (
              <Option key={hw.ID} value={hw.ID}>
                {hw.Name}
              </Option>
            ))}
          </Select>

          {/* Floor Input (รับเฉพาะเลข) */}
          <Input
            placeholder="ชั้น เช่น 7"
            value={room.Floor}
            maxLength={2}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              handleChange('Floor', val);
            }}
            allowClear
          />

          {/* Building Select */}
          <Select
            placeholder="เลือกอาคาร"
            value={room.Building?.ID || undefined}
            onChange={(val) => handleChange('Building', { ID: val })}
            allowClear
            className="w-full"
          >
            {buildings.map((b) => (
              <Option key={b.ID} value={b.ID}>
                {b.BuildingName}
              </Option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-4">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleReset}>รีเซ็ต</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            บันทึก
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddRoomModal;
