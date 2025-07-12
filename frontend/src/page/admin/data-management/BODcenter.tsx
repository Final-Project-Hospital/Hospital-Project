import React, { useState } from 'react';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select } from 'antd';
import dayjs from 'dayjs';
import './BODcenter.css';
import { BodcenterInterface } from '../../../interface/IBodCenter';
import { createBOD } from '../../../services/bodService';

const { Option } = Select;



const TDSCentralForm: React.FC = () => {
    const [form] = Form.useForm();
    // const [BodData, setBodData] = useState<BodcenterInterface | null>(null);

    const handleClear = () => {
        form.resetFields();
    };

    const handleFinish = (values: any) => {
        // รวม date กับ time เข้าเป็นค่าเดียว
        const combinedDateTime = dayjs(values.date)
            .hour(dayjs(values.time).hour())
            .minute(dayjs(values.time).minute())
            .second(0);
        const BodData: BodcenterInterface = {
            Date: combinedDateTime.format('YYYY-MM-DD HH:mm:ss'), // หรือ .format('YYYY-MM-DDTHH:mm:ss')
            Data: values.value,
            BeforeAfterTreatmentID: values.before_after
        }

        console.log('BOD data:', BodData);
    };

    return (
        <div>
            <div className="bod-container">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    initialValues={{
                        unit: 'mg/L',
                        standard: '500',
                        process: 'ค่า TDS บริเวณบ่อพักน้ำทิ้งก่อนเข้าระบบบำบัด',
                    }}
                >
                    <div className="bod-form-group">
                        <Form.Item label="วันที่บันทึกข้อมูล" name="date">
                            <DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" className="bod-full-width" />
                        </Form.Item>

                        <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
                            <TimePicker defaultValue={dayjs()} format={"HH:mm"} className="bod-full-width" />
                        </Form.Item>
                    </div>

                    <div className="bod-form-group">
                        <Form.Item
                            label="หน่วยที่วัด"
                            name="unit"
                            rules={[{ required: true, message: 'กรุณาเลือกหน่วยที่วัด' }]}
                        >
                            <Select>
                                <Option value="mg/L">mg/L</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="มาตรฐาน¹"
                            name="standard"
                            rules={[{ required: true, message: 'กรุณาเลือกค่ามาตรฐาน' }]}
                        >
                            <Select>
                                <Option value="500">500</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="bod-form-group">
                        <Form.Item
                            label="ก่อน / หลังบำบัด"
                            name="before_after"
                            rules={[{ required: true, message: 'กรุณาเลือกสถานะก่อน/หลังบำบัด' }]}
                        >
                            <Select
                                placeholder="เลือกสถานะก่อน/หลังบำบัด"
                                options={[
                                    {
                                        value: 1,
                                        label: (
                                            <span>
                                                ค่า TDS บริเวณบ่อพักน้ำทิ้ง <span className="bod-red-text">ก่อน</span> เข้าระบบบำบัด
                                            </span>
                                        ),
                                    },
                                    {
                                        value: 2,
                                        label: (
                                            <span>
                                                ค่า TDS บริเวณบ่อพักน้ำทิ้ง <span className="bod-green-text">หลัง</span> ออกจากระบบบำบัด
                                            </span>
                                        ),
                                    },
                                ]}
                            />

                        </Form.Item>

                        <Form.Item
                            label="ค่าที่วัดได้"
                            name="data"
                            rules={[{ required: true, message: 'กรุณากรอกค่าที่วัดได้' }]}
                        >
                            <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าที่วัดได้" />
                        </Form.Item>
                    </div>
                    <Form.Item >
                        <div className="bod-form-actions" >
                            <Button className="bod-cancel" htmlType="button" >
                                ยกเลิก
                            </Button>
                            <Button htmlType="reset" className="bod-reset" onClick={handleClear} >
                                รีเซ็ต
                            </Button>
                            <Button type="primary" htmlType="submit" className="bod-submit">
                                บันทึก
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default TDSCentralForm;
