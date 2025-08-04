import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import './TDScenter.css';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select, Input, message } from 'antd';
import { ListBeforeAfterTreatment, ListMiddleStandard, ListRangeStandard, AddMiddleStandard, AddRangeStandard, ListUnit } from '../../../../services/index';
import { CreateTDS, GetfirstTDS, CheckUnit, CheckStandard } from '../../../../services/tdsService';

import { ListBeforeAfterTreatmentInterface } from '../../../../interface/IBeforeAfterTreatment';
import { ListMiddleStandardInterface, ListRangeStandardInterface } from '../../../../interface/IStandard';
import { ListUnitInterface } from '../../../../interface/IUnit';
import { CreateTDSInterface } from '../../../../interface/ITds';

const { Option } = Select;

const TDSCentralForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
    const [form] = Form.useForm();

    const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
    const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
    const [middleStandards, setMiddleStandards] = useState<ListMiddleStandardInterface[]>([]);
    const [rangeStandards, setRangeStandards] = useState<ListRangeStandardInterface[]>([]);
    const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);
    const [standardType, setStandardType] = useState<string>('middle'); // middle or range
    const [useCustomStandard, setUseCustomStandard] = useState<boolean>(false);
    const [customSingleValue, setCustomSingleValue] = useState<number | undefined>(undefined);
    const [customMinValue, setCustomMinValue] = useState<number | undefined>(undefined);
    const [customMaxValue, setCustomMaxValue] = useState<number | undefined>(undefined);
    const [isOtherUnitSelected, setIsOtherunitSelected] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();


    const renderCustomTreatmentLabel = (text: string) => (
        <>
            ค่า TDS บริเวณบ่อพักน้ำทิ้ง
            <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span>
            เข้าระบบบำบัด
        </>
    );
    
    useEffect(() => {
        const fetchInitialData = async () => {
            const [beforeAfter, units, standardsMiddle, standardsRange] = await Promise.all([
                ListBeforeAfterTreatment(),
                ListUnit(),
                ListMiddleStandard(),
                ListRangeStandard(),
            ]);

            if (beforeAfter) setBeforeAfterOptions(beforeAfter);
            if (units) setUnitOptions(units);
            if (standardsMiddle) {
                setMiddleStandards(
                    standardsMiddle.map((s: any) => ({
                        ...s,
                        MiddleValue: Number(s.MiddleValue).toFixed(2)
                    }))
                );
            }
            if (standardsRange) {
                setRangeStandards(
                    standardsRange.map((s: any) => ({
                        ...s,
                        MinValue: Number(s.MinValue).toFixed(2),
                        MaxValue: Number(s.MaxValue).toFixed(2)
                    }))
                );
            }
        };

        const GetfirstrowTDS = async () => {
            try {
                const responfirstTDS = await GetfirstTDS();
                if (responfirstTDS.status === 200) {
                    const data = responfirstTDS.data;

                    const isMiddle = data.MinValue === 0 && data.MaxValue === 0;
                    setStandardType(isMiddle ? 'middle' : 'range');
                    form.setFieldsValue({
                        unit: data.UnitID ?? 'other',
                        standardType: isMiddle ? 'middle' : 'range',
                        standardID: data.StandardID,
                        MinValue: data.MinValue ? Number(data.MinValue).toFixed(2) : undefined,
                        MaxValue: data.MaxValue ? Number(data.MaxValue).toFixed(2) : undefined,
                        MiddleValue: data.MiddleValue ? Number(data.MiddleValue).toFixed(2) : undefined,
                    });

                    setSelectedTreatmentID(data.BeforeAfterTreatmentID);
                } else {
                    message.error("ไม่สามารถดึงข้อมูล TDS ล่าสุดได้");
                }
            } catch (error) {
                console.error("Error fetching first TDS:", error);
                message.error("เกิดข้อผิดพลาดในการโหลดค่าล่าสุด");
            }
        };

        fetchInitialData();
        GetfirstrowTDS();
    }, []);

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

            // กรณีใช้ค่ากำหนดเอง (custom standard)
            if (useCustomStandard) {
                if (standardType === 'middle' && values.customSingle !== undefined) {
                    const res = await AddMiddleStandard({
                        MiddleValue: values.customSingle,
                        MinValue: 0,
                        MaxValue: 0,
                    });

                    if (res && res.ID) {
                        standardID = res.ID;
                        setMiddleStandards(prev => [...prev, res]);
                    }
                } else if (
                    standardType === 'range' &&
                    values.customMin !== undefined &&
                    values.customMax !== undefined
                ) {
                    const res = await AddRangeStandard({
                        MiddleValue: 0,
                        MinValue: values.customMin,
                        MaxValue: values.customMax,
                    });

                    if (res && res.ID) {
                        standardID = res.ID;
                        setRangeStandards(prev => [...prev, res]);
                    }
                }
            }

            // เช็คว่ามี standardID หรือไม่
            if (!standardID) {
                message.error('กรุณาเลือกหรือกำหนดมาตรฐานก่อนบันทึก');
                return;
            }

            // รวมวันที่และเวลา
            const dateValue = values.date ?? dayjs();
            const timeValue = values.time ?? dayjs();
            const combinedDate = dateValue.set('hour', timeValue.hour()).set('minute', timeValue.minute());

            // ดึง employeeID จาก localStorage
            const employeeID = Number(localStorage.getItem('employeeid'));
            const isOther = values.unit === 'other';
            const unitID = isOther ? null : values.unit;
            const customUintValue = isOther ? values.customUnit : null;

            if (selectedTreatmentID === 3) {
                // กรณี "ก่อนและหลังบำบัด" ส่งข้อมูล 2 ชุด
                const payloadBefore: CreateTDSInterface = {
                    Date: combinedDate.toISOString(),
                    Data: values.valueBefore,
                    BeforeAfterTreatmentID: 1,
                    StandardID: standardID,
                    UnitID: unitID,
                    CustomUnit: customUintValue,
                    EmployeeID: employeeID,
                    Note: values.note,
                };

                const payloadAfter: CreateTDSInterface = {
                    Date: combinedDate.toISOString(),
                    Data: values.valueAfter,
                    BeforeAfterTreatmentID: 2,
                    StandardID: standardID,
                    UnitID: unitID,
                    CustomUnit: customUintValue,
                    EmployeeID: employeeID,
                    Note: values.note,
                };

                const res1 = await CreateTDS(payloadBefore);
                const res2 = await CreateTDS(payloadAfter);

                if ((res1 as any)?.status === 201 && (res2 as any)?.status === 201) {
                    messageApi.success('บันทึกข้อมูล TDS ก่อนและหลังบำบัดสำเร็จ');
                    form.resetFields();
                    setSelectedTreatmentID(null);
                    setUseCustomStandard(false);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    message.error('ไม่สามารถบันทึกข้อมูลก่อนหรือหลังได้');
                }
            } else {
                // กรณีทั่วไป ส่งข้อมูลครั้งเดียว
                const payload: CreateTDSInterface = {
                    Date: combinedDate.toISOString(),
                    Data: values.data,
                    BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
                    StandardID: standardID,
                    UnitID: unitID,
                    CustomUnit: customUintValue,
                    EmployeeID: employeeID,
                    Note: values.note,
                };

                const response = await CreateTDS(payload);

                if ((response as any)?.status === 201) {
                    messageApi.success('บันทึกข้อมูล TDS สำเร็จ');
                    form.resetFields();
                    setSelectedTreatmentID(null);
                    setUseCustomStandard(false);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    message.error('ไม่สามารถบันทึกข้อมูลได้');
                }
            }

            // รีเซ็ตค่ากำหนดเอง
            setCustomSingleValue(undefined);
            setCustomMinValue(undefined);
            setCustomMaxValue(undefined);
        } catch (error) {
            console.error('Error creating TDS:', error);
            message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล handfinish create');
        }
    };

    const handleCancelClick = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <div className="tds-container">
            {contextHolder}
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                    date: dayjs(),
                    time: dayjs(),
                    standardType: 'middle',
                }}
            >
                <div className="form-group-tds">
                    <Form.Item label="วันที่บันทึกข้อมูล" name="date">
                        <DatePicker format="DD/MM/YYYY" className="full-width-tds" placeholder="เลือกวัน" />
                    </Form.Item>
                    <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
                        <TimePicker format="HH:mm" className="full-width-tds" placeholder="เลือกเวลา" />
                    </Form.Item>
                </div>

                <div className="form-group-tds">
                    <div className="form-group-mini-tds">
                        <Form.Item
                            label="หน่วยที่วัด"
                            required
                        >
                            <Form.Item
                                name="unit"
                                noStyle
                                rules={[{ required: true, message: 'กรุณาเลือกหน่วยที่วัด' }]}
                            >
                                <Select
                                    placeholder="เลือกหน่วย"
                                    onChange={(value) => {
                                        setIsOtherunitSelected(value === 'other');
                                        if (value !== 'other') {
                                            form.setFieldsValue({ customUnit: undefined });
                                        }
                                    }}
                                >
                                    {unitOptions.map((u) => (
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

                    <div className="form-group-mini-tds">
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
                                    rules={[
                                        { required: true, message: "กรุณากรอกค่ามาตรฐาน" },
                                        {
                                            validator: async (_, value) => {
                                                if (value === undefined || value === null) return Promise.resolve();
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
                                        placeholder="กรอกค่ามาตรฐาน"
                                        style={{ width: '100%' }}
                                        value={customSingleValue}
                                        onChange={(value) => setCustomSingleValue(value ?? undefined)}
                                        min={0}
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
                                                {`${s.MinValue} - ${s.MaxValue}`}
                                            </Option>
                                        ))}
                                        <Option value="custom">กำหนดเอง (ช่วง)</Option>
                                    </Select>
                                </Form.Item>
                            )}

                            {/* ===== ช่วง Min - Max แบบกรอกเอง ===== */}
                            {standardType === 'range' && useCustomStandard && (
                                <div className="tds-fornt-small" style={{ display: 'flex', gap: '16px' }}>
                                    <Form.Item
                                        label="ค่าต่ำสุด (Min)"
                                        name="customMin"
                                        rules={[
                                            { required: true, message: "กรุณากรอกค่าต่ำสุด" },
                                            ({ getFieldValue }) => ({
                                                validator: (_, val) => {
                                                    const max = getFieldValue("customMax");
                                                    if (val >= max) return Promise.reject("Min ต้องน้อยกว่า Max");
                                                    return Promise.resolve();
                                                },
                                            }),
                                        ]}
                                        style={{ flex: 1 }}
                                    >
                                        <InputNumber
                                            placeholder="ค่าต่ำสุด"
                                            style={{ width: '100%' }}
                                            value={customMinValue}
                                            onChange={(value) => setCustomMinValue(value ?? undefined)}
                                            step={0.01}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label="ค่าสูงสุด (Max)"
                                        name="customMax"
                                        rules={[
                                            { required: true, message: "กรุณากรอกค่าสูงสุด" },
                                            ({ getFieldValue }) => ({
                                                validator: async (_, value) => {
                                                    const min = getFieldValue("customMin");
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
                                            placeholder="ค่าสูงสุด"
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

                <div className="form-group-tds">
                    <div className="form-group-mini-tds">
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
                    <div className="form-group-mini-tds">
                        {selectedTreatmentID === 3 ? (
                            <div style={{ display: 'flex', gap: '30px' }}>
                                <Form.Item
                                    label="ค่าที่วัดได้ก่อนบำบัด"
                                    name="valueBefore"
                                    rules={[
                                        { required: true, message: 'กรุณากรอกค่าก่อนบำบัด' },
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
                                    style={{ flex: 1 }}
                                >
                                    <InputNumber style={{ width: '100%' }} placeholder="ค่าก่อนบำบัด" step={0.01} />
                                </Form.Item>

                                <Form.Item
                                    label="ค่าที่วัดได้หลังบำบัด"
                                    name="valueAfter"
                                    rules={[
                                        { required: true, message: 'กรุณากรอกค่าหลังบำบัด' },
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
                                    style={{ flex: 1 }}
                                >
                                    <InputNumber style={{ width: '100%' }} placeholder="ค่าหลังบำบัด" step={0.01} />
                                </Form.Item>
                            </div>
                        ) : (
                            <Form.Item
                                label="ค่าที่วัดได้"
                                name="data"
                                rules={[
                                    { required: true, message: 'กรุณากรอกค่าที่วัดได้' },
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
                                style={{ flex: 1 }}
                            >
                                <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าที่วัดได้" step={0.01} />
                            </Form.Item>
                        )}
                    </div>
                </div>

                <div className="form-group-tds">
                    <Form.Item label="หมายเหตุ" name="note">
                        <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
                    </Form.Item>
                </div>

                <Form.Item className="form-actions-tds">
                    <Button className="cancel-tds" htmlType="button" onClick={handleCancelClick}>
                        ยกเลิก
                    </Button>
                    <Button htmlType="reset" className="reset-tds">
                        รีเซ็ต
                    </Button>
                    <Button type="primary" htmlType="submit" className="submit-tds">
                        บันทึก
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default TDSCentralForm;
