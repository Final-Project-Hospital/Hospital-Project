import React, { useEffect, useState } from "react";
import { Modal, Form, Input, message, Spin, Select, Tooltip, Checkbox } from "antd";
import {
  ListHardwareParameterByHardwareID,
  UpdateStandardHardwareByID,
  UpdateUnitHardwareByID,
  UpdateIconByHardwareParameterID,
} from "../../../../../services/hardware";

// React Icons
import * as FaIcons from "react-icons/fa";
import * as GiIcons from "react-icons/gi";
import * as BiIcons from "react-icons/bi";
import * as AiIcons from "react-icons/ai";
import * as MdIcons from "react-icons/md";
import type { IconType } from "react-icons";

const { Option } = Select;

interface EditStandardUnitModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hardwareID: number;
}

type IconOption = { name: string; label: string; component: IconType };

// ✅ รายการไอคอน
const iconOptions: IconOption[] = [
  { name: "FaMicroscope", label: "กล้องจุลทรรศน์", component: FaIcons.FaMicroscope },
  { name: "FaTemperatureHigh", label: "อุณหภูมิสูง", component: FaIcons.FaTemperatureHigh },
  { name: "FaTint", label: "หยดน้ำ", component: FaIcons.FaTint },
  { name: "FaThermometerHalf", label: "เทอร์โมมิเตอร์", component: FaIcons.FaThermometerHalf },
  { name: "GiChemicalDrop", label: "สารเคมี", component: GiIcons.GiChemicalDrop },
  { name: "GiFireBottle", label: "ขวดไฟ", component: GiIcons.GiFireBottle },
  { name: "GiGasMask", label: "หน้ากากกันแก๊ส", component: GiIcons.GiGasMask },
  { name: "GiWaterDrop", label: "หยดน้ำบริสุทธิ์", component: GiIcons.GiWaterDrop },
  { name: "BiTestTube", label: "หลอดทดลอง", component: BiIcons.BiTestTube },
  { name: "GiRoundBottomFlask", label: "ขวดฟลาสก์", component: GiIcons.GiRoundBottomFlask },
  { name: "AiOutlineDotChart", label: "กราฟจุด", component: AiIcons.AiOutlineDotChart },
  { name: "MdScience", label: "วิทยาศาสตร์", component: MdIcons.MdScience },
  { name: "MdWaterDrop", label: "หยดน้ำ", component: MdIcons.MdWaterDrop },
  { name: "MdOutlineWbSunny", label: "แสงแดด", component: MdIcons.MdOutlineWbSunny },
  { name: "MdAir", label: "อากาศ", component: MdIcons.MdAir },
];

// แปลงเป็น map
const iconMap: Record<string, IconType> = iconOptions.reduce((acc, cur) => {
  acc[cur.name] = cur.component;
  return acc;
}, {} as Record<string, IconType>);

// ---------- UI helper ----------
const SectionHeader: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="text-[1.05rem] font-semibold text-teal-700">{title}</div>
    {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
  </div>
);

const NumberItem: React.FC<{
  name: string;
  placeholder: string;
  requiredMsg: string;
}> = ({ name, placeholder, requiredMsg }) => (
  <Form.Item
    name={name}
    rules={[
      {
        required: true,
        validator: (_, value) => {
          const text = value?.toString?.() ?? "";
          if (text === "") return Promise.reject(requiredMsg);
          if (Number.isNaN(Number(text))) return Promise.reject("ต้องเป็นตัวเลข");
          return Promise.resolve();
        },
      },
    ]}
    noStyle
  >
    <Input
      type="number"
      step="0.01"
      placeholder={placeholder}
      className="w-full rounded-md border border-gray-300 h-10"
    />
  </Form.Item>
);

// ✅ คอมโพเนนต์ย่อย ParamRow
const ParamRow: React.FC<{
  form: any;
  param: any;
}> = ({ form, param }) => {
  const fieldIcon = `icon_${param.ID}`;
  const fieldAlert = `alert_${param.ID}`;
  const iconName = Form.useWatch(fieldIcon, form) as string | undefined;//@ts-ignore
  const alertValue = Form.useWatch(fieldAlert, form) as boolean | undefined;
  const IconPreview = iconMap[iconName || "FaMicroscope"];

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filterOption = (input: string, option?: any) =>
    (option?.label as string)?.toLowerCase().includes(input.toLowerCase());

  return (
    <div className="bg-white border border-teal-100 rounded-2xl px-6 py-5 mb-5 shadow-sm hover:shadow-md transition-shadow">
      <SectionHeader
        title={param.Parameter}
        hint={isMobile ? undefined : "ปรับค่าและไอคอนให้เหมาะกับพารามิเตอร์นี้"}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 lg:grid-cols-12 gap-6">
        {/* LEFT: Icon Preview */}
        <div className="xl:col-span-2 lg:col-span-3 flex lg:block items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md border border-teal-500">
              {IconPreview ? <IconPreview size={42} className="text-teal-600" /> : null}
            </div>
            <div className="text-xs text-gray-500">ไอคอนปัจจุบัน</div>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="xl:col-span-10 lg:col-span-9">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Min */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                * Min Standard
              </label>
              <NumberItem
                name={`min_standard_${param.ID}`}
                placeholder="เช่น 0.00"
                requiredMsg="กรุณากรอกค่า Min Standard"
              />
              <div className="text-[11px] text-gray-400 mt-1">ค่านี้ใช้เป็นเกณฑ์ต่ำสุด</div>
            </div>

            {/* Max */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                * Max Standard
              </label>
              <NumberItem
                name={`max_standard_${param.ID}`}
                placeholder="เช่น 10.00"
                requiredMsg="กรุณากรอกค่า Max Standard"
              />
              <div className="text-[11px] text-gray-400 mt-1">ค่านี้ใช้เป็นเกณฑ์สูงสุด</div>
            </div>

            {/* Unit */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">* หน่วย</label>
              <Form.Item
                name={`unit_${param.ID}`}
                rules={[{ required: true, message: "กรุณากรอกหน่วย" }]}
                noStyle
              >
                <Input
                  className="w-full rounded-md border border-gray-300 h-10"
                  placeholder="เช่น ppm, °C, %"
                />
              </Form.Item>
              <div className="text-[11px] text-gray-400 mt-1">หน่วยแสดงผลของพารามิเตอร์นี้</div>
            </div>

            {/* Icon Select */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  * Icon
                </label>
                <Tooltip title="เลือกไอคอนที่สื่อความหมายกับพารามิเตอร์">
                  <AiIcons.AiOutlineQuestionCircle className="text-gray-400" />
                </Tooltip>
              </div>
              <Form.Item
                name={fieldIcon}
                rules={[{ required: true, message: "กรุณาเลือกไอคอน" }]}
                noStyle
              >
                <Select
                  className="w-full"
                  showSearch
                  optionLabelProp="label"
                  filterOption={filterOption}
                  placeholder="เลือกไอคอน"
                  dropdownStyle={{ padding: 6 }}
                >
                  {iconOptions.map(({ name, label, component: Icon }) => (
                    <Option key={name} value={name} label={label}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white border border-teal-600 flex items-center justify-center shadow">
                          <Icon size={18} className="text-teal-600" />
                        </div>
                        <span className="text-gray-800 text-sm">{label}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {/* Alert Checkbox */}
            <div className="md:col-span-2 flex flex-col justify-end">
              <Form.Item name={fieldAlert} valuePropName="checked" noStyle>
                <Checkbox>เปิดการแจ้งเตือน</Checkbox>
              </Form.Item>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditStandardUnitModal: React.FC<EditStandardUnitModalProps> = ({
  open,
  onClose,
  onSuccess,
  hardwareID,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<any[]>([]);
    const [employeeid, setEmployeeid] = useState<number>(
    Number(localStorage.getItem("employeeid")) || 0
  );

  useEffect(() => {
    setEmployeeid(Number(localStorage.getItem("employeeid")));
    if (!open || !hardwareID) return;
    setLoading(true);

    ListHardwareParameterByHardwareID(hardwareID)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid parameter list");
        setParams(data);

        const initialValues: Record<string, any> = {};
        data.forEach((param) => {
          const maxStd = param.StandardHardware?.MaxValueStandard;
          const minStd = param.StandardHardware?.MinValueStandard;

          initialValues[`max_standard_${param.ID}`] =
            typeof maxStd === "number" ? maxStd : "";
          initialValues[`min_standard_${param.ID}`] =
            typeof minStd === "number" ? minStd : "";
          initialValues[`unit_${param.ID}`] = param?.UnitHardware?.Unit ?? "";
          initialValues[`icon_${param.ID}`] = param?.Icon || "FaMicroscope";
          initialValues[`alert_${param.ID}`] = !!param?.Alert;
        });

        form.setFieldsValue(initialValues);
      })
      .catch(() => message.error("ไม่สามารถโหลดข้อมูลพารามิเตอร์ได้"))
      .finally(() => setLoading(false));
  }, [open, hardwareID, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await Promise.all(
        params.map(async (param) => {
          const rawMax = values[`max_standard_${param.ID}`];
          const rawMin = values[`min_standard_${param.ID}`];
          const rawUnit = values[`unit_${param.ID}`];
          const icon = values[`icon_${param.ID}`];
          const alert = values[`alert_${param.ID}`];

          const maxVal = Number(rawMax);
          const minVal = Number(rawMin);

          if (Number.isNaN(maxVal)) {
            throw new Error(`Max Standard ของ ${param.Parameter} ไม่ถูกต้อง`);
          }
          if (Number.isNaN(minVal)) {
            throw new Error(`Min Standard ของ ${param.Parameter} ไม่ถูกต้อง`);
          }
          if (minVal > maxVal) {
            throw new Error(
              `Min (${minVal}) ต้องน้อยกว่าหรือเท่ากับ Max (${maxVal}) ของ ${param.Parameter}`
            );
          }

          const tasks: Promise<any>[] = [];

          if (param?.StandardHardware?.ID) {
            tasks.push(
              UpdateStandardHardwareByID(param.StandardHardware.ID, {
                MaxValueStandard: maxVal,
                MinValueStandard: minVal,
              })
            );
          }
          if (param?.UnitHardware?.ID) {
            tasks.push(
              UpdateUnitHardwareByID(param.UnitHardware.ID, {
                Unit: String(rawUnit ?? ""),
                employee_id: employeeid,
              } as any)
            );
          }

          // ✅ อัปเดต Icon + Alert
          tasks.push(UpdateIconByHardwareParameterID(param.ID, icon, alert));

          await Promise.all(tasks);
        })
      );

      message.success("อัปเดตข้อมูลเรียบร้อยแล้ว");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      style={{ top: 50 }}
      width={"min(1280px, 96vw)"}
      closable={false}
      className="rounded-xl"
    >
      {/* Header */}
      <div className="bg-teal-600 text-white text-[1.15rem] font-semibold text-center py-3 rounded-t-xl tracking-wide">
        แก้ไขค่า Standard (Min/Max), หน่วย, ไอคอน และการแจ้งเตือน
      </div>

      <div className="px-4 sm:px-6 pt-4 pb-2 max-h-[80vh] overflow-y-auto bg-white">
        <Spin spinning={loading}>
          <Form layout="vertical" form={form} scrollToFirstError>
            {params.map((param) => (
              <ParamRow key={param.ID} form={form} param={param} />
            ))}
          </Form>
        </Spin>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 pb-5">
          <button
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm rounded-md text-white bg-teal-600 hover:bg-teal-700 transition"
          >
            บันทึก
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditStandardUnitModal;
