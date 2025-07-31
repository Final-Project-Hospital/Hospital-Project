import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import './updateTDScenter.css';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select, Input, message } from 'antd';
import {
  ListBeforeAfterTreatment,
  ListMiddleStandard,
  ListRangeStandard,
  ListUnit
} from '../../../../services/index';
import { UpdateOrCreateTDS, DeleteTDS } from '../../../../services/tdsService';

import { ListBeforeAfterTreatmentInterface } from '../../../../interface/IBeforeAfterTreatment';
import { ListMiddleStandardInterface, ListRangeStandardInterface } from '../../../../interface/IStandard';
import { ListUnitInterface } from '../../../../interface/IUnit';

const { Option } = Select;

interface UpdateTDSCentralFormProps {
  initialValues: any; // รับค่า before/after 2 record
  onSuccess?: () => void;
  onCancel: () => void;
}

const UpdateTDSCentralForm: React.FC<UpdateTDSCentralFormProps> = ({
  initialValues,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();

  const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
  const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
  const [middleStandards, setMiddleStandards] = useState<ListMiddleStandardInterface[]>([]);
  const [rangeStandards, setRangeStandards] = useState<ListRangeStandardInterface[]>([]);
  const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);
  const [standardType, setStandardType] = useState<string>('middle');
  const [useCustomStandard, setUseCustomStandard] = useState<boolean>(false);
  const [customSingleValue, setCustomSingleValue] = useState<number | undefined>(undefined);
  const [customMinValue, setCustomMinValue] = useState<number | undefined>(undefined);
  const [customMaxValue, setCustomMaxValue] = useState<number | undefined>(undefined);
  const [isOtherUnitSelected, setIsOtherunitSelected] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const renderCustomTreatmentLabel = (text: string) => (
    <>
      ค่า TDS บริเวณบ่อพักน้ำทิ้ง
      <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span>
      เข้าระบบบำบัด
    </>
  );

  useEffect(() => {
    // โหลด options
    const fetchInitialData = async () => {
      const [beforeAfter, units, standardsMiddle, standardsRange] = await Promise.all([
        ListBeforeAfterTreatment(),
        ListUnit(),
        ListMiddleStandard(),
        ListRangeStandard()
      ]);

      if (beforeAfter) setBeforeAfterOptions(beforeAfter);
      if (units) setUnitOptions(units);
      if (standardsMiddle) setMiddleStandards(standardsMiddle);
      if (standardsRange) setRangeStandards(standardsRange);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (initialValues && initialValues.length > 0) {
      if (initialValues.length === 2) {
        const before = initialValues[0];
        const after = initialValues[1];

        const stdType = before.MinValue === 0 && before.MaxValue === 0 ? 'middle' : 'range';
        setStandardType(stdType);

        form.setFieldsValue({
          date: dayjs(before.Date),
          time: dayjs(before.Date),
          unit: before.UnitID ?? 'other',
          standardType: stdType,
          standardID: before.StandardID,
          beforeAfterTreatmentID: 3,
          valueBefore: before?.Data ?? undefined, // ✅ map เข้ากับ name="valueBefore"
          valueAfter: after?.Data ?? undefined,   // ✅ map เข้ากับ name="valueAfter"
          beforeNote: before?.Note || '',
          afterNote: after?.Note || ''
        });

        setSelectedTreatmentID(3);
      } else if (initialValues.length === 1) {
        const single = initialValues[0];
        const stdType = single.MinValue === 0 && single.MaxValue === 0 ? 'middle' : 'range';
        setStandardType(stdType);

        form.setFieldsValue({
          date: dayjs(single.Date),
          time: dayjs(single.Date),
          unit: single.UnitID ?? 'other',
          standardType: stdType,
          standardID: single.StandardID,
          beforeAfterTreatmentID: single.BeforeAfterTreatmentID,
          data: single?.Data ?? undefined, // ✅ map เข้ากับ name="data"
          beforeNote: single.BeforeAfterTreatmentID === 1 ? single.Note || '' : '',
          afterNote: single.BeforeAfterTreatmentID === 2 ? single.Note || '' : ''
        });

        setSelectedTreatmentID(single.BeforeAfterTreatmentID);
      }
    }
  }, [initialValues]);

  const handleStandardGroupChange = (value: string) => {
    setStandardType(value);
    setUseCustomStandard(false);
    form.setFieldsValue({
      standardID: undefined,
      customSingle: undefined,
      customMin: undefined,
      customMax: undefined,
    });
  };

  const handleStandardSelectChange = (value: string) => {
    if (value === 'custom') {
      setUseCustomStandard(true);
      form.setFieldsValue({ standardID: undefined });
    } else {
      setUseCustomStandard(false);
    }
  };

  const handleFinish = async (values: any) => {
    try {
      let standardID = values.standardID ?? null;

      if (!standardID) {
        message.error("กรุณาเลือกหรือกำหนดมาตรฐานก่อนบันทึก");
        return;
      }

      const combinedDateTime = dayjs(values.date)
        .hour(dayjs(values.time).hour())
        .minute(dayjs(values.time).minute())
        .second(dayjs(values.time).second())
        .toISOString();

      const employeeID = user?.ID ?? Number(localStorage.getItem("employeeid"));
      const isOther = values.unit === "other";
      const unitID = isOther ? null : values.unit;
      const customUnitValue = isOther ? values.customUnit : null;

      const payloads: any[] = [];
      const deletes: number[] = [];

      if (values.beforeAfterTreatmentID === 3) {
        // ✅ ทั้งก่อนและหลัง
        payloads.push({
          ID: initialValues[0]?.ID ?? null,
          Date: combinedDateTime,
          Data: values.valueBefore,
          Note: values.beforeNote ?? "",
          BeforeAfterTreatmentID: 1,
          UnitID: unitID,
          StandardID: standardID,
          ParameterID: initialValues[0]?.ParameterID,
          EmployeeID: employeeID,
          CustomUnit: customUnitValue,
        });
        payloads.push({
          ID: initialValues[1]?.ID ?? null,
          Date: combinedDateTime,
          Data: values.valueAfter,
          Note: values.afterNote ?? "",
          BeforeAfterTreatmentID: 2,
          UnitID: unitID,
          StandardID: standardID,
          ParameterID: initialValues[1]?.ParameterID,
          EmployeeID: employeeID,
          CustomUnit: customUnitValue,
        });
      } else if (values.beforeAfterTreatmentID === 1) {
        // ✅ ก่อนอย่างเดียว
        payloads.push({
          ID: initialValues[0]?.ID ?? null,
          Date: combinedDateTime,
          Data: values.valueBefore ?? values.data,
          Note: values.beforeNote ?? "",
          BeforeAfterTreatmentID: 1,
          UnitID: unitID,
          StandardID: standardID,
          ParameterID: initialValues[0]?.ParameterID,
          EmployeeID: employeeID,
          CustomUnit: customUnitValue,
        });
        if (initialValues[1]?.ID) {
          deletes.push(initialValues[1].ID); // ลบ after ที่ไม่ใช้แล้ว
        }
      } else if (values.beforeAfterTreatmentID === 2) {
        // ✅ หลังอย่างเดียว
        payloads.push({
          ID: initialValues[1]?.ID ?? null,
          Date: combinedDateTime,
          Data: values.valueAfter ?? values.data,
          Note: values.afterNote ?? "",
          BeforeAfterTreatmentID: 2,
          UnitID: unitID,
          StandardID: standardID,
          ParameterID: initialValues[1]?.ParameterID,
          EmployeeID: employeeID,
          CustomUnit: customUnitValue,
        });
        if (initialValues[0]?.ID) {
          deletes.push(initialValues[0].ID); // ลบ before ที่ไม่ใช้แล้ว
        }
      }

      // ✅ อัปเดต/สร้าง
      await Promise.all(payloads.map((p) => UpdateOrCreateTDS(p)));

      // ✅ ลบ record ที่ไม่ต้องการแล้ว
      if (deletes.length > 0) {
        await Promise.all(deletes.map((id) => DeleteTDS(id)));
      }

      messageApi.success("บันทึกข้อมูลสำเร็จ");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating TDS:", error);
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleCancelClick = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <div className="up-tds-container">
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          date: dayjs(),
          time: dayjs(),
          standardType: 'middle'
        }}
      >
        {/* วันที่และเวลา */}
        <div className="up-form-group-tds">
          <Form.Item label="วันที่บันทึกข้อมูล" name="date">
            <DatePicker format="DD/MM/YYYY" className="full-width-tds" />
          </Form.Item>
          <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
            <TimePicker format="HH:mm" className="full-width-tds" />
          </Form.Item>
        </div>

        {/* หน่วยที่วัด และ มาตรฐาน */}
        <div className="up-form-group-tds">
          <div className="up-form-group-mini-tds">
            <Form.Item label="หน่วยที่วัด" required>
              <Form.Item
                name="unit"
                noStyle
                rules={[{ required: true, message: 'กรุณาเลือกหน่วยที่วัด' }]}
              >
                <Select
                  placeholder="เลือกหน่วย"
                  onChange={value => {
                    setIsOtherunitSelected(value === 'other');
                    if (value !== 'other') {
                      form.setFieldsValue({ customUnit: undefined });
                    }
                  }}
                >
                  {unitOptions.map(u => (
                    <Option key={u.ID} value={u.ID}>
                      {u.UnitName}
                    </Option>
                  ))}
                  <Option value="other">กำหนดหน่วยเอง</Option>
                </Select>
              </Form.Item>
              {isOtherUnitSelected && (
                <Form.Item
                  name="customUnit"
                  rules={[{ required: true, message: 'กรุณากรอกหน่วย' }]}
                  style={{ marginTop: '8px' }}
                >
                  <Input placeholder="กรอกหน่วยกำหนดเอง" />
                </Form.Item>
              )}
            </Form.Item>
          </div>

          <div className="up-form-group-mini-tds">
            <Form.Item label="ประเภทมาตรฐาน" name="standardType">
              <Select defaultValue="middle" onChange={handleStandardGroupChange}>
                <Option value="middle">ค่าเดี่ยว</Option>
                <Option value="range">ช่วง (Min - Max)</Option>
              </Select>
            </Form.Item>

            <div style={{ position: 'relative', top: '-15px' }}>
              {/* ===== ค่าเดี่ยวแบบเลือกจากฐานข้อมูล ===== */}
              {standardType === 'middle' && !useCustomStandard && (
                <Form.Item
                  label="ค่าเดี่ยว"
                  name="standardID"
                  rules={[{ required: true, message: 'กรุณาเลือกค่าเดี่ยว' }]}
                >
                  <Select placeholder="เลือกค่าเดี่ยว" onChange={handleStandardSelectChange}>
                    {middleStandards.map((s) => (
                      <Option key={s.ID} value={s.ID}>
                        {s.MiddleValue}
                      </Option>
                    ))}
                    <Option value="custom">กำหนดเอง (ค่าเดี่ยว)</Option>
                  </Select>
                </Form.Item>
              )}

              {/* ===== ค่าเดี่ยวแบบกรอกเอง ===== */}
              {standardType === 'middle' && useCustomStandard && (
                <Form.Item
                  label="กำหนดเอง (ค่าเดี่ยว)"
                  name="customSingle"
                  rules={[{ required: true, message: 'กรุณากรอกค่ากลาง' }]}
                >
                  <InputNumber
                    placeholder="กรอกค่ากลาง"
                    style={{ width: '100%' }}
                    value={customSingleValue}
                    onChange={(value) => setCustomSingleValue(value ?? undefined)}
                  />
                </Form.Item>
              )}

              {/* ===== ช่วง Min - Max จากฐานข้อมูล ===== */}
              {standardType === 'range' && !useCustomStandard && (
                <Form.Item
                  label="ช่วง (Min - Max)"
                  name="standardID"
                  rules={[{ required: true, message: 'กรุณาเลือกช่วงมาตรฐาน' }]}
                >
                  <Select placeholder="เลือกช่วง" onChange={handleStandardSelectChange}>
                    {rangeStandards.map((s) => (
                      <Option key={s.ID} value={s.ID}>
                        {`${s.MinValue} - ${s.MaxValue}`}
                      </Option>
                    ))}
                    <Option value="custom">กำหนดเอง (ช่วง)</Option>
                  </Select>
                </Form.Item>
              )}

              {/* ===== ช่วง Min - Max แบบกรอกเอง ===== */}
              {standardType === 'range' && useCustomStandard && (
                <div className="up-tds-fornt-small" style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label="ค่าต่ำสุด (Min)"
                    name="customMin"
                    rules={[{ required: true, message: 'กรุณากรอกค่าต่ำสุด' }]}
                    style={{ flex: 1 }}
                  >
                    <InputNumber
                      placeholder="ค่าต่ำสุด"
                      style={{ width: '100%' }}
                      value={customMinValue}
                      onChange={(value) => setCustomMinValue(value ?? undefined)}
                    />
                  </Form.Item>
                  <Form.Item
                    label="ค่าสูงสุด (Max)"
                    name="customMax"
                    rules={[{ required: true, message: 'กรุณากรอกค่าสูงสุด' }]}
                    style={{ flex: 1 }}
                  >
                    <InputNumber
                      placeholder="ค่าสูงสุด"
                      style={{ width: '100%' }}
                      value={customMaxValue}
                      onChange={(value) => setCustomMaxValue(value ?? undefined)}
                    />
                  </Form.Item>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Before/After */}
        <div className="up-form-group-tds">
          <div className="up-form-group-mini-tds">
            <Form.Item
              label="ก่อน / หลัง / ก่อนและหลังบำบัด"
              name="beforeAfterTreatmentID"
              rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
            >
              <Select placeholder="เลือกสถานะ" onChange={(value) => setSelectedTreatmentID(value)}>
                {beforeAfterOptions.map((b) => (
                  <Option key={b.ID} value={b.ID}>
                    {renderCustomTreatmentLabel(b.TreatmentName || '')}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="up-form-group-mini-tds">
            {selectedTreatmentID === 3 ? (
              <div style={{ display: 'flex', gap: '30px' }}>
                <Form.Item
                  label="ค่าที่วัดได้ก่อนบำบัด"
                  name="valueBefore"
                  rules={[{ required: true, message: 'กรอกค่าก่อนบำบัด' }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber style={{ width: '100%' }} placeholder="ค่าก่อนบำบัด" />
                </Form.Item>

                <Form.Item
                  label="ค่าที่วัดได้หลังบำบัด"
                  name="valueAfter"
                  rules={[{ required: true, message: 'กรุณากรอกค่าหลังบำบัด' }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber style={{ width: '100%' }} placeholder="ค่าหลังบำบัด" />
                </Form.Item>
              </div>
            ) : (
              <Form.Item
                label="ค่าที่วัดได้"
                name="data"
                rules={[{ required: true, message: 'กรอกค่าที่วัดได้' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="ค่าที่วัดได้" />
              </Form.Item>
            )}
          </div>
        </div>

        {/* หมายเหตุ */}
        <div className="up-form-group-tds">
          {selectedTreatmentID === 1 && (
            <Form.Item label="หมายเหตุ (ก่อน)" name="beforeNote">
              <Input.TextArea rows={2} placeholder="กรอกหมายเหตุก่อนบำบัด" />
            </Form.Item>
          )}

          {selectedTreatmentID === 2 && (
            <Form.Item label="หมายเหตุ (หลัง)" name="afterNote">
              <Input.TextArea rows={2} placeholder="กรอกหมายเหตุหลังบำบัด" />
            </Form.Item>
          )}

          {selectedTreatmentID === 3 && (
            <>
              <Form.Item label="หมายเหตุ (ก่อน)" name="beforeNote">
                <Input.TextArea rows={2} placeholder="กรอกหมายเหตุก่อนบำบัด" />
              </Form.Item>
              <Form.Item label="หมายเหตุ (หลัง)" name="afterNote">
                <Input.TextArea rows={2} placeholder="กรอกหมายเหตุหลังบำบัด" />
              </Form.Item>
            </>
          )}
        </div>

        <Form.Item className="up-form-actions-tds">
          <Button className="cancel-up-tds" htmlType="button" onClick={handleCancelClick}>
            ยกเลิก
          </Button>
          <Button htmlType="reset" className="reset-up-tds">
            รีเซ็ต
          </Button>
          <Button type="primary" htmlType="submit" className="submit-up-tds">
            บันทึก
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UpdateTDSCentralForm;
