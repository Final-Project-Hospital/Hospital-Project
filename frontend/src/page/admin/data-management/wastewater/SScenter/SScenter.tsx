import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import "./SScenter.css";
import {
  Form,
  InputNumber,
  Button,
  DatePicker,
  TimePicker,
  Select,
  Input,
  message,
} from "antd";
import { ListBeforeAfterTreatment, ListStandard, ListUnit } from "../../../../../services/index";
import { CreateTS } from "../../../../../services/enviromentrecord";
import { ListBeforeAfterTreatmentInterface } from "../../../../../interface/IBeforeAfterTreatment";
import { ListStandardInterface } from "../../../../../interface/IStandard";
import { ListUnitInterface } from "../../../../../interface/IUnit";
import { CreateTSInterface } from "../../../../../interface/IEnvironmentalRecord";

const { Option } = Select;

const SSCenterForm: React.FC = () => {
  const [form] = Form.useForm();
  const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
  const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
  const [standardOptions, setStandardOptions] = useState<ListStandardInterface[]>([]);
  const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchSelectBoxData = async () => {
      const [beforeAfter, units, standards] = await Promise.all([
        ListBeforeAfterTreatment(),
        ListUnit(),
        ListStandard(),
      ]);

      if (beforeAfter) setBeforeAfterOptions(beforeAfter);
      if (units) setUnitOptions(units);
      if (standards) setStandardOptions(standards);
    };

    fetchSelectBoxData();
  }, []);

  const handleClear = () => {
    form.resetFields();
  };

  const handleFinish = async (values: any) => {
    const employeeID = Number(localStorage.getItem("employeeid"));
    const combinedDateTime = dayjs(values.date)
        .hour(dayjs(values.time).hour())
        .minute(dayjs(values.time).minute())
        .second(0);

    const TSdata: CreateTSInterface = {
        date: combinedDateTime.toISOString(),
        data: values.data,
        note: values.note,
        beforeAfterTreatmentID: values.before_after,
        standardID: values.standard,
        unitID: values.unit,
        employeeID: employeeID,
    };
    console.log(TSdata)
    const response = await CreateTS(TSdata);
    
    if (response) {
        messageApi.open({
        type: 'success',
        content: 'บันทึกข้อมูลสำเร็จ'
      });
    } else {
        messageApi.open({
        type: 'error',
        content: 'บันทึกข้อมูลไม่สำเร็จ'
      });    }
  };

  const renderCustomTreatmentLabel = (text: string) => (
    <>
      ค่า TS บริเวณบ่อพักน้ำทิ้ง <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span> เข้าระบบบำบัด
    </>
  );

  return (
    <div>
      {contextHolder}
      <div className="ts-container">
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <div className="ts-form-group">
            <Form.Item label="วันที่บันทึกข้อมูล" name="date">
              <DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" className="ts-full-width" />
            </Form.Item>
            <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
              <TimePicker defaultValue={dayjs()} format={"HH:mm"} className="ts-full-width" />
            </Form.Item>
          </div>

          <div className="ts-form-group">
            <Form.Item label="หน่วยที่วัด" name="unit" rules={[{ required: true, message: "กรุณาเลือกหน่วยที่วัด" }]}> 
              <Select placeholder="เลือกหน่วย">
                {unitOptions.map((u) => (
                  <Option key={u.ID} value={u.ID}>{u.UnitName}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="มาตรฐาน¹" name="standard" rules={[{ required: true, message: "กรุณาเลือกค่ามาตรฐาน" }]}> 
              <Select placeholder="เลือกมาตรฐาน">
                {standardOptions.sort((a, b) => a.StandardValue! - b.StandardValue!).map((s) => (
                  <Option key={s.ID} value={s.ID}>{s.StandardValue}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="ts-form-group">
            <Form.Item
              label="ก่อน / หลัง / ก่อนเเละหลังบำบัด"
              name="before_after"
              rules={[{ required: true, message: "กรุณาเลือกสถานะก่อน / หลัง / ก่อนเเละหลังบำบัด" }]}
            >
              <Select placeholder="เลือกสถานะ" onChange={(value) => setSelectedTreatmentID(value)}>
                {beforeAfterOptions.map((b) => (
                  <Option key={b.ID} value={b.ID}>{renderCustomTreatmentLabel(b.TreatmentName || '')}</Option>
                ))}
              </Select>
            </Form.Item>

            {selectedTreatmentID === 3 ? (
              <div style={{ display: 'flex', gap: '30px' }}>
                <Form.Item label="ค่าที่วัดได้ก่อนบำบัด" name="valueBefore" rules={[{ required: true, message: "กรุณากรอกค่าก่อนบำบัด" }]} style={{ flex: 1 }}>
                  <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าก่อนบำบัด" />
                </Form.Item>
                <Form.Item label="ค่าที่วัดได้หลังบำบัด" name="valueAfter" rules={[{ required: true, message: "กรุณากรอกค่าหลังบำบัด" }]} style={{ flex: 1 }}>
                  <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าหลังบำบัด" />
                </Form.Item>
              </div>
            ) : (
              <Form.Item label="ค่าที่วัดได้" name="data" rules={[{ required: true, message: "กรุณากรอกค่าที่วัดได้" }]}> 
                <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าที่วัดได้" />
              </Form.Item>
            )}
          </div>

          <Form.Item label="หมายเหตุ" name="note">
            <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
          </Form.Item>

          <Form.Item>
            <div className="ts-form-actions">
              <Button className="ts-cancel" htmlType="button">ยกเลิก</Button>
              <Button htmlType="reset" className="ts-reset" onClick={handleClear}>รีเซ็ต</Button>
              <Button type="primary" htmlType="submit" className="ts-submit">บันทึก</Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default SSCenterForm;
