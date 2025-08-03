import React, { useState, useEffect } from 'react';
import { Input, Select, Button, message } from 'antd';
import {
  FaMicroscope,
  FaVial,
  FaFlask,
  FaLaptopMedical,
  FaBiohazard,
  FaDna,
  FaSyringe,
  FaNotesMedical,
  FaProcedures,
  FaBriefcaseMedical,
  FaCapsules,
  FaHeartbeat,
  FaStethoscope,
  FaThermometerHalf,
  FaRadiation,
} from 'react-icons/fa';
import { IconType } from 'react-icons';
import { UpdateRoom, ListBuilding, ListHardware } from '../../../../../../services/hardware';
import { RoomInterface } from '../../../../../../interface/IRoom';
import { BuildingInterface } from '../../../../../../interface/IBuilding';
import { HardwareInterface } from '../../../../../../interface/IHardware';

const { Option } = Select;

const iconOptions: { name: string; label: string; component: IconType }[] = [
  { name: 'FaMicroscope', label: 'กล้องจุลทรรศน์', component: FaMicroscope },
  { name: 'FaVial', label: 'ขวดทดลอง', component: FaVial },
  { name: 'FaFlask', label: 'ขวดรูปชมพู่', component: FaFlask },
  { name: 'FaLaptopMedical', label: 'โน้ตบุ๊กการแพทย์', component: FaLaptopMedical },
  { name: 'FaBiohazard', label: 'สัญลักษณ์ชีวภาพ', component: FaBiohazard },
  { name: 'FaDna', label: 'ดีเอ็นเอ', component: FaDna },
  { name: 'FaSyringe', label: 'เข็มฉีดยา', component: FaSyringe },
  { name: 'FaNotesMedical', label: 'สมุดบันทึกการแพทย์', component: FaNotesMedical },
  { name: 'FaProcedures', label: 'ผู้ป่วยบนเตียง', component: FaProcedures },
  { name: 'FaBriefcaseMedical', label: 'กระเป๋าพยาบาล', component: FaBriefcaseMedical },
  { name: 'FaCapsules', label: 'แคปซูลยา', component: FaCapsules },
  { name: 'FaHeartbeat', label: 'หัวใจเต้น', component: FaHeartbeat },
  { name: 'FaStethoscope', label: 'หูฟังแพทย์', component: FaStethoscope },
  { name: 'FaThermometerHalf', label: 'เทอร์โมมิเตอร์', component: FaThermometerHalf },
  { name: 'FaRadiation', label: 'สัญลักษณ์รังสี', component: FaRadiation },
];

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

  const selectedIcon = iconOptions.find(i => i.name === room.Icon)?.component;

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
    if (!room.RoomName || !room.Floor || !room.Building?.ID || !room.Hardware?.ID || !room.Icon) {
      message.error('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    setLoading(true);

    const res = await UpdateRoom(room.ID!, {
      RoomName: room.RoomName,
      Floor: room.Floor,
      Building: room.Building,
      Hardware: room.Hardware,
      Icon: room.Icon,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-xl relative">
        <h2 className="text-center text-lg font-bold bg-teal-600 text-white py-3 rounded-t-lg mb-6 shadow">
          แก้ไขข้อมูลพื้นที่ติดตั้งเซนเซอร์
        </h2>

        {/* Icon Preview */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md border border-teal-600">
            {selectedIcon ? React.createElement(selectedIcon, { size: 40, className: "text-teal-600" }) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            placeholder="ชื่อห้อง"
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

          {/* Icon Select */}
          <Select
            placeholder="เลือกไอคอน"
            value={room.Icon || undefined}
            onChange={(val) => handleChange('Icon', val)}
            allowClear
            className="w-full col-span-2"
            showSearch
            optionLabelProp="label"
          >
            {iconOptions.map(({ name, label, component: Icon }) => (
              <Option key={name} value={name} label={label}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-teal-600 flex items-center justify-center shadow">
                    <Icon size={20} className="text-teal-600" />
                  </div>
                  <span className="text-gray-800 font-medium">{label}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-4">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700">
            บันทึก
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditRoomModal;
