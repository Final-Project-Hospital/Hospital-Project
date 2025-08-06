import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import "../../wastewater/TKNcenter/TKNcenter.css";
import {
  Form,
  InputNumber,
  Button,
  DatePicker,
  TimePicker,
  Select,
  Input,
  message,
} from "antd";
import { ListBeforeAfterTreatment, ListMiddleStandard, ListRangeStandard, AddMiddleStandard, AddRangeStandard, ListUnit } from '../../../../../services/index';
import { CreateTCB, GetfirstTCB } from "../../../../../services/tapwater";
import { ListBeforeAfterTreatmentInterface } from "../../../../../interface/IBeforeAfterTreatment";
import { ListMiddleStandardInterface, ListRangeStandardInterface } from '../../../../../interface/IStandard';
import { ListUnitInterface } from "../../../../../interface/IUnit";
import { CreateTTCBInterface } from "../../../../../interface/ITapwater";

const { Option } = Select;

const TKNCenterForm: React.FC = () => {
  //from
  const [form] = Form.useForm();

  const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
  const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);

  const [isOtherUnitSelected, setIsOtherunitSelected] = useState(false);
  const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  
  //standdart
  const [midddleStandards, setMiddleStandards] = useState<ListMiddleStandardInterface[]>([]);
  const [rangeStandards, setRangeStandards] = useState<ListRangeStandardInterface[]>([]);
  const [standardType, setStandardType] = useState<string>('middle'); // middle or range
  const [useCustomStandard, setUseCustomStandard] = useState<boolean>(false);
  const [customSingleValue, setCustomSingleValue] = useState<number | undefined>(undefined);
  const [customMinValue, setCustomMinValue] = useState<number | undefined>(undefined);
  const [customMaxValue, setCustomMaxValue] = useState<number | undefined>(undefined);
  
  const renderCustomTreatmentLabel = (text: string) => (
    <>
      ค่า TKN บริเวณบ่อพักน้ำทิ้ง
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
      if (standardsMiddle) setMiddleStandards(standardsMiddle);
      if (standardsRange) setRangeStandards(standardsRange);
    };
    const GetfirstrowTKN = async () => {
      try {
        const responfirstTKN = await GetfirstTCB();
        if (responfirstTKN.status === 200) {
          const data = responfirstTKN.data;

          console.log(data.StandardID);
          const isMiddle = data.MinValue === 0 && data.MaxValue === 0;
          setStandardType(isMiddle ? 'middle' : 'range');
          form.setFieldsValue({
              unit: data.UnitID ?? 'other',
              standardType: isMiddle ? 'middle' : 'range',
              standardID: data.StandardID,
          });
          setSelectedTreatmentID(data.BeforeAfterTreatmentID);
        } else {
            message.error("ไม่สามารถดึงข้อมูล TKN ล่าสุดได้");
        }
      } catch (error) {
          console.error("Error fetching first TKN:", error);
          message.error("เกิดข้อผิดพลาดในการโหลดค่าล่าสุด");
      }
    };
    fetchInitialData();
    GetfirstrowTKN()
  }, []);

    const handleCancel = () => {
        form.resetFields();
        setSelectedTreatmentID(null);
        setUseCustomStandard(false);
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
    try{
          let standardID = values.standardID ?? null;

          //กำหนดค่าเอง
          if (useCustomStandard) {
              if (standardType === 'middle' && values.customSingle !== undefined) {
                const response = await AddMiddleStandard({
                  MiddleValue: values.customSingle,
                  MinValue: 0,
                  MaxValue: 0,
                });

                if (response && response.ID) {
                  standardID = response.ID;
                  setMiddleStandards(prev => [...prev, response]);
                }
          }else if (
            standardType === 'range' &&
            values.customMin !== undefined &&
            values.customMax !== undefined
          ){
            const response = await AddRangeStandard({
              MiddleValue: 0,
              MinValue: values.customMin,
              MaxValue: values.customMax,
            });
            if (response && response.ID){
              standardID = response.ID;
              setRangeStandards(prev => [...prev, response])
            }
          }
        }

        //เช็ค standardID
        if (!standardID){
          message.error('กรุณาเลือกหรือกำหนดมาตรฐานก่อนบันทึก');
          return;
        }
        const dateValue = values.date ?? dayjs();
        const timeValue = values.time ?? dayjs();
        const combinedDate = dateValue.set('hour', timeValue.hour()).set('minute', timeValue.minute());
        
        // ดึง employeeID จาก localStorage
        const employeeID = Number(localStorage.getItem('employeeid'));
        const isOther = values.unit === 'other';
        const unitID = isOther ? null : values.unit;
        const customUintValue = isOther ? values.customUnit : null;

        if (selectedTreatmentID === 3) {
          //ก่อนและหลัง ส้ง 2 ข้อมูล
          const payloadBefore: CreateTTCBInterface = {
              Date: combinedDate.toISOString(),
              Data: values.valueBefore,
              BeforeAfterTreatmentID: 1,
              StandardID: standardID,
              UnitID: unitID,
              CustomUnit: customUintValue,
              EmployeeID: employeeID,
              Note: values.note,
          };

          const payloadAfter: CreateTTCBInterface = {
              Date: combinedDate.toISOString(),
              Data: values.valueAfter,
              BeforeAfterTreatmentID: 2,
              StandardID: standardID,
              UnitID: unitID,
              CustomUnit: customUintValue,
              EmployeeID: employeeID,
              Note: values.note,
          };
          const res1 = await CreateTCB(payloadBefore);
          const res2 = await CreateTCB(payloadAfter);

          if ((res1 as any)?.status === 201 && (res2 as any)?.status === 201) {
            messageApi.success('บันทึกข้อมูล TKN ก่อนและหลังบำบัดสำเร็จ')
            form.resetFields();
            setSelectedTreatmentID(null);
            setUseCustomStandard(false);
            setTimeout(() =>{
              window.location.reload();
            }, 1500);
          }else {
            message.error('ไม่สามารถบันทึกข้อมูลก่อนและหลังได้');
          }
        }else{
          const payload: CreateTTCBInterface = {
              Date: combinedDate.toISOString(),
              Data: values.data,
              BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
              StandardID: standardID,
              UnitID: unitID,
              CustomUnit: customUintValue,
              EmployeeID: employeeID,
              Note: values.note,
          };

          const res = await CreateTCB(payload);

          if((res as any)?.status === 201) {
            messageApi.success('บันทึกข้อมูล TKN สำเร็จ');
            form.resetFields();
            setSelectedTreatmentID(null);
            setUseCustomStandard(false);
            setTimeout(() => {
              window.location.reload();
            },1500);
          }else {
            message.error('ไม่สามารถบันทึกข้อมูลได้')
          }
        }

        setCustomSingleValue(undefined);
        setCustomMinValue(undefined);
        setCustomMaxValue(undefined);
    } catch (error){
      console.error('Error Creating TKN:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    };
  };
  return (
    <div>
      {contextHolder}
      <div className="tkn-container">
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
          <div className="tkn-form-group">
            <Form.Item label="วันที่บันทึกข้อมูล" name="date">
              <DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" className="tkn-full-width" />
            </Form.Item>
            
            <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
              <TimePicker defaultValue={dayjs()} format={"HH:mm"} className="tkn-full-width" />
            </Form.Item>
          </div>

          <div className="tkn-form-group">
            <div className = "tkn-form-mini">
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
                    onChange={(value) =>{
                      setIsOtherunitSelected(value === 'other');
                      if (value !== 'other'){
                        form.setFieldsValue({ customUnit: undefined });
                      }
                    }}
                  >
                    {unitOptions.map((u) => (
                      <Option key={u.ID} value={u.ID}>
                        {u.UnitName}
                      </Option>
                    ))}
                    <Option value= 'other'>กำหนดหน่วยเอง</Option>
                  </Select>
                </Form.Item>

                {isOtherUnitSelected &&(
                  <Form.Item
                    name = "customUnit"
                    rules={[{ required: true, message: 'กรุณากรอกหน่วย' }]}
                    style={{ marginTop: '8px'}}
                  >
                    <Input
                      style={{ width: '100%'}}
                      placeholder="กรอกหน่วยกกำหนดเอง"
                    />
                  </Form.Item>
                )}
              </Form.Item>
          </div>

          <div className="tkn-form-mini">
              <Form.Item 
                label="ประเภทมาตรฐาน"
                name="standardType">
                <Select defaultValue="middle" onChange={handleStandardGroupChange}>
                  <Option value = "middle">ค่าเดี่ยว</Option>
                  <Option value = "range">ช่วง (Min - Max)</Option>
                </Select>
              </Form.Item>

              <div style={{ position: 'relative', top: '-15px' }}>
                {/* ค่าเดี่ยว */}
                {standardType === 'middle' && !useCustomStandard && (
                  <Form.Item
                    label='ค่าเดี่ยว'
                    name='standardID'
                    rules={[{required: true, message: 'กรุณาเลือกค่าเดี่ยว'}]}
                  >
                    <Select placeholder='เลือกค่าเดี่ยว' onChange={handleStandardSelectChange}>
                      {midddleStandards.map((s) => (
                        <Option key = {s.ID} value = {s.ID}>
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
                    rules={[{required: true, message:'กรุณากรอกค่ากลาง'}]}
                  >
                    <InputNumber
                      placeholder="กรอกค่ากลาง"
                      style={{ width: '100%' }}
                      value={customSingleValue}
                      onChange={(value) => setCustomSingleValue(value ?? undefined)}
                    />
                  </Form.Item>
                )}

                {/*ค่าช่วง*/}
                {standardType === 'range' && !useCustomStandard&&(
                  <Form.Item
                    label='ช่วง (Min - Max)'
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

                {standardType === 'range' && useCustomStandard &&(
                  <div className= "tkn-fornt-small">
                    <Form.Item
                      label="ค่าต่ำสุด (Min)"
                      name="customMin"
                      rules={[{required: true, message: 'กรุณากรอกค่าต่ำสุด'}]}
                      style={{ flex: 1}}
                    >
                      <InputNumber
                        placeholder="ค่าต่ำสุด"
                        style={{ width: '100%' }}
                        value={customMinValue}
                        onChange={(value) => setCustomMinValue(value ?? undefined)}
                      />
                    </Form.Item>
                    <Form.Item
                      label="ค่าสูงสุด (Max)"
                      name="customMax"
                      rules={[{ required: true, message: 'กรุณากรอกค่าสูงสุด' }]}
                      style={{ flex: 1 }}
                    >
                      <InputNumber
                        placeholder="ค่าสูงสุด"
                        style={{ width: '100%' }}
                        value={customMaxValue}
                        onChange={(value) => setCustomMaxValue(value ?? undefined)}
                      />
                    </Form.Item>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="tkn-form-group">
            <div className='tkn-form-mini'>
                <Form.Item
                  label="ก่อน / หลัง / ก่อนเเละหลังบำบัด"
                  name="beforeAfterTreatmentID"
                  rules={[{ required: true, message: "กรุณาเลือกสถานะก่อน / หลัง / ก่อนเเละหลังบำบัด" }]}
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

            <div className="tkn-form-mini">
                  {selectedTreatmentID === 3 ? (
                    <div style={{ display: 'flex', gap: '30px' }}>
                      <Form.Item 
                        label="ค่าที่วัดได้ก่อนบำบัด" 
                        name="valueBefore" 
                        rules={[{ required: true, message: "กรุณากรอกค่าก่อนบำบัด" }]} 
                        style={{ flex: 1 }}
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าก่อนบำบัด" />
                      </Form.Item>

                      <Form.Item 
                        label="ค่าที่วัดได้หลังบำบัด" 
                        name="valueAfter" 
                        rules={[{ required: true, message: "กรุณากรอกค่าหลังบำบัด" }]} 
                        style={{ flex: 1 }}
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าหลังบำบัด" />
                      </Form.Item>
                    </div>
                ) : (
                <Form.Item 
                  label="ค่าที่วัดได้" 
                  name="data" 
                  rules={[{ required: true, message: "กรุณากรอกค่าที่วัดได้" }]}
                > 
                  <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าที่วัดได้" />
                </Form.Item>
                )}
            </div>
          </div>

          <div className="tkn-from-group">
            <Form.Item 
              label="หมายเหตุ" 
              name="note"
            >
              <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
            </Form.Item>
          </div>

          <Form.Item className="tkn-form-actions">
            
              <Button className="tkn-cancel" htmlType="button">
                ยกเลิก
              </Button>
              <Button htmlType="reset" className="tkn-reset" onClick={handleCancel}>
                รีเซ็ต
              </Button>
              <Button type="primary" htmlType="submit" className="tkn-submit">
                บันทึก
              </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default TKNCenterForm;
