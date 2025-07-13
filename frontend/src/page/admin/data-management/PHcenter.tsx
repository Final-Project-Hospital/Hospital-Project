import React, { useEffect, useState } from 'react';
import {
    Form,
    InputNumber,
    Button,
    DatePicker,
    TimePicker,
    Select,
    Input,
    message,
} from 'antd';
import dayjs from 'dayjs';
import './PHcenter.css';

import { ListBeforeAfterTreatment, ListStandard, ListUnit, CreatePH } from '../../../services/index';
import { ListBeforeAfterTreatmentInterface } from '../../../interface/IBeforeAfterTreatment';
import { ListStandardInterface } from '../../../interface/IStandard';
import { ListUnitInterface } from '../../../interface/IUnit';
import { CreatePHInterface } from '../../../interface/IpH';

const { Option } = Select;

const PHCentralForm: React.FC = () => {
    const [form] = Form.useForm();

    const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
    const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
    const [standardOptions, setStandardOptions] = useState<ListStandardInterface[]>([]);
    const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);

    const ENVIRONMENT_ID = 1; // ปรับตามระบบจริง

    const renderCustomTreatmentLabel = (text: string) => (
        <>
            ค่า pH บริเวณบ่อพักน้ำทิ้ง
            <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span>
            เข้าระบบบำบัด
        </>
    );

    useEffect(() => {
        const fetchInitialData = async () => {
            const [beforeAfter, units, standards] = await Promise.all([
                ListBeforeAfterTreatment(),
                ListUnit(),
                ListStandard(),
            ]);

            if (beforeAfter) setBeforeAfterOptions(beforeAfter);
            if (units) setUnitOptions(units);
            if (standards) setStandardOptions(standards);
        };

        fetchInitialData();
    }, []);

    const handleFinish = async (values: any) => {
        console.log("🎯 Form Submitted:", values);
        try {
            const dateValue = form.getFieldValue('date') ?? dayjs();
            const timeValue = form.getFieldValue('time') ?? dayjs();
            const employeeID = Number(localStorage.getItem("userid"));
            console.log(employeeID)
            const combinedDate = dateValue.set('hour', timeValue.hour()).set('minute', timeValue.minute());

            const payload: CreatePHInterface = {
                Date: combinedDate.toISOString(),
                Data:
                    selectedTreatmentID === 3
                        ? (values.valueBefore + values.valueAfter) / 2
                        : values.data,
                BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
                EnvironmentID: ENVIRONMENT_ID,
                StandardID: values.standardID,
                UnitID: values.unitID,
                EmployeeID: employeeID, // ✅ ใช้จาก useState
                Note: values.note,
            };


            const response = await CreatePH(payload);

            if ((response as any)?.status === 201) {
                message.success('สามารถบันทึกข้อมูลได้');
                form.resetFields();
                setSelectedTreatmentID(null);
            } else {
                message.error('ไม่สามารถบันทึกข้อมูลได้');
            }
        } catch (error: any) {
            console.error('Error creating pH:', error.response || error);
            message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedTreatmentID(null);
    };

    return (
        <div className="ph-container">
            <Form form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                    date: dayjs(),
                    time: dayjs(),
                }}>
                <div className="form-group">
                    <Form.Item label="วันที่บันทึกข้อมูล" name="date">
                        <DatePicker
                            defaultValue={dayjs()}
                            format="DD/MM/YYYY"
                            className="full-width"
                            placeholder="เลือกวัน"
                        />
                    </Form.Item>

                    <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
                        <TimePicker
                            defaultValue={dayjs()}
                            format="HH:mm"
                            className="full-width"
                            placeholder="เลือกเวลา"
                        />
                    </Form.Item>
                </div>

                <div className="form-group">
                    <Form.Item
                        label="หน่วยที่วัด"
                        name="unitID"
                        rules={[{ required: true, message: 'กรุณาเลือกหน่วยที่วัด' }]}
                    >
                        <Select placeholder="เลือกหน่วย">
                            {unitOptions.map((u) => (
                                <Option key={u.ID} value={u.ID}>
                                    {u.UnitName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="มาตรฐาน¹"
                        name="standardID"
                        rules={[{ required: true, message: 'กรุณาเลือกค่ามาตรฐาน' }]}
                    >
                        <Select placeholder="เลือกมาตรฐาน">
                            {standardOptions
                                .sort((a, b) => a.StandardValue! - b.StandardValue!)
                                .map((s) => (
                                    <Option key={s.ID} value={s.ID}>
                                        {s.StandardValue}
                                    </Option>
                                ))}
                        </Select>
                    </Form.Item>
                </div>

                <div className="form-group">
                    <Form.Item
                        label="ก่อน / หลัง / ก่อนเเละหลังบำบัด"
                        name="beforeAfterTreatmentID"
                        rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
                    >
                        <Select
                            placeholder="เลือกสถานะ"
                            onChange={(value) => {
                                setSelectedTreatmentID(value);
                            }}
                        >
                            {beforeAfterOptions.map((b) => (
                                <Option key={b.ID} value={b.ID}>
                                    {renderCustomTreatmentLabel(b.TreatmentName || '')}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {selectedTreatmentID === 3 ? (
                        <div style={{ display: 'flex', gap: '30px' }}>
                            <Form.Item
                                label="ค่าที่วัดได้ก่อนบำบัด"
                                name="valueBefore"
                                rules={[{ required: true, message: 'กรุณากรอกค่าก่อนบำบัด' }]}
                                style={{ flex: 1 }}
                            >
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item
                                label="ค่าที่วัดได้หลังบำบัด"
                                name="valueAfter"
                                rules={[{ required: true, message: 'กรุณากรอกค่าหลังบำบัด' }]}
                                style={{ flex: 1 }}
                            >
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </div>
                    ) : (
                        <Form.Item
                            label="ค่าที่วัดได้"
                            name="data"
                            rules={[{ required: true, message: 'กรุณากรอกค่าที่วัดได้' }]}
                        >
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    )}
                </div>

                <div className="form-group">
                    <Form.Item label="หมายเหตุ" name="note">
                        <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
                    </Form.Item>
                </div>

                <Form.Item className="form-actions">
                    <Button className="cancel" htmlType="button" onClick={handleCancel}>
                        ยกเลิก
                    </Button>
                    <Button htmlType="reset" className="reset">
                        รีเซ็ต
                    </Button>
                    <Button type="primary" htmlType="submit" className="submit">
                        บันทึก
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default PHCentralForm;
