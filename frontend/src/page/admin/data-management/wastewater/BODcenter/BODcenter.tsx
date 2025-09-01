import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select, Input, message } from 'antd';
import dayjs from 'dayjs';
import './BODcenter.css';
import { BodcenterInterface } from '../../../../../interface/IBodCenter';
import { createBOD } from '../../../../../services/bodService';
import { ListBeforeAfterTreatment, ListUnit } from '../../../../../services/index';
import { ListBeforeAfterTreatmentInterface } from '../../../../../interface/IBeforeAfterTreatment';
// import { ListStandardInterface } from '../../../interface/IStandard';
import { ListUnitInterface } from '../../../../../interface/IUnit';
import { GetfirstBOD } from '../../../../../services/bodService';
import { ListMiddleStandard, ListRangeStandard, AddMiddleStandard, AddRangeStandard, } from '../../../../../services/index';
import { ListMiddleStandardInterface, ListRangeStandardInterface } from '../../../../../interface/IStandard';
// import { CheckUnit, CheckStandard } from '../../../../../';
import { CheckUnit, CheckStandard } from '../../../../../services/tdsService';

type Props = {
    onCancel?: () => void;
    onSuccess?: () => void;
};
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


const { Option } = Select;
const BODCentralForm: React.FC<Props> = ({ onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
    const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
    const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [isOtherUnitSelected, setIsOtherunitSelected] = useState(false);
    const [middleStandards, setMiddleStandards] = useState<ListMiddleStandardInterface[]>([]);
    const [rangeStandards, setRangeStandards] = useState<ListRangeStandardInterface[]>([]);
    const [standardType, setStandardType] = useState<string>('middle'); // middle or range
    const [useCustomStandard, setUseCustomStandard] = useState<boolean>(false);
    const [customSingleValue, setCustomSingleValue] = useState<number | undefined>(undefined);
    const [customMinValue, setCustomMinValue] = useState<number | undefined>(undefined);
    const [customMaxValue, setCustomMaxValue] = useState<number | undefined>(undefined);
    // const [standardOptions, setStandardOptions] = useState<ListStandardInterface[]>([]);
    // const [firstBOD, setfirstBOD] = useState<BodcenterInterface | null>(null);
    // const [BodData, setBodData] = useState<BodcenterInterface | null>(null);

    const renderCustomTreatmentLabel = (text: string) => {
        const colored = (
            <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span>
        );

        return (
            <>
                ค่า BOD บริเวณบ่อพักน้ำทิ้ง{colored}เข้าระบบบำบัด
            </>
        );
    };

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

    const GetfirstrowBOD = async () => {
        try {
            const responfirstBOD = await GetfirstBOD();
            if (responfirstBOD.status === 200) {
                const data = responfirstBOD.data;
                const isMiddle = data.MinValue === -1 && data.MaxValue === -1;
                setStandardType(isMiddle ? 'middle' : 'range');
                form.setFieldsValue({
                    unit: data.UnitID,
                    standardType: isMiddle ? 'middle' : 'range',
                    standardID: data.StandardID,
                });
            } else {
                message.error("ไม่สามารถดึงข้อมูลการนัดหมายได้ สถานะ: " + responfirstBOD.status);
            }
        } catch (error) {
            console.error("Error fetching severity levels:", error);
            message.error("เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมาย");
        }

    };
    useEffect(() => {
        GetfirstrowBOD();
        fetchInitialData();
    }, []);

    const handleClear = () => {
        form.resetFields();
    };


    const handleCancelClick = () => {
        form.resetFields();
        onCancel?.(); // ✅ ปลอดภัย ถ้าไม่มี onCancel ก็ไม่ทำอะไร
    };

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
        // รวม date กับ time เข้าเป็นค่าเดียว
        let standardID = values.standardID ?? null;
        if (useCustomStandard) {
            if (standardType === 'middle' && values.customSingle !== undefined) {
                const res = await AddMiddleStandard({
                    MiddleValue: values.customSingle,
                    MinValue: -1,
                    MaxValue: -1,
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
                    MiddleValue: -1,
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
        const employeeID = Number(localStorage.getItem('employeeid'));
        const combinedDateTime = dayjs(values.date)
            .hour(dayjs(values.time).hour())
            .minute(dayjs(values.time).minute())
            .second(dayjs(values.time).second())
            .millisecond(0);
        // ตรวจสอบค่ามาตรฐาน
        const isOther = values.unit === 'other';
        const unitID = isOther ? null : values.unit;
        const customUintValue = isOther ? values.customUnit : null;

        if (selectedTreatmentID === 3) {
            // กรณี "ก่อนและหลังบำบัด" ส่งข้อมูล 2 ชุด
            const payloadBefore: BodcenterInterface = {
                Date: combinedDateTime.toISOString(),
                Data: values.valueBefore,
                BeforeAfterTreatmentID: 1,
                StandardID: standardID,
                UnitID: unitID,
                CustomUnit: customUintValue,
                EmployeeID: employeeID,
                Note: values.note,
            };

            const payloadAfter: BodcenterInterface = {
                Date: combinedDateTime.toISOString(),
                Data: values.valueAfter,
                BeforeAfterTreatmentID: 2,
                StandardID: standardID,
                UnitID: unitID,
                CustomUnit: customUintValue,
                EmployeeID: employeeID,
                Note: values.note,
            };

            const res1 = await createBOD(payloadBefore);
            const res2 = await createBOD(payloadAfter);

            if ((res1 as any)?.status === 201 && (res2 as any)?.status === 201) {
                messageApi.success('บันทึกข้อมูลBODก่อนและหลังบำบัดสำเร็จ');
                // รีเซ็ตฟอร์มและ state
                form.resetFields();
                setIsOtherunitSelected(false);
                setUseCustomStandard(false);
                setCustomSingleValue(undefined);
                setCustomMinValue(undefined);
                setCustomMaxValue(undefined);
                await GetfirstrowBOD();
                await fetchInitialData();
                await delay(1500);  // หน่วงเวลา 1.5 วินาที
                if (onSuccess) await onSuccess();
                onCancel?.(); // ปิด modal
                // setTimeout(() => {
                //     window.location.reload();
                // }, 1500); // รอ 1 วินาทีก่อนรีเฟรช เพื่อให้ข้อความ success แสดงทัน
            } else {
                message.error('ไม่สามารถบันทึกข้อมูลก่อนหรือหลังได้');
            }
        } else {
            const BodData: BodcenterInterface = {
                Date: combinedDateTime.toISOString(),
                Data: values.data,
                Note: values.note,
                BeforeAfterTreatmentID: values.before_after,
                StandardID: standardID,
                UnitID: unitID,
                CustomUnit: customUintValue, // สมมุติว่า backend รองรับ
                EmployeeID: employeeID,
            }
            const response = await createBOD(BodData);
            console.log(BodData);
            if (response.status === 201) {
                messageApi.open({
                    type: 'success',
                    content: 'การบันทึกข้อมูลBODสำเร็จ',
                });
                form.resetFields();
                setIsOtherunitSelected(false);
                setUseCustomStandard(false);
                setCustomSingleValue(undefined);
                setCustomMinValue(undefined);
                setCustomMaxValue(undefined);
                await GetfirstrowBOD();
                await fetchInitialData();
                await delay(1500);  // หน่วงเวลา 1.5 วินาที
                if (onSuccess) await onSuccess();
                onCancel?.();// ปิด modal
                // setTimeout(() => {
                //     window.location.reload();
                // }, 1500); // รอ 1 วินาทีก่อนรีเฟรช
            } else {
                throw new Error(`การบันทึกข้อมูลไม่สำเร็จ สถานะ: ${response.status}`);
            }
        }
    };

    return (
        <div>
            {contextHolder}
            <div className="bod-container">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    initialValues={{
                        date: dayjs(),       // วันที่ปัจจุบันตอนเปิดฟอร์มครั้งแรก
                        time: dayjs(),       // เวลา ณ ตอนเปิดฟอร์มครั้งแรก
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
                        <div className="bod-from-mini">
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
                                        rules={[{ required: true, message: 'กรุณากรอกหน่วย' },
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
                                        <Input
                                            style={{ width: '100%' }}
                                            placeholder="กรอกหน่วยกำหนดเอง"
                                        />
                                    </Form.Item>
                                )}
                            </Form.Item>
                        </div>
                        <div className="bod-from-mini">
                            <Form.Item label="ประเภทมาตรฐาน" name="standardType">
                                <Select defaultValue="middle" onChange={handleStandardGroupChange}>
                                    <Option value="middle">ค่าเดี่ยว</Option>
                                    <Option value="range">ช่วง (Min - Max)</Option>
                                </Select>
                            </Form.Item>

                            <div style={{ position: 'relative', top: '-15px' }}>
                                {/* ค่าเดี่ยว */}
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

                                {standardType === 'middle' && useCustomStandard && (
                                    <Form.Item
                                        label="กำหนดเอง (ค่าเดี่ยว)"
                                        name="customSingle"
                                        rules={[{ required: true, message: 'กรุณากรอกค่ามาตรฐาน' },
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
                                            placeholder="กรอกค่ากลาง"
                                            style={{ width: '100%' }}
                                            value={customSingleValue}
                                            onChange={(value) => setCustomSingleValue(value ?? undefined)}
                                            step={0.01}
                                        />
                                    </Form.Item>
                                )}

                                {/* ค่าช่วง */}
                                {standardType === 'range' && !useCustomStandard && (
                                    <Form.Item
                                        label="ช่วง (Min - Max)"
                                        name="standardID"
                                        rules={[{ required: true, message: 'กรุณาเลือกช่วงมาตรฐาน' }]}
                                    >
                                        <Select placeholder="เลือกช่วง" onChange={handleStandardSelectChange}>
                                            {rangeStandards.map((s) => (
                                                <Option key={s.ID} value={s.ID}>
                                                    {s.MinValue} - {s.MaxValue}
                                                </Option>
                                            ))}
                                            <Option value="custom">กำหนดเอง (ช่วง)</Option>
                                        </Select>
                                    </Form.Item>
                                )}

                                {standardType === 'range' && useCustomStandard && (
                                    <div className="bod-fornt-small">
                                        <Form.Item
                                            label="ค่าต่ำสุด (Min)"
                                            name="customMin"
                                            rules={[{ required: true, message: 'กรุณากรอกค่าต่ำสุด' },
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
                                            rules={[{ required: true, message: 'กรุณากรอกค่าสูงสุด' },
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

                    <div className="bod-form-group">
                        <div className='bod-from-mini'>
                            <Form.Item
                                label="ก่อน / หลัง / ก่อนเเละหลังบำบัด"
                                name="before_after"
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
                        </div>
                        <div className='bod-from-mini'>
                            {selectedTreatmentID === 3 ? (
                                <div style={{ display: 'flex', gap: '30px' }}>
                                    <Form.Item
                                        label="ค่าที่วัดได้ก่อนบำบัด"
                                        name="valueBefore"
                                        rules={[{ required: true, message: 'กรุณากรอกค่าก่อนบำบัด' },
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
                                        <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าก่อนบำบัด" step={0.01} />
                                    </Form.Item>

                                    <Form.Item
                                        label="ค่าที่วัดได้หลังบำบัด"
                                        name="valueAfter"
                                        rules={[{ required: true, message: 'กรุณากรอกค่าหลังบำบัด' },
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
                                        <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าหลังบำบัด" step={0.01} />
                                    </Form.Item>
                                </div>
                            ) : (
                                <Form.Item
                                    label="ค่าที่วัดได้"
                                    name="data"
                                    rules={[{ required: true, message: 'กรุณากรอกค่าที่วัดได้' },
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
                                    <InputNumber style={{ width: '100%' }} placeholder="กรุณากรอกค่าที่วัดได้" step={0.01} />
                                </Form.Item>
                            )}
                        </div>
                    </div>
                    <div className="bod-form-group">
                        <Form.Item label="หมายเหตุ" name="note">
                            <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
                        </Form.Item>
                    </div>
                    <Form.Item className="bod-form-actions" >
                        {/* <div > */}
                        <Button className="bod-cancel" htmlType="button" onClick={handleCancelClick} >
                            ยกเลิก
                        </Button>
                        <Button htmlType="reset" className="bod-reset" onClick={handleClear} >
                            รีเซ็ต
                        </Button>
                        <Button type="primary" htmlType="submit" className="bod-submit">
                            บันทึก
                        </Button>
                        {/* </div> */}
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default BODCentralForm;
