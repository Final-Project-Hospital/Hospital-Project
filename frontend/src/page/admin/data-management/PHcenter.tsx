import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select, Input } from 'antd';
import dayjs from 'dayjs';
import './PHcenter.css';

import { ListBeforeAfterTreatment, ListStandard, ListUnit } from '../../../services/index';
import { ListBeforeAfterTreatmentInterface } from '../../../interface/IBeforeAfterTreatment';
import { ListStandardInterface } from '../../../interface/IStandard';
import { ListUnitInterface } from '../../../interface/IUnit';

const { Option } = Select;

const PHCentralForm: React.FC = () => {
    const [form] = Form.useForm();

    const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
    const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
    const [standardOptions, setStandardOptions] = useState<ListStandardInterface[]>([]);

    const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);

    const renderCustomTreatmentLabel = (text: string) => {
        const colored = (
            <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span>
        );

        return (
            <>
                ค่า pH บริเวณบ่อพักน้ำทิ้ง{colored}เข้าระบบบำบัด
            </>
        );
    };

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

    const handleFinish = (values: any) => {
        console.log('Form values:', {
            ...values,
            date: values.date?.format('DD/MM/YYYY'),
            time: values.time?.format('HH:mm'),
        });
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedTreatmentID(null);
    };

    return (
        <div className="ph-container">
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <div className="form-group">
                    <Form.Item label="วันที่บันทึกข้อมูล" name="date">
                        <DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" className="full-width" placeholder="เลือกวัน" />
                    </Form.Item>

                    <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
                        <TimePicker defaultValue={dayjs()} format="HH:mm" className="full-width" placeholder="เลือกเวลา" />
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
                        rules={[{ required: true, message: 'กรุณาเลือกสถานะก่อน / หลัง / ก่อนเเละหลังบำบัด' }]}
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
