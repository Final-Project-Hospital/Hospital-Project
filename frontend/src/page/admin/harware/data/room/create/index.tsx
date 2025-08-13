import React, { useEffect, useState } from 'react';
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
import {
  CreateRoom,
  ListBuilding,
  ListHardware,
  ListRoom,
} from '../../../../../../services/hardware';
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
  onCreateSuccess: () => void;
}

const AddRoomModal: React.FC<Props> = ({ show, onClose, onCreateSuccess }) => {
  const [room, setRoom] = useState<RoomInterface>({
    RoomName: '',
    Floor: '',
    Employee: { ID: 1 },
    Icon: 'FaMicroscope',
  });

  const [buildings, setBuildings] = useState<BuildingInterface[]>([]);
  const [allHardwares, setAllHardwares] = useState<HardwareInterface[]>([]);
  const [usedHardwareIDs, setUsedHardwareIDs] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedIcon = iconOptions.find(i => i.name === room.Icon)?.component;

  useEffect(() => {
    const fetchData = async () => {
      const b = await ListBuilding();
      const h = await ListHardware();
      const r = await ListRoom();

      if (b) setBuildings(b);
      if (h) setAllHardwares(h);

      if (r) {
        const used = r
          .map(room => room.Hardware?.ID)
          .filter((id): id is number => id !== undefined);
        setUsedHardwareIDs(used);
      }
    };

    if (show) {
      setRoom({ RoomName: '', Floor: '', Employee: { ID: 1 }, Icon: 'FaMicroscope' });
      fetchData();
    }
  }, [show]);

  const handleChange = (field: keyof RoomInterface, value: any) => {
    setRoom((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!room.RoomName || !room.Floor || !room.Building?.ID || !room.Icon) {
      message.warning('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    if (availableHardwares.length === 0) {
      message.warning('ไม่มีอุปกรณ์เซนเซอร์พร้อมใช้งาน');
      return;
    }

    if (!room.Hardware?.ID) {
      message.warning('กรุณาเลือกอุปกรณ์เซนเซอร์');
      return;
    }

    setLoading(true);
    const payload: RoomInterface = {
      RoomName: room.RoomName,
      Floor: room.Floor,
      Building: buildings.find((b) => b.ID === Number(room.Building?.ID)),
      Employee: { ID: 1 },
      Hardware: allHardwares.find((h) => h.ID === Number(room.Hardware?.ID)),
      Icon: room.Icon,
    };
    const res = await CreateRoom(payload);
    setLoading(false);

    if (res) {
      message.success('บันทึกสำเร็จ');
      onCreateSuccess()
      onClose()
    } else {
      message.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleReset = () => {
    setRoom({ RoomName: '', Floor: '', Employee: { ID: 1 }, Icon: 'FaMicroscope' });
  };

  const availableHardwares = allHardwares.filter(
    hw => !usedHardwareIDs.includes(hw.ID!)
  );

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-xl relative">
        <h2 className="text-center text-lg font-bold bg-teal-600 text-white py-3 rounded-t-lg mb-6 shadow">
          เพิ่มข้อมูลพื้นที่ติดตั้งเซนเซอร์
        </h2>

        {/* Icon Preview */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md border border-teal-600">
            {selectedIcon ? React.createElement(selectedIcon, { size: 40, className: "text-teal-600" }) : null}
          </div>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            placeholder="ชื่อห้อง"
            value={room.RoomName}
            onChange={(e) => handleChange('RoomName', e.target.value)}
            allowClear
          />

          <Select
            placeholder="เลือกเซนเซอร์"
            value={room.Hardware?.ID || undefined}
            onChange={(val) => handleChange('Hardware', { ID: val })}
            allowClear
            className="w-full"
          >
            {availableHardwares.length > 0 ? (
              availableHardwares.map((hw) => (
                <Option key={hw.ID} value={hw.ID}>
                  {hw.Name}
                </Option>
              ))
            ) : (
              <Option disabled key="no-hardware" value="">
                ไม่มีอุปกรณ์พร้อมใช้งาน
              </Option>
            )}
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

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleReset}>รีเซ็ต</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            className="bg-teal-600 hover:bg-teal-700"
          >
            บันทึก
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddRoomModal;
