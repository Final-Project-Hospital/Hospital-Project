import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Button, DatePicker, TimePicker, Select, Input, message } from 'antd';
import dayjs from 'dayjs';
import './recycledWaste.css';
import { RecycledcenterInterface } from '../../../../../interface/Igarbage/IrecycledWaste';
import { createRecycled, GetfirstRecycled } from '../../../../../services/garbageServices/recycledWaste';
import { ListUnit } from '../../../../../services/index';
import { ListUnitInterface } from '../../../../../interface/IUnit';
import { CheckUnit } from '../../../../../services/index';

type Props = {
  onCancel?: () => void;
  onSuccess?: () => void;
};
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const { Option } = Select;
const RecycledWasteForm: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [isOtherUnitSelected, setIsOtherunitSelected] = useState(false);

  const fetchInitialData = async () => {
    const [units] = await Promise.all([
      ListUnit(),
    ]);
    if (units) setUnitOptions(units);
  };

  const GetfirstrowRecycled = async () => {
    try {
      const responfirstHAS = await GetfirstRecycled();
      if (responfirstHAS.status === 200) {
        const data = responfirstHAS.data;
        form.setFieldsValue({
          unit: data.UnitID,
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
    GetfirstrowRecycled();
    fetchInitialData();
  }, []);

  const handleClear = () => {
    form.resetFields();
  };

  const handleCancelClick = () => {
    form.resetFields();
    onCancel?.();
  };

  const handleFinish = async (values: any) => {
    try {
      console.log('Form Values:', values);

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
      console.log("unit", isOther);

      // สร้าง payload สำหรับส่งไป API
      const payload: RecycledcenterInterface = {
        Date: combinedDateTime.toISOString(),
        Quantity: values.quantity,
        MonthlyGarbage: values.monthlyGarbage,
        AverageDailyGarbage: values.average_daily_garbage,
        TotalSale: values.totalSale,
        Note: values.note ?? '',
        UnitID: unitID,
        CustomUnit: customUnitValue,
        EmployeeID: employeeID,
      };

      console.log('Payload to createHazardous:', payload);

      // เรียก API บันทึกข้อมูล
      const response = await createRecycled(payload);

      if (response.status === 201) {
        messageApi.success('บันทึกข้อมูลขยะรีไซเคิลสำเร็จ');
        form.resetFields();
        setIsOtherunitSelected(false);
        await delay(500);
        await fetchInitialData();
        await GetfirstrowRecycled();
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
      <div className="recy-container">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <div className="recy-form-group">
            <Form.Item label="วันที่บันทึกข้อมูล" name="date">
              <DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" className="recy-full-width" />
            </Form.Item>

            <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
              <TimePicker defaultValue={dayjs()} format={"HH:mm"} className="recy-full-width" />
            </Form.Item>
          </div>

          <div className="recy-form-group">
            <div className="recy-from-mini">
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

            {/* <div className="recy-form-group"> */}
            <div className="recy-from-mini">
              <Form.Item
                label="จำนวนคนที่เข้าใช้บริการโรงพยาบาล"
                name="quantity"
                rules={[{ required: true, message: 'กรุณากรอกจำนวนคน' },
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
            <Form.Item label="หมายเหตุ" name="note">
              <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
            </Form.Item>
          </div>

          <Form.Item className="recy-form-actions" >
            <Button className="recy-cancel" htmlType="button" onClick={handleCancelClick} >
              ยกเลิก
            </Button>
            <Button htmlType="reset" className="recy-reset" onClick={handleClear} >
              รีเซ็ต
            </Button>
            <Button type="primary" htmlType="submit" className="recy-submit">
              บันทึก
            </Button>
          </Form.Item>
        </Form>
      </div >
    </div >
  );
};

export default RecycledWasteForm;
