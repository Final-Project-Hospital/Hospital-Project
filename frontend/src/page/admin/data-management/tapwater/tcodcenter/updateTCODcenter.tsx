import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import '../../wastewater/TDScenter/updateTDScenter.css';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select, Input, message } from 'antd';
import {
    ListMiddleStandard,
    ListRangeStandard,
    ListUnit
} from '../../../../../services/index';
import { CheckUnit, CheckStandard } from '../../../../../services/tdsService';
import { UpdateOrCreateTCOD } from '../../../../../services/tapwaterServices/tcod';
import { ListMiddleStandardInterface, ListRangeStandardInterface } from '../../../../../interface/IStandard';
import { ListUnitInterface } from '../../../../../interface/IUnit';

const { Option } = Select;

interface UpdateTCODCentralFormProps {
    initialValues: any;
    onSuccess?: () => void;
    onCancel: () => void;
}

const UpdateTCODCentralForm: React.FC<UpdateTCODCentralFormProps> = ({
    initialValues,
    onSuccess,
    onCancel
}) => {
    const [form] = Form.useForm();

    const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
    const [middleStandards, setMiddleStandards] = useState<ListMiddleStandardInterface[]>([]);
    const [rangeStandards, setRangeStandards] = useState<ListRangeStandardInterface[]>([]);

    const [customSingleValue, setCustomSingleValue] = useState<number | undefined>(undefined);
    const [customMinValue, setCustomMinValue] = useState<number | undefined>(undefined);
    const [customMaxValue, setCustomMaxValue] = useState<number | undefined>(undefined);
    const [isOtherUnitSelected, setIsOtherunitSelected] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [standardType, setStandardType] = useState('middle');
    const [useCustomStandard, setUseCustomStandard] = useState(false);

    useEffect(() => {
        // โหลด options
        const fetchInitialData = async () => {
            const [units, standardsMiddle, standardsRange] = await Promise.all([
                ListUnit(),
                ListMiddleStandard(),
                ListRangeStandard()
            ]);

            if (units) setUnitOptions(units);
            if (standardsMiddle) setMiddleStandards(standardsMiddle);
            if (standardsRange) setRangeStandards(standardsRange);
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (initialValues && initialValues.length > 0) {
            const single = initialValues[0];

            // ฟังก์ชันปัดขึ้น 2 ตำแหน่ง
            const toTwoDecimalCeil = (value: any) => {
                if (value === null || value === undefined) return undefined;
                return Math.ceil(Number(value) * 100) / 100;
            };
            const stdType =
                single.MinValue === -1 && single.MaxValue === -1 ? "middle" : "range";
            setStandardType(stdType);

            form.setFieldsValue({
                date: dayjs(single.Date),
                time: dayjs(single.Date),
                unit: single.UnitID ?? "other",
                standardType: stdType,
                standardID: single.StandardID,
                beforeAfterTreatmentID: single.BeforeAfterTreatmentID,
                data: toTwoDecimalCeil(single?.Data),
                note: single.Note || "",
            });
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
            let standardID = values.standardID ?? 0;

            const hasCustomSingle = standardType === "middle" && useCustomStandard && values.customSingle !== undefined;
            const hasCustomRange =
                standardType === "range" &&
                useCustomStandard &&
                values.customMin !== undefined &&
                values.customMax !== undefined;

            if (!standardID && !hasCustomSingle && !hasCustomRange) {
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

            // สร้าง payload สำหรับ update
            const payload = {
                ID: initialValues[0]?.ID ?? null,
                Date: combinedDateTime,
                Data: values.data,
                Note: values.note ?? "",
                BeforeAfterTreatmentID: 2,
                UnitID: unitID,
                StandardID: standardID,
                CustomStandard: standardID === 0
                    ? (hasCustomSingle
                        ? { type: "middle", value: values.customSingle }
                        : { type: "range", min: values.customMin, max: values.customMax })
                    : null,
                EmployeeID: employeeID,
                CustomUnit: customUnitValue,
                ParameterID: initialValues[0]?.ParameterID,
            };

            const res = await UpdateOrCreateTCOD(payload);

            if (res) {
                messageApi.success("แก้ไขข้อมูลสำเร็จ");
                if (onSuccess) onSuccess();
            }
        } catch (error: any) {
            console.error("Error updating TCOD:", error?.response?.data || error);
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
                    <Form.Item label="วันที่บันทึกข้อมูล" name="date" rules={[{ required: true, message: 'กรุณาเลือกวันที่' }]}>
                        <DatePicker format="DD/MM/YYYY" className="full-width-tds" />
                    </Form.Item>

                    <Form.Item label="เวลาที่บันทึกข้อมูล" name="time" rules={[{ required: true, message: 'กรุณากรอกเวลา' }]}>
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

                    <div className="up-form-group-mini-tds">
                        <Form.Item label="ประเภทมาตรฐาน" name="standardType">
                            <Select defaultValue="middle" onChange={handleStandardGroupChange}>
                                <Option value="middle">ค่าเดี่ยว</Option>
                                <Option value="range">ช่วง (Min - Max)</Option>
                            </Select>
                        </Form.Item>

                        <div style={{ position: 'relative', top: '-17px' }}>
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
                                                {s.MiddleValue.toFixed(2)}
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
                                    rules={[{ required: true, message: 'กรุณากรอกค่ามาตรฐาน' },
                                    {
                                        validator: async (_, value) => {
                                            if (value === undefined || value === null) return Promise.resolve();
                                            // ถ้าใส่ "-" หรือค่าติดลบ ให้เตือนเลย
                                            if (value === '-' || Number(value) < 0) {
                                                return Promise.reject("กรุณาไม่กรอกค่าติดลบ");
                                            }
                                            if (typeof value !== "number" || isNaN(value)) {
                                                return Promise.reject("กรุณากรอกเป็นตัวเลขเท่านั้น");
                                            }
                                            const data = await CheckStandard("middle", value);
                                            if (!data) return Promise.reject("ไม่สามารถตรวจสอบมาตรฐานได้");
                                            if (data.exists) return Promise.reject("ค่ามาตรฐานนี้มีอยู่แล้วในระบบ");
                                            return Promise.resolve();
                                        },
                                    },

                                    ]}
                                >
                                    <InputNumber
                                        placeholder="กรอกค่าเดี่ยว"
                                        style={{ width: '100%' }}
                                        value={customSingleValue}
                                        onChange={(value) => setCustomSingleValue(value ?? undefined)}
                                        step={0.01}
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
                                                {`${s.MinValue.toFixed(2)} - ${s.MaxValue.toFixed(2)}`}
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
                                        dependencies={['customMax']} // เมื่อ Max เปลี่ยน ให้ validate Min ใหม
                                        rules={[{ required: true, message: 'กรุณากรอกค่าต่ำสุด' },
                                        ({ getFieldValue }) => ({
                                            validator: (_, val) => {
                                                const max = getFieldValue("customMax");
                                                // เช็คค่าติดลบ
                                                if (val !== undefined && val < 0) {
                                                    return Promise.reject("กรุณาไม่กรอกค่าติดลบ");
                                                }
                                                if (val >= max) return Promise.reject("Min ต้องน้อยกว่า Max");
                                                return Promise.resolve();
                                            },
                                        }),

                                        ]}
                                        style={{ flex: 1 }}
                                    >
                                        <InputNumber
                                            placeholder="กรอกค่าต่ำสุด"
                                            style={{ width: '100%' }}
                                            value={customMinValue}
                                            onChange={(value) => setCustomMinValue(value ?? undefined)}
                                            step={0.01}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label="ค่าสูงสุด (Max)"
                                        name="customMax"
                                        dependencies={['customMin']}
                                        rules={[{ required: true, message: 'กรุณากรอกค่าสูงสุด' },
                                        ({ getFieldValue }) => ({
                                            validator: async (_, value) => {
                                                const min = getFieldValue("customMin");
                                                // เช็คค่าติดลบ
                                                if (value !== undefined && value < 0) {
                                                    return Promise.reject("กรุณาไม่กรอกค่าติดลบ");
                                                }
                                                if (min !== undefined && value <= min) {
                                                    return Promise.reject("Max ต้องมากกว่า Min");
                                                }
                                                // เรียก CheckStandard
                                                const data = await CheckStandard("range", { min, max: value });
                                                if (!data) return Promise.reject("ไม่สามารถตรวจสอบมาตรฐานได้");
                                                if (data.exists) return Promise.reject("ช่วงมาตรฐานนี้มีอยู่แล้วในระบบ");
                                                return Promise.resolve();
                                            },
                                        }),

                                        ]}
                                        style={{ flex: 1 }}
                                    >
                                        <InputNumber
                                            placeholder="กรอกค่าสูงสุด"
                                            style={{ width: '100%' }}
                                            value={customMaxValue}
                                            onChange={(value) => setCustomMaxValue(value ?? undefined)}
                                            step={0.01}
                                        />
                                    </Form.Item>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data */}
                <div className="up-form-group-tds">
                    <Form.Item
                        label="ค่าที่วัดได้"
                        name="data"
                        rules={[
                            { required: true, message: 'กรุณากรอกค่าที่วัดได้' },
                            {
                                validator: async (_, value) => {
                                    if (value === undefined || value === null || value === '') return Promise.resolve();
                                    // เช็คถ้าเป็นแค่ "-" ก็ให้เตือนเลย
                                    if (value === '-' || Number(value) < 0) {
                                        return Promise.reject('กรุณาไม่กรอกค่าติดลบ');
                                    }
                                    if (isNaN(Number(value))) {
                                        return Promise.reject('กรุณากรอกเป็นตัวเลขเท่านั้น');
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="กรอกค่าที่วัดได้"
                            step={0.01}
                        />
                    </Form.Item>

                    <Form.Item label="หมายเหตุ" name="note">
                        <Input.TextArea
                            rows={2}
                            placeholder="กรอกหมายเหตุ (ถ้ามี)"
                        />
                    </Form.Item>
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

export default UpdateTCODCentralForm;