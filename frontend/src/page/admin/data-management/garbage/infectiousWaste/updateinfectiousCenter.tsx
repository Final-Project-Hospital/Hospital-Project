//CustomTarget: {type: 'range', min: 7, max: 8}
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import '../recycledWaste/updateRecycledCenter.css';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select, Input, message } from 'antd';
import {
    ListMiddleTarget,
    ListRangeTarget,
    ListUnit
} from '../../../../../services/index';
import { CheckUnit, CheckTarget } from '../../../../../services/index';
import { UpdateOrCreateInfectious } from '../../../../../services/garbageServices/infectiousWaste';
import { ListMiddleTargetInterface, ListRangeTargetInterface } from '../../../../../interface/ITarget';
import { ListUnitInterface } from '../../../../../interface/IUnit';

const { Option } = Select;

interface UpdateInfectiousCentralFormProps {
    initialValues: any;
    onSuccess?: () => void;
    onCancel: () => void;
}

const UpdateInfectiousCentralForm: React.FC<UpdateInfectiousCentralFormProps> = ({
    initialValues,
    onSuccess,
    onCancel
}) => {
    const [form] = Form.useForm();

    const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
    const [middleTargets, setMiddleTargets] = useState<ListMiddleTargetInterface[]>([]);
    const [rangeTargets, setRangeTargets] = useState<ListRangeTargetInterface[]>([]);
    const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);

    const [customSingleTarget, setCustomSingleTarget] = useState<number | undefined>(undefined);
    const [customMinTarget, setCustomMinTarget] = useState<number | undefined>(undefined);
    const [customMaxTarget, setCustomMaxTarget] = useState<number | undefined>(undefined);
    const [isOtherUnitSelected, setIsOtherunitSelected] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [targetType, setTargetType] = useState('middle');
    const [useCustomTarget, setUseCustomTarget] = useState(false);

    useEffect(() => {
        // โหลด options
        const fetchInitialData = async () => {
            const [units, targetsMiddle, targetsRange] = await Promise.all([
                ListUnit(),
                ListMiddleTarget(),
                ListRangeTarget()
            ]);

            if (units) setUnitOptions(units);
            if (targetsMiddle) setMiddleTargets(targetsMiddle);
            if (targetsRange) setRangeTargets(targetsRange);
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!initialValues || initialValues.length === 0) return;

        const single = initialValues[0];

        // ฟังก์ชันเฉพาะ useEffect นี้: ปัดทศนิยม 2 ตำแหน่งแบบ round-half-up
        const toTwoDecimal = (value: any) => {
            if (value === null || value === undefined) return undefined;
            const num = Number(value);
            if (isNaN(num)) return undefined;
            return Math.round((num + Number.EPSILON) * 100) / 100;
        };

        // กำหนดประเภท Target
        const stdType = single.MinTarget === 0 && single.MaxTarget === 0 ? "middle" : "range";
        setTargetType(stdType);

        // ตั้งค่าในฟอร์ม
        form.setFieldsValue({
            id: single.ID,
            date: dayjs(single.Date),
            time: dayjs(),
            quantity: toTwoDecimal(single.Quantity),
            aadc: toTwoDecimal(single.AADC),
            monthlyGarbage: toTwoDecimal(single.MonthlyGarbage),
            average_daily_garbage: toTwoDecimal(single.AverageDailyGarbage),
            note: single.Note || "",
            targetID: single.TargetID,
            unit: single.UnitID ?? "other",
            employeeID: single.EmployeeID,
            targetType: stdType,
            customSingle: stdType === "middle" ? single.MiddleTarget : undefined,
            customMin: stdType === "range" ? single.MinTarget : undefined,
            customMax: stdType === "range" ? single.MaxTarget : undefined,
        });

        setSelectedTreatmentID(single.BeforeAfterTreatmentID);
    }, [initialValues]);

    const handleTargetGroupChange = (value: string) => {
        setTargetType(value);
        setUseCustomTarget(false);
        form.setFieldsValue({
            targetID: undefined,
            customSingle: undefined,
            customMin: undefined,
            customMax: undefined,
        });
    };

    const handleTargetSelectChange = (value: string) => {
        if (value === 'custom') {
            setUseCustomTarget(true);
            form.setFieldsValue({ targetID: undefined });
        } else {
            setUseCustomTarget(false);
        }
    };

    // คำนวณ AADC อัตโนมัติ
    const calculateAADC = () => {
        const quantity = form.getFieldValue("quantity");
        const monthlyGarbage = form.getFieldValue("monthlyGarbage");

        if (quantity && monthlyGarbage && quantity > 0) {
            const aadc = monthlyGarbage / (quantity * quantity);
            form.setFieldsValue({
                aadc: parseFloat(aadc.toFixed(2)),
            });
        } else {
            form.setFieldsValue({ aadc: null });
        }
    };

    const handleFinish = async (values: any) => {
        try {
            const combinedDateTime = dayjs(values.date)
                .hour(dayjs(values.time).hour())
                .minute(dayjs(values.time).minute())
                .second(dayjs(values.time).second())
                .toISOString();

            const employeeID = user?.ID ?? Number(localStorage.getItem("employeeid"));
            const isOther = values.unit === "other";
            const unitID: number = isOther ? 0 : values.unit;

            let targetPayload: any = null;
            if (targetType === "middle" && useCustomTarget && values.customSingle !== undefined) {
                targetPayload = { type: "middle", value: values.customSingle };
            } else if (targetType === "range" && useCustomTarget && values.customMin !== undefined && values.customMax !== undefined) {
                targetPayload = { type: "range", min: values.customMin, max: values.customMax };
            }

            const payload = {
                ID: initialValues[0]?.ID ?? 0,
                Date: combinedDateTime,
                Quantity: values.quantity ?? 0,
                AADC: values.aadc ?? 0,
                MonthlyGarbage: values.monthlyGarbage ?? 0,
                AverageDailyGarbage: values.average_daily_garbage ?? 0,
                TotalSale: values.totalSale ?? 0,
                Note: values.note ?? "",
                TargetID: targetPayload ? null : values.targetID ?? 0,
                UnitID: unitID,
                EmployeeID: employeeID,
                CustomTarget: targetPayload,
                CustomUnit: isOther ? values.customUnit : "",
            };

            await UpdateOrCreateInfectious(payload);

            messageApi.success("แก้ไขข้อมูลสำเร็จ");
            onSuccess?.();

        } catch (error: any) {
            if (error.response) {
                console.error("Server response error:", error.response.data);
            } else {
                console.error("Error updating Garbage:", error);
            }
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
            >
                <div className="up-form-group-recy">
                    <Form.Item label="วันที่บันทึกข้อมูล" name="date">
                        <DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" className="up-recy-full-width" />
                    </Form.Item>
                    <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
                        <TimePicker defaultValue={dayjs()} format={"HH:mm"} className="up-recy-full-width" />
                    </Form.Item>
                </div>

                <div className="up-form-group-recy">
                    <div className="up-form-group-mini-recy">
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

                    <div className="up-form-group-mini-recy">
                        <Form.Item label="ค่า Target" name="targetType">
                            <Select defaultValue="middle" onChange={handleTargetGroupChange}>
                                <Option value="middle">ค่าเดี่ยว</Option>
                                <Option value="range">ช่วง (Min - Max)</Option>
                            </Select>
                        </Form.Item>

                        <div style={{ position: 'relative', top: '-15px' }}>
                            {/* ค่าเดี่ยว */}
                            {targetType === 'middle' && !useCustomTarget && (
                                <Form.Item
                                    label="ค่าเดี่ยว"
                                    name="targetID"
                                    rules={[{ required: true, message: 'กรุณาเลือกค่าเดี่ยว' }]}
                                >
                                    <Select placeholder="เลือกค่าเดี่ยว" onChange={handleTargetSelectChange}>
                                        {middleTargets.map((s) => (
                                            <Option key={s.ID} value={s.ID}>
                                                {s.MiddleTarget.toFixed(2)}
                                            </Option>
                                        ))}
                                        <Option value="custom">กำหนดเอง (ค่าเดี่ยว)</Option>
                                    </Select>
                                </Form.Item>
                            )}

                            {targetType === 'middle' && useCustomTarget && (
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
                                            const data = await CheckTarget("middle", value);
                                            if (!data) return Promise.reject("ไม่สามารถตรวจสอบค่า Target ได้");
                                            if (data.exists) return Promise.reject("ค่า Target นี้มีอยู่แล้วในระบบ");
                                            return Promise.resolve();
                                        },
                                    },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="กรอกค่ากลาง"
                                        style={{ width: '100%' }}
                                        value={customSingleTarget}
                                        onChange={(value) => setCustomSingleTarget(value ?? undefined)}
                                        step={0.01}
                                    />
                                </Form.Item>
                            )}

                            {/* ค่าช่วง */}
                            {targetType === 'range' && !useCustomTarget && (
                                <Form.Item
                                    label="ช่วง (Min - Max)"
                                    name="targetID"
                                    rules={[{ required: true, message: 'กรุณาเลือกช่วง Target' }]}
                                >
                                    <Select placeholder="เลือกช่วง" onChange={handleTargetSelectChange}>
                                        {rangeTargets.map((s) => (
                                            <Option key={s.ID} value={s.ID}>
                                                {s.MinTarget.toFixed(2)} - {s.MaxTarget.toFixed(2)}
                                            </Option>
                                        ))}
                                        <Option value="custom">กำหนดเอง (ช่วง)</Option>
                                    </Select>
                                </Form.Item>
                            )}

                            {targetType === 'range' && useCustomTarget && (
                                <div className="gener-fornt-small">
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
                                            value={customMinTarget}
                                            onChange={(value) => setCustomMinTarget(value ?? undefined)}
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
                                                // เรียก CheckTarget
                                                const data = await CheckTarget("range", { min, max: value });
                                                if (!data) return Promise.reject("ไม่สามารถตรวจสอบค่า Target ได้");
                                                if (data.exists) return Promise.reject("ช่วงค่า Target นี้มีอยู่แล้วในระบบ");
                                                return Promise.resolve();
                                            },
                                        }),
                                        ]}
                                        style={{ flex: 1 }}
                                    >
                                        <InputNumber
                                            placeholder="ค่าสูงสุด"
                                            style={{ width: '100%' }}
                                            value={customMaxTarget}
                                            onChange={(value) => setCustomMaxTarget(value ?? undefined)}
                                            step={0.01}
                                        />
                                    </Form.Item>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="up-form-group-recy">
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
                        <InputNumber style={{ width: '100%' }} placeholder="กรอกจำนวนคน"
                            onChange={() => {
                                // คำนวณ aadc อัตโนมัติ
                                calculateAADC();
                            }} />
                    </Form.Item>

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
                                // คำนวณ aadc อัตโนมัติ
                                calculateAADC();

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

                <div className="up-form-group-recy">
                    <Form.Item
                        label="ค่า AADC (คำนวณอัตโนมัติ)"
                        name="aadc">
                        <InputNumber style={{ width: '100%' }} placeholder="คำนวณอัตโนมัติ" step={0.01} disabled />
                    </Form.Item>

                    <Form.Item label="ปริมาณขยะต่อวัน (คำนวณอัตโนมัติ)" name="average_daily_garbage">
                        <InputNumber style={{ width: "100%" }} disabled placeholder="คำนวณอัตโนมัติ" />
                    </Form.Item>
                </div>

                <div className="up-form-group-recy">
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
            </Form>
        </div>
    );
};

export default UpdateInfectiousCentralForm;