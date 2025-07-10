import React from 'react';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select } from 'antd';
import dayjs from 'dayjs';
import './PHcenter.css';

const { Option } = Select;

const defaultTime = dayjs('10:00', 'HH:mm');

const PHCentralForm: React.FC = () => {
    const [form] = Form.useForm();

    const handleFinish = (values: any) => {
        console.log('Form values:', {
            ...values,
            date: values.date?.format('DD/MM/YYYY'),
            time: values.time?.format('HH:mm')
        });
    };

    return (
        <div>
            <div className="ph-container">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    initialValues={{
                        time: defaultTime,
                        unit: 'mg/L',
                        standard: '500',
                        process: 'ค่า pH บริเวณบ่อพักน้ำทิ้งก่อนเข้าระบบบำบัด',
                        value: '400'
                    }}
                >
                    <div className="form-group">
                        <Form.Item label="วันที่บันทึกข้อมูล" name="date">
                            <DatePicker format="DD/MM/YYYY" className="full-width" />
                        </Form.Item>

                        <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
                            <TimePicker format="HH:mm" className="full-width" />
                        </Form.Item>
                    </div>

                    <div className="form-group">
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

                    <div className="form-group">
                        <Form.Item
                            label="ก่อน / หลัง / ก่อนเเละหลังบำบัด"
                            name="process"
                            rules={[{ required: true, message: 'กรุณาเลือกสถานะก่อน / หลัง / ก่อนเเละหลังบำบัด' }]}
                        >
                            <Select>
                                <Option value="ค่า pH บริเวณบ่อพักน้ำทิ้งก่อนเข้าระบบบำบัด">
                                    ค่า pH บริเวณบ่อพักน้ำทิ้ง <span className="red-text">ก่อน</span> เข้าระบบบำบัด
                                </Option>
                                <Option value="ค่า pH บริเวณบ่อพักน้ำทิ้งหลังเข้าระบบบำบัด">
                                    ค่า pH บริเวณบ่อพักน้ำทิ้ง <span className="red-text">หลัง</span> เข้าระบบบำบัด
                                </Option>
                                <Option value="ค่า pH บริเวณบ่อพักน้ำทิ้งก่อนเเละหลังเข้าระบบบำบัด">
                                    ค่า pH บริเวณบ่อพักน้ำทิ้ง <span className="red-text">ก่อนเเละหลัง</span> เข้าระบบบำบัด
                                </Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="ค่าที่วัดได้"
                            name="value"
                            rules={[{ required: true, message: 'กรุณากรอกค่าที่วัดได้' }]}
                        >
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <Form.Item className="form-actions" >
                        <Button className="cancel" htmlType="button">
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
        </div>
    );
};

export default PHCentralForm;