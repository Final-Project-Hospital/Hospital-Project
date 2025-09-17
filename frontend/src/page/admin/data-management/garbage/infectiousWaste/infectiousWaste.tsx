import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select, Input, message } from 'antd';
import dayjs from 'dayjs';
import './infectiousWaste.css';
import { InfectiouscenterInterface } from '../../../../../interface/Igarbage/IinfectiousWaste';
import { createInfectious, GetfirstInfectious } from '../../../../../services/garbageServices/infectiousWaste';
import { ListUnit } from '../../../../../services/index';
import { ListUnitInterface } from '../../../../../interface/IUnit';
import { ListMiddleTarget, ListRangeTarget, AddMiddleTarget, AddRangeTarget, } from '../../../../../services/index';
import { ListMiddleTargetInterface, ListRangeTargetInterface } from '../../../../../interface/ITarget';
import { CheckUnit, CheckTarget } from '../../../../../services/index';

type Props = {
  onCancel?: () => void;
  onSuccess?: () => void;
};
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const { Option } = Select;
const InfectiousWasteForm: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [isOtherUnitSelected, setIsOtherunitSelected] = useState(false);
  const [middleTargets, setMiddleTargets] = useState<ListMiddleTargetInterface[]>([]);
  const [rangeTargets, setRangeTargets] = useState<ListRangeTargetInterface[]>([]);
  const [targetType, setTargetType] = useState<string>('middle'); // middle or range
  const [useCustomTarget, setUseCustomTarget] = useState<boolean>(false);
  const [customSingleTarget, setCustomSingleTarget] = useState<number | undefined>(undefined);
  const [customMinTarget, setCustomMinTarget] = useState<number | undefined>(undefined);
  const [customMaxTarget, setCustomMaxTarget] = useState<number | undefined>(undefined);

  const fetchInitialData = async () => {
    const [units, targetsMiddle, targetsRange] = await Promise.all([
      ListUnit(),
      ListMiddleTarget(),
      ListRangeTarget(),
    ]);

    if (units) setUnitOptions(units);
    if (targetsMiddle) {
      setMiddleTargets(
        targetsMiddle.map((s: any) => ({
          ...s,
          MiddleTarget: Number(s.MiddleTarget).toFixed(2)
        }))
      );
    }
    if (targetsRange) {
      setRangeTargets(
        targetsRange.map((s: any) => ({
          ...s,
          MinTarget: Number(s.MinTarget).toFixed(2),
          MaxTarget: Number(s.MaxTarget).toFixed(2)
        }))
      );
    }
  };

  const GetfirstrowInfectious = async () => {
    try {
      const responfirstHAS = await GetfirstInfectious();
      if (responfirstHAS.status === 200) {
        const data = responfirstHAS.data;
        const isMiddle = data.MinTarget === 0 && data.MaxTarget === 0;
        setTargetType(isMiddle ? 'middle' : 'range');
        form.setFieldsValue({
          unit: data.UnitID,
          targetType: isMiddle ? 'middle' : 'range',
          targetID: data.TargetID,
        });

      } else {
        message.error("ไม่สามารถดึงข้อมูลได้ สถานะ: " + responfirstHAS.status);
      }
    } catch (error) {
      console.error("Error fetching severity levels:", error);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }

  };
  useEffect(() => {
    GetfirstrowInfectious();
    fetchInitialData();
  }, []);

  const handleClear = () => {
    form.resetFields();
  };

  const handleCancelClick = () => {
    form.resetFields();
    onCancel?.();
  };

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
      let aadc = monthlyGarbage / (quantity * quantity);

      form.setFieldsValue({
        aadc,
      });
    } else {
      form.setFieldsValue({ aadc: null });
    }
  };

  const handleFinish = async (values: any) => {
    try {
      console.log('Form Values:', values);

      // กรณีใช้มาตรฐานกำหนดเอง (Custom Target)
      let targetID = values.targetID ?? null;

      if (useCustomTarget) {
        if (targetType === 'middle' && values.customSingle !== undefined) {
          const res = await AddMiddleTarget({
            MiddleTarget: values.customSingle,
            MinTarget: 0,
            MaxTarget: 0,
          });
          if (res && res.ID) {
            targetID = res.ID;
            setMiddleTargets(prev => [...prev, res]);
          }
        } else if (targetType === 'range' && values.customMin !== undefined && values.customMax !== undefined) {
          const res = await AddRangeTarget({
            MiddleTarget: 0,
            MinTarget: values.customMin,
            MaxTarget: values.customMax,
          });
          if (res && res.ID) {
            targetID = res.ID;
            setRangeTargets(prev => [...prev, res]);
          }
        }
      }

      console.log('Final targetID:', targetID);

      if (!targetID || targetID === 0) {
        message.error('กรุณาเลือกหรือกำหนดมาตรฐานก่อนบันทึก');
        return;
      }

      // ดึง employeeID จาก localStorage
      const employeeID = Number(localStorage.getItem('employeeid'));
      console.log('EmployeeID:', employeeID);

      // กรณีหน่วยเป็นอื่นๆ (other) จะใช้ customUnit แทน unitID
      const isOther = values.unit === 'other';
      const combinedDateTime = dayjs(values.date)
        .hour(dayjs(values.time).hour())
        .minute(dayjs(values.time).minute())
        .second(0);
      const unitID = isOther ? null : values.unit;
      const customUnitValue = isOther ? values.customUnit : null;

      // สร้าง payload สำหรับส่งไป API
      const payload: InfectiouscenterInterface = {
        Date: combinedDateTime.toISOString(),
        Quantity: values.quantity,
        AADC: values.aadc,
        MonthlyGarbage: values.monthlyGarbage,
        AverageDailyGarbage: values.average_daily_garbage,
        TotalSale: values.totalSale ?? 0,
        Note: values.note ?? '',
        TargetID: targetID,
        UnitID: unitID,
        CustomUnit: customUnitValue,
        EmployeeID: employeeID,
      };

      console.log('Payload to createHazardous:', payload);

      // เรียก API บันทึกข้อมูล
      const response = await createInfectious(payload);

      if (response.status === 201) {
        messageApi.success('บันทึกข้อมูลขยะติดเชื้อสำเร็จ');
        form.resetFields();               // เคลียร์ฟอร์มทั้งหมด
        setIsOtherunitSelected(false);   // ซ่อนช่องกรอกหน่วยเอง
        setUseCustomTarget(false);       // ซ่อนช่องกรอก target เอง
        setCustomSingleTarget(undefined);
        setCustomMinTarget(undefined);
        setCustomMaxTarget(undefined);
        await delay(500);
        await fetchInitialData()
        GetfirstrowInfectious();
        if (onSuccess) await onSuccess();
        onCancel?.();
      } else {
        message.error(`การบันทึกข้อมูลไม่สำเร็จ สถานะ: ${response.status}`);
        console.error('API error response:', response);
      }
    } catch (error: any) {
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      console.error('API error:', error.response?.data || error.message || error);
    }
  };

  return (
    <div>
      {contextHolder}
      <div className="inf-container">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <div className="inf-form-group">
            <Form.Item label="วันที่บันทึกข้อมูล" name="date">
              <DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" className="inf-full-width" />
            </Form.Item>

            <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
              <TimePicker defaultValue={dayjs()} format={"HH:mm"} className="inf-full-width" />
            </Form.Item>
          </div>

          <div className="inf-form-group">
            <div className="inf-from-mini">
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
            <div className="inf-from-mini">
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
                          {s.MiddleTarget}
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
                        if (value !== undefined && value < 0) {
                          return Promise.reject("กรุณาไม่กรอกค่าติดลบ");
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
                      placeholder="กรอกค่าเดี่ยว"
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
                          {s.MinTarget} - {s.MaxTarget}
                        </Option>
                      ))}
                      <Option value="custom">กำหนดเอง (ช่วง)</Option>
                    </Select>
                  </Form.Item>
                )}

                {targetType === 'range' && useCustomTarget && (
                  <div className="inf-fornt-small">
                    <Form.Item
                      label="ค่าต่ำสุด (Min)"
                      name="customMin"
                      rules={[{ required: true, message: 'กรุณากรอกค่าต่ำสุด' },
                      ({ getFieldValue }) => ({
                        validator: (_, val) => {
                          const max = getFieldValue("customMax");
                          if (val >= max) return Promise.reject("Min ต้องน้อยกว่า Max");
                          if (val !== undefined && val < 0) {
                            return Promise.reject("กรุณาไม่กรอกค่าติดลบ");
                          }
                          return Promise.resolve();
                        },
                      }),

                      ]}
                      style={{ flex: 1 }}
                    >
                      <InputNumber
                        placeholder="กรอกค่าต่ำสุด"
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
                          if (value !== undefined && value < 0) {
                            return Promise.reject("กรุณาไม่กรอกค่าติดลบ");
                          }
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
                        placeholder="กรอกค่าสูงสุด"
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

          <div className="inf-form-group">
            <div className="inf-from-mini">
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
                      if (value !== undefined && value < 0) {
                        return Promise.reject("กรุณาไม่กรอกค่าติดลบ");
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
            </div>

            <div className="inf-from-mini">
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
                      if (value !== undefined && value < 0) {
                        return Promise.reject("กรุณาไม่กรอกค่าติดลบ");
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
          </div>

          <div className="inf-form-group">
            <div className="inf-from-mini">
              <Form.Item
                label="ค่า AADC (คำนวณอัตโนมัติ)"
                name="aadc">
                <InputNumber style={{ width: '100%' }} placeholder="คำนวณอัตโนมัติ" step={0.01} disabled
                  formatter={(value) => value !== undefined && value !== null ? Number(value).toFixed(2) : ""}
                  parser={(value) => value ? parseFloat(value) : 0} />
              </Form.Item>
            </div>

            <div className="inf-from-mini">
              <Form.Item label="ปริมาณขยะต่อวัน (คำนวณอัตโนมัติ)" name="average_daily_garbage">
                <InputNumber style={{ width: "100%" }} disabled placeholder="คำนวณอัตโนมัติ"
                  formatter={(value) => value !== undefined && value !== null ? Number(value).toFixed(2) : ""}
                  parser={(value) => value ? parseFloat(value) : 0} />
              </Form.Item>
            </div>
          </div>

          <div className="inf-form-group">
            <Form.Item label="หมายเหตุ" name="note">
              <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
            </Form.Item>
          </div>
          <Form.Item className="inf-form-actions" >
            <Button className="inf-cancel" htmlType="button" onClick={handleCancelClick} >
              ยกเลิก
            </Button>
            <Button htmlType="reset" className="inf-reset" onClick={handleClear} >
              รีเซ็ต
            </Button>
            <Button type="primary" htmlType="submit" className="inf-submit">
              บันทึก
            </Button>
          </Form.Item>
        </Form>
      </div >
    </div >
  );
};

export default InfectiousWasteForm;
