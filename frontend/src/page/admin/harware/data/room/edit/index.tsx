import React, { useState, useEffect } from 'react';
import { Input, Select, Button, message } from 'antd';
import { UpdateRoom, ListBuilding, ListHardware } from '../../../../../../services/hardware';
import { RoomInterface } from '../../../../../../interface/IRoom';
import { BuildingInterface } from '../../../../../../interface/IBuilding';
import { HardwareInterface } from '../../../../../../interface/IHardware';

const { Option } = Select;

interface Props {
  show: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  initialData: RoomInterface;
}

const EditRoomModal: React.FC<Props> = ({ show, onClose, onSaveSuccess, initialData }) => {
  const [room, setRoom] = useState<RoomInterface>(initialData);
  const [buildings, setBuildings] = useState<BuildingInterface[]>([]);
  const [hardwares, setHardwares] = useState<HardwareInterface[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setRoom(initialData);
      (async () => {
        const b = await ListBuilding();
        const h = await ListHardware();
        if (b) setBuildings(b);
        if (h) setHardwares(h);
      })();
    }
  }, [show, initialData]);

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

    const res = await UpdateRoom(room.ID!, {
      RoomName: room.RoomName,
      Floor: room.Floor,
      Building: room.Building,
      Hardware: room.Hardware,
    });

    setLoading(false);

    if (res) {
      message.success('แก้ไขสำเร็จ');
      onSaveSuccess();
    } else {
      message.error('เกิดข้อผิดพลาดในการแก้ไข');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-xl relative">
        <h2 className="text-center text-lg font-bold bg-teal-600 text-white py-2 rounded-t-lg mb-6">
          แก้ไขข้อมูลพื้นที่ติดตั้งเซนเซอร์
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            placeholder="ห้องผู้ป่วยนอก"
            name="RoomName"
            value={room.RoomName}
            onChange={(e) => handleChange('RoomName', e.target.value)}
            allowClear
          />

          <Select
            placeholder="เลือกเซนเซอร์"
            value={room.Hardware?.ID || undefined}
            onChange={(val) => handleChange('Hardware', hardwares.find(h => h.ID === val))}
            allowClear
            className="w-full"
          >
            {hardwares.map((hw) => (
              <Option key={hw.ID} value={hw.ID}>
                {hw.Name}
              </Option>
            ))}
          </Select>

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

          <Select
            placeholder="เลือกอาคาร"
            value={room.Building?.ID || undefined}
            onChange={(val) => handleChange('Building', buildings.find(b => b.ID === val))}
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
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            บันทึก
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditRoomModal;
