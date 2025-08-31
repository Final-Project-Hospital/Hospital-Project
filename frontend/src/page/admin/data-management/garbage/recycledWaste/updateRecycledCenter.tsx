import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import './updateRecycledCenter.css';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select, Input, message } from 'antd';
import { ListUnit } from '../../../../../services/index';
import { CheckUnit } from '../../../../../services/tdsService';
import { UpdateOrCreateRecycled } from '../../../../../services/garbageServices/recycledWaste';
import { ListUnitInterface } from '../../../../../interface/IUnit';

const { Option } = Select;

interface UpdateRecycledCentralFormProps {
    initialValues: any; // รับค่า before/after 2 record
    onSuccess?: () => void;
    onCancel: () => void;
}

const UpdateRecycledCentralForm: React.FC<UpdateRecycledCentralFormProps> = ({
    initialValues,
    onSuccess,
    onCancel
}) => {
    const [form] = Form.useForm();

    const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
    const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);

    const [isOtherUnitSelected, setIsOtherunitSelected] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        // โหลด options
        const fetchInitialData = async () => {
            const [units] = await Promise.all([
                ListUnit(),
            ]);
            if (units) setUnitOptions(units);
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!initialValues || initialValues.length === 0) return;

        const record = initialValues[0];

        // ฟังก์ชันเฉพาะ useEffect นี้: ปัดทศนิยม 2 ตำแหน่ง (round half up)
        const toTwoDecimal = (val: any) => {
            if (val === null || val === undefined) return undefined;
            const num = Number(val);
            if (isNaN(num)) return undefined;
            return Math.round(num * 100) / 100;
        };

        form.setFieldsValue({
            date: dayjs(record.Date),
            time: dayjs(),
            unit: record.UnitID ?? 'other',
            standardID: record.StandardID,
            beforeAfterTreatmentID: record.BeforeAfterTreatmentID,
            value: record?.Data ?? undefined,
            note: record?.Note || '',
            quantity: toTwoDecimal(record?.Quantity),
            monthlyGarbage: toTwoDecimal(record?.MonthlyGarbage),
            average_daily_garbage: toTwoDecimal(record?.AverageDailyGarbage),
            totalSale: toTwoDecimal(record?.TotalSale),
        });

        console.log(selectedTreatmentID);
        setSelectedTreatmentID(record.BeforeAfterTreatmentID);
    }, [initialValues]);

    const handleFinish = async (values: any) => {
        try {
            const combinedDateTime = dayjs(values.date)
                .hour(dayjs(values.time).hour())
                .minute(dayjs(values.time).minute())
                .second(dayjs(values.time).second())
                .toISOString();

            const employeeID = user?.ID ?? Number(localStorage.getItem("employeeid"));
            const isOther = values.unit === "other";
            const unitID = isOther ? null : values.unit;
            const customUnitValue = isOther ? values.customUnit : null;

            const payload = {
                ID: initialValues[0]?.ID ?? null,
                Date: combinedDateTime,
                UnitID: unitID,
                CustomUnit: customUnitValue,
                StandardID: values.standardID,
                EmployeeID: employeeID,
                Data: values.value,
                Note: values.note ?? "",
                Quantity: values.quantity,
                MonthlyGarbage: values.monthlyGarbage,
                AverageDailyGarbage: values.average_daily_garbage,
                TotalSale: values.totalSale,
                ParameterID: initialValues[0]?.ParameterID,
                BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
            };

            await UpdateOrCreateRecycled(payload);

            messageApi.success("แก้ไขข้อมูลสำเร็จ");
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("Error updating Recycled:", error?.response?.data || error);
            message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    const handleCancelClick = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <div className="up-recy-container">
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
                <div className="up-form-group-recy">
                    <Form.Item label="วันที่บันทึกข้อมูล" name="date">
                        <DatePicker format="DD/MM/YYYY" className="full-width-recy" />
                    </Form.Item>
                    <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
                        <TimePicker format="HH:mm" className="full-width-recy" />
                    </Form.Item>
                </div>

                {/* หน่วยที่วัด และ มาตรฐาน */}
                <div className="up-form-group-recy">
                    <div className="up-form-group-mini-recy">
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
                                    rules={[
                                        { required: true, message: "กรุณากรอกหน่วย" },
                                        {
                                            validator: async (_, value) => {
                                                if (!value) return;
                                                const data = await CheckUnit(value);
                                                if (!data) throw new Error("ไม่สามารถตรวจสอบหน่วยได้");
                                                if (data.exists) throw new Error("หน่วยนี้มีอยู่แล้วในระบบ");
                                            },
                                        },
                                    ]}
                                    style={{ marginTop: '8px' }}
                                >
                                    <Input placeholder="กรอกหน่วยกำหนดเอง" />
                                </Form.Item>
                            )}
                        </Form.Item>
                    </div>

                    <div className="recy-from-mini">
                        <Form.Item
                            label="จำนวนคนที่เข้าใช้บริการโรงพยาบาล"
                            name="quantity"
                            rules={[
                                { required: true, message: 'กรุณากรอกจำนวนคน' },
                                {
                                    validator: async (_, value) => {
                                        if (value === undefined || value === null) return Promise.resolve();
                                        // ตรวจว่าต้องเป็นจำนวนเต็ม
                                        if (!Number.isInteger(value)) {
                                            return Promise.reject("กรุณากรอกเป็นจำนวนเต็มเท่านั้น");
                                        }
                                        return Promise.resolve();
                                    },
                                }
                            ]}
                        >
                            <InputNumber style={{ width: '100%' }} placeholder="กรอกจำนวนคน" />
                        </Form.Item>
                    </div>
                </div>

                <div className="recy-form-group">
                    <div className="recy-from-mini">
                        <Form.Item
                            label="ปริมาณขยะต่อเดือน"
                            name="monthlyGarbage"
                            rules={[
                                { required: true, message: "กรุณากรอกปริมาณขยะ" },
                                {
                                    validator: async (_, value) => {
                                        if (value === undefined || value === null) return Promise.resolve();
                                        if (typeof value !== "number" || isNaN(value)) {
                                            return Promise.reject("กรุณากรอกเป็นตัวเลขเท่านั้น");
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="กรอกปริมาณขยะ"
                                step={0.01}
                                onChange={(val) => {
                                    // ดึงวันที่จากฟอร์ม ถ้าไม่มีให้ใช้วันนี้
                                    const selectedDate = form.getFieldValue("date") || new Date()
                                    // แปลงเป็น JS Date (รองรับทั้ง dayjs และ Date)
                                    const jsDate = selectedDate.toDate ? selectedDate.toDate() : selectedDate;
                                    // หาจำนวนวันจริงในเดือน
                                    const daysInMonth = new Date(jsDate.getFullYear(), jsDate.getMonth() + 1, 0).getDate();
                                    const numVal = val as number;
                                    if (!isNaN(numVal)) {
                                        form.setFieldsValue({
                                            average_daily_garbage: parseFloat((numVal / daysInMonth).toFixed(2)),
                                        });
                                    }
                                }}
                            />
                        </Form.Item>
                    </div>

                    <div className="recy-from-mini">
                        <Form.Item label="ปริมาณขยะต่อวัน (คำนวณอัตโนมัติ)" name="average_daily_garbage">
                            <InputNumber style={{ width: "100%" }} disabled placeholder="คำนวณอัตโนมัติ" />
                        </Form.Item>
                    </div>
                </div>

                <div className="recy-form-group">
                    <div className="recy-from-mini">
                        <Form.Item
                            label="ยอดขาย"
                            name="totalSale"
                            rules={[
                                {
                                    validator: async (_, value) => {
                                        if (value === undefined || value === null) return Promise.resolve();
                                        if (typeof value !== "number" || isNaN(value)) {
                                            return Promise.reject("กรุณากรอกเป็นตัวเลขเท่านั้น");
                                        }
                                        return Promise.resolve();
                                    },
                                }

                            ]}
                        >
                            <InputNumber style={{ width: '100%' }} placeholder="กรอกยอดขาย" step={0.01} />
                        </Form.Item>
                    </div>
                    {/* หมายเหตุ */}
                    <Form.Item label="หมายเหตุ" name="note">
                        <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
                    </Form.Item>
                </div>

                <Form.Item className="up-form-actions-recy">
                    <Button className="cancel-up-recy" htmlType="button" onClick={handleCancelClick}>
                        ยกเลิก
                    </Button>
                    <Button htmlType="reset" className="reset-up-recy">
                        รีเซ็ต
                    </Button>
                    <Button type="primary" htmlType="submit" className="submit-up-recy">
                        บันทึก
                    </Button>
                </Form.Item>
            </Form >
        </div >
    );
};

export default UpdateRecycledCentralForm;