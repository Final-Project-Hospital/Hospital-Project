// import React, { useEffect, useState } from 'react';
// import {
//     Form,
//     InputNumber,
//     Button,
//     DatePicker,
//     TimePicker,
//     Select,
//     Input,
//     message,
// } from 'antd';
// import dayjs from 'dayjs';
// import './PHcenter.css';

// import { ListBeforeAfterTreatment, ListStandard, ListUnit, CreatePH } from '../../../services/index';
// import { ListBeforeAfterTreatmentInterface } from '../../../interface/IBeforeAfterTreatment';
// import { ListStandardInterface } from '../../../interface/IStandard';
// import { ListUnitInterface } from '../../../interface/IUnit';
// import { CreatePHInterface } from '../../../interface/IpH';

// const { Option } = Select;

// const PHCentralForm: React.FC = () => {
//     const [form] = Form.useForm();

//     const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
//     const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
//     const [standardOptions, setStandardOptions] = useState<ListStandardInterface[]>([]);
//     const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);
//     const [messageApi, contextHolder] = message.useMessage();

//     const renderCustomTreatmentLabel = (text: string) => (
//         <>
//             ค่า pH บริเวณบ่อพักน้ำทิ้ง
//             <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span>
//             เข้าระบบบำบัด
//         </>
//     );

//     useEffect(() => {
//         const fetchInitialData = async () => {
//             const [beforeAfter, units, standards] = await Promise.all([
//                 ListBeforeAfterTreatment(),
//                 ListUnit(),
//                 ListStandard(),
//             ]);

//             if (beforeAfter) setBeforeAfterOptions(beforeAfter);
//             if (units) setUnitOptions(units);
//             if (standards) setStandardOptions(standards);
//         };

//         fetchInitialData();
//     }, []);

//     const handleFinish = async (values: any) => {
//         console.log("🎯 Form Submitted:", values);
//         try {
//             const dateValue = form.getFieldValue('date') ?? dayjs();
//             const timeValue = form.getFieldValue('time') ?? dayjs();
//             const employeeID = Number(localStorage.getItem("employeeid"));
//             console.log(employeeID)
//             const combinedDate = dateValue.set('hour', timeValue.hour()).set('minute', timeValue.minute());

//             const payload: CreatePHInterface = {
//                 Date: combinedDate.toISOString(),
//                 Data:
//                     selectedTreatmentID === 3
//                         ? (values.valueBefore + values.valueAfter) / 2
//                         : values.data,
//                 BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
//                 StandardID: values.standardID,
//                 UnitID: values.unitID,
//                 EmployeeID: employeeID,
//                 Note: values.note,
//             };


//             const response = await CreatePH(payload);

//             if ((response as any)?.status === 201) {
//                 messageApi.open({
//                     type: 'success',
//                     content: 'การบันทึกข้อมูลสำเร็จ',
//                 });
//                 form.resetFields();
//                 setSelectedTreatmentID(null);
//             } else {
//                 message.error('ไม่สามารถบันทึกข้อมูลได้');
//             }
//         } catch (error: any) {
//             console.error('Error creating pH:', error.response || error);
//             message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
//         }
//     };

//     const handleCancel = () => {
//         form.resetFields();
//         setSelectedTreatmentID(null);
//     };

//     return (
//         <div className="ph-container">
//             {contextHolder}
//             <Form form={form}
//                 layout="vertical"
//                 onFinish={handleFinish}
//                 initialValues={{
//                     date: dayjs(),
//                     time: dayjs(),
//                 }}>
//                 <div className="form-group-ph">
//                     <Form.Item label="วันที่บันทึกข้อมูล" name="date">
//                         <DatePicker
//                             defaultValue={dayjs()}
//                             format="DD/MM/YYYY"
//                             className="full-width-ph"
//                             placeholder="เลือกวัน"
//                         />
//                     </Form.Item>

//                     <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
//                         <TimePicker
//                             defaultValue={dayjs()}
//                             format="HH:mm"
//                             className="full-width-ph"
//                             placeholder="เลือกเวลา"
//                         />
//                     </Form.Item>
//                 </div>

//                 <div className="form-group-ph">
//                     <Form.Item
//                         label="หน่วยที่วัด"
//                         name="unitID"
//                         rules={[{ required: true, message: 'กรุณาเลือกหน่วยที่วัด' }]}
//                     >
//                         <Select placeholder="เลือกหน่วย">
//                             {unitOptions.map((u) => (
//                                 <Option key={u.ID} value={u.ID}>
//                                     {u.UnitName}
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>

//                     <Form.Item
//                         label="มาตรฐาน¹"
//                         name="standardID"
//                         rules={[{ required: true, message: 'กรุณาเลือกค่ามาตรฐาน' }]}
//                     >
//                         <Select placeholder="เลือกมาตรฐาน">
//                             {standardOptions
//                                 .sort((a, b) => a.StandardValue! - b.StandardValue!)
//                                 .map((s) => (
//                                     <Option key={s.ID} value={s.ID}>
//                                         {s.StandardValue}
//                                     </Option>
//                                 ))}
//                         </Select>
//                     </Form.Item>
//                 </div>

//                 <div className="form-group-ph">
//                     <Form.Item
//                         label="ก่อน / หลัง / ก่อนเเละหลังบำบัด"
//                         name="beforeAfterTreatmentID"
//                         rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
//                     >
//                         <Select
//                             placeholder="เลือกสถานะ"
//                             onChange={(value) => {
//                                 setSelectedTreatmentID(value);
//                             }}
//                         >
//                             {beforeAfterOptions.map((b) => (
//                                 <Option key={b.ID} value={b.ID}>
//                                     {renderCustomTreatmentLabel(b.TreatmentName || '')}
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>

//                     {selectedTreatmentID === 3 ? (
//                         <div style={{ display: 'flex', gap: '30px' }}>
//                             <Form.Item
//                                 label="ค่าที่วัดได้ก่อนบำบัด"
//                                 name="valueBefore"
//                                 rules={[{ required: true, message: 'กรอกค่าก่อนบำบัด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าก่อนบำบัด"/>
//                             </Form.Item>

//                             <Form.Item
//                                 label="ค่าที่วัดได้หลังบำบัด"
//                                 name="valueAfter"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าหลังบำบัด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าก่อนบำบัด"/>
//                             </Form.Item>
//                         </div>
//                     ) : (
//                         <Form.Item
//                             label="ค่าที่วัดได้"
//                             name="data"
//                             rules={[{ required: true, message: 'กรอกค่าที่วัดได้' }]}
//                         >
//                             <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าที่วัดได้"/>
//                         </Form.Item>
//                     )}
//                 </div>

//                 <div className="form-group-ph">
//                     <Form.Item label="หมายเหตุ" name="note">
//                         <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
//                     </Form.Item>
//                 </div>

//                 <Form.Item className="form-actions-ph">
//                     <Button className="cancel-ph" htmlType="button" onClick={handleCancel}>
//                         ยกเลิก
//                     </Button>
//                     <Button htmlType="reset" className="reset-ph">
//                         รีเซ็ต
//                     </Button>
//                     <Button type="primary" htmlType="submit" className="submit-ph">
//                         บันทึก
//                     </Button>
//                 </Form.Item>
//             </Form>
//         </div>
//     );
// };

// export default PHCentralForm;




// import React, { useEffect, useState } from 'react';
// import {
//     Form,
//     InputNumber,
//     Button,
//     DatePicker,
//     TimePicker,
//     Select,
//     Input,
//     message,
// } from 'antd';
// import dayjs from 'dayjs';
// import './PHcenter.css';

// import { ListBeforeAfterTreatment, ListStandard, ListUnit, CreatePH } from '../../../services/index';
// import { ListBeforeAfterTreatmentInterface } from '../../../interface/IBeforeAfterTreatment';
// import { ListStandardInterface } from '../../../interface/IStandard';
// import { ListUnitInterface } from '../../../interface/IUnit';
// import { CreatePHInterface } from '../../../interface/IpH';

// const { Option } = Select;

// const PHCentralForm: React.FC = () => {
//     const [form] = Form.useForm();

//     const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
//     const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
//     const [standardOptions, setStandardOptions] = useState<ListStandardInterface[]>([]);
//     const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);
//     const [messageApi, contextHolder] = message.useMessage();

//     const renderCustomTreatmentLabel = (text: string) => (
//         <>
//             ค่า pH บริเวณบ่อพักน้ำทิ้ง
//             <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span>
//             เข้าระบบบำบัด
//         </>
//     );

//     useEffect(() => {
//         const fetchInitialData = async () => {
//             const [beforeAfter, units, standards] = await Promise.all([
//                 ListBeforeAfterTreatment(),
//                 ListUnit(),
//                 ListStandard(),
//             ]);

//             if (beforeAfter) setBeforeAfterOptions(beforeAfter);
//             if (units) setUnitOptions(units);
//             if (standards) setStandardOptions(standards);
//         };

//         fetchInitialData();
//     }, []);

//     const handleFinish = async (values: any) => {
//         console.log("🎯 Form Submitted:", values);
//         try {
//             const dateValue = form.getFieldValue('date') ?? dayjs();
//             const timeValue = form.getFieldValue('time') ?? dayjs();
//             const employeeID = Number(localStorage.getItem("employeeid"));
//             const combinedDate = dateValue.set('hour', timeValue.hour()).set('minute', timeValue.minute());

//             if (selectedTreatmentID === 3) {
//                 // ส่ง 2 record: ก่อน(1) และ หลัง(2)
//                 const payloadBefore: CreatePHInterface = {
//                     Date: combinedDate.toISOString(),
//                     Data: values.valueBefore,
//                     BeforeAfterTreatmentID: 1,
//                     StandardID: values.standardID,
//                     UnitID: values.unitID,
//                     EmployeeID: employeeID,
//                     Note: values.note,
//                 };

//                 const payloadAfter: CreatePHInterface = {
//                     Date: combinedDate.toISOString(),
//                     Data: values.valueAfter,
//                     BeforeAfterTreatmentID: 2,
//                     StandardID: values.standardID,
//                     UnitID: values.unitID,
//                     EmployeeID: employeeID,
//                     Note: values.note,
//                 };

//                 const res1 = await CreatePH(payloadBefore);
//                 const res2 = await CreatePH(payloadAfter);

//                 if ((res1 as any)?.status === 201 && (res2 as any)?.status === 201) {
//                     messageApi.success('บันทึกข้อมูล pH ก่อนเเละหลังบำบัดสำเร็จ');
//                     form.resetFields();
//                     setSelectedTreatmentID(null);
//                 } else {
//                     message.error('ไม่สามารถบันทึกข้อมูลก่อนหรือหลังได้');
//                 }
//             } else {
//                 // ✅ กรณีเลือกอย่างเดียว (ก่อนหรือหลัง)
//                 const payload: CreatePHInterface = {
//                     Date: combinedDate.toISOString(),
//                     Data: values.data,
//                     BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
//                     StandardID: values.standardID,
//                     UnitID: values.unitID,
//                     EmployeeID: employeeID,
//                     Note: values.note,
//                 };

//                 const response = await CreatePH(payload);

//                 if ((response as any)?.status === 201) {
//                     messageApi.success('บันทึกข้อมูล pH สำเร็จ');
//                     form.resetFields();
//                     setSelectedTreatmentID(null);
//                 } else {
//                     message.error('ไม่สามารถบันทึกข้อมูลได้');
//                 }
//             }
//         } catch (error: any) {
//             console.error('Error creating pH:', error.response || error);
//             message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
//         }
//     };

//     const handleCancel = () => {
//         form.resetFields();
//         setSelectedTreatmentID(null);
//     };

//     return (
//         <div className="ph-container">
//             {contextHolder}
//             <Form
//                 form={form}
//                 layout="vertical"
//                 onFinish={handleFinish}
//                 initialValues={{
//                     date: dayjs(),
//                     time: dayjs(),
//                 }}
//             >
//                 <div className="form-group-ph">
//                     <Form.Item label="วันที่บันทึกข้อมูล" name="date">
//                         <DatePicker
//                             defaultValue={dayjs()}
//                             format="DD/MM/YYYY"
//                             className="full-width-ph"
//                             placeholder="เลือกวัน"
//                         />
//                     </Form.Item>

//                     <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
//                         <TimePicker
//                             defaultValue={dayjs()}
//                             format="HH:mm"
//                             className="full-width-ph"
//                             placeholder="เลือกเวลา"
//                         />
//                     </Form.Item>
//                 </div>

//                 <div className="form-group-ph">
//                     <Form.Item
//                         label="หน่วยที่วัด"
//                         name="unitID"
//                         rules={[{ required: true, message: 'กรุณาเลือกหน่วยที่วัด' }]}
//                     >
//                         <Select placeholder="เลือกหน่วย">
//                             {unitOptions.map((u) => (
//                                 <Option key={u.ID} value={u.ID}>
//                                     {u.UnitName}
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>

//                     <Form.Item
//                         label="มาตรฐาน¹"
//                         name="standardID"
//                         rules={[{ required: true, message: 'กรุณาเลือกค่ามาตรฐาน' }]}
//                     >
//                         <Select placeholder="เลือกมาตรฐาน">
//                             {standardOptions
//                                 .sort((a, b) => a.StandardValue! - b.StandardValue!)
//                                 .map((s) => (
//                                     <Option key={s.ID} value={s.ID}>
//                                         {s.StandardValue}
//                                     </Option>
//                                 ))}
//                         </Select>
//                     </Form.Item>
//                 </div>

//                 <div className="form-group-ph">
//                     <div className='form-group-mini-ph'>
//                     <Form.Item
//                         label="ก่อน / หลัง / ก่อนเเละหลังบำบัด"
//                         name="beforeAfterTreatmentID"
//                         rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
//                     >
//                         <Select
//                             placeholder="เลือกสถานะ"
//                             onChange={(value) => {
//                                 setSelectedTreatmentID(value);
//                             }}
//                         >
//                             {beforeAfterOptions.map((b) => (
//                                 <Option key={b.ID} value={b.ID}>
//                                     {renderCustomTreatmentLabel(b.TreatmentName || '')}
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>
//                     </div>
//                     <div className='form-group-mini-ph'>
//                     {selectedTreatmentID === 3 ? (
//                         <div style={{ display: 'flex', gap: '30px' }}>
//                             <Form.Item
//                                 label="ค่าที่วัดได้ก่อนบำบัด"
//                                 name="valueBefore"
//                                 rules={[{ required: true, message: 'กรอกค่าก่อนบำบัด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าก่อนบำบัด" />
//                             </Form.Item>

//                             <Form.Item
//                                 label="ค่าที่วัดได้หลังบำบัด"
//                                 name="valueAfter"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าหลังบำบัด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าหลังบำบัด" />
//                             </Form.Item>
//                         </div>
//                     ) : (
//                         <Form.Item
//                             label="ค่าที่วัดได้"
//                             name="data"
//                             rules={[{ required: true, message: 'กรอกค่าที่วัดได้' }]}
//                         >
//                             <InputNumber style={{ width: '100%' }} placeholder="กรอกค่าที่วัดได้" />
//                         </Form.Item>
//                     )}
//                     </div>
//                 </div>

//                 <div className="form-group-ph">
//                     <Form.Item label="หมายเหตุ" name="note">
//                         <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
//                     </Form.Item>
//                 </div>

//                 <Form.Item className="form-actions-ph">
//                     <Button className="cancel-ph" htmlType="button" onClick={handleCancel}>
//                         ยกเลิก
//                     </Button>
//                     <Button htmlType="reset" className="reset-ph">
//                         รีเซ็ต
//                     </Button>
//                     <Button type="primary" htmlType="submit" className="submit-ph">
//                         บันทึก
//                     </Button>
//                 </Form.Item>
//             </Form>
//         </div>
//     );
// };

// export default PHCentralForm;


// import React, { useEffect, useState } from 'react';
// import {
//     Form,
//     InputNumber,
//     Button,
//     DatePicker,
//     TimePicker,
//     Select,
//     Input,
//     message,
// } from 'antd';
// import dayjs from 'dayjs';
// import './PHcenter.css';

// import {
//     ListBeforeAfterTreatment,
//     ListStandard,
//     ListUnit,
//     CreatePH,
// } from '../../../services/index';
// import { ListBeforeAfterTreatmentInterface } from '../../../interface/IBeforeAfterTreatment';
// import { ListStandardInterface } from '../../../interface/IStandard';
// import { ListUnitInterface } from '../../../interface/IUnit';
// import { CreatePHInterface } from '../../../interface/IpH';

// const { Option } = Select;

// const PHCentralForm: React.FC = () => {
//     const [form] = Form.useForm();

//     const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
//     const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
//     const [standardOptions, setStandardOptions] = useState<ListStandardInterface[]>([]);
//     const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);
//     const [standardType, setStandardType] = useState<string>('middle');
//     const [messageApi, contextHolder] = message.useMessage();

//     const renderCustomTreatmentLabel = (text: string) => (
//         <>
//             ค่า pH บริเวณบ่อพักน้ำทิ้ง
//             <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span>
//             เข้าระบบบำบัด
//         </>
//     );

//     useEffect(() => {
//         const fetchInitialData = async () => {
//             const [beforeAfter, units, standards] = await Promise.all([
//                 ListBeforeAfterTreatment(),
//                 ListUnit(),
//                 ListStandard(),
//             ]);

//             if (beforeAfter) setBeforeAfterOptions(beforeAfter);
//             if (units) setUnitOptions(units);
//             if (standards) setStandardOptions(standards);
//         };

//         fetchInitialData();
//     }, []);

//     const handleFinish = async (values: any) => {
//         console.log('🎯 Form Submitted:', values);
//         try {
//             const dateValue = form.getFieldValue('date') ?? dayjs();
//             const timeValue = form.getFieldValue('time') ?? dayjs();
//             const employeeID = Number(localStorage.getItem('employeeid'));
//             const combinedDate = dateValue.set('hour', timeValue.hour()).set('minute', timeValue.minute());

//             const standardID = values.standardID;
//             const customMin = values.customMin;
//             const customMax = values.customMax;

//             if (selectedTreatmentID === 3) {
//                 const payloadBefore: CreatePHInterface = {
//                     Date: combinedDate.toISOString(),
//                     Data: values.valueBefore,
//                     BeforeAfterTreatmentID: 1,
//                     StandardID: standardID,
//                     UnitID: values.unitID,
//                     EmployeeID: employeeID,
//                     Note: values.note,
//                 };

//                 const payloadAfter: CreatePHInterface = {
//                     Date: combinedDate.toISOString(),
//                     Data: values.valueAfter,
//                     BeforeAfterTreatmentID: 2,
//                     StandardID: standardID,
//                     UnitID: values.unitID,
//                     EmployeeID: employeeID,
//                     Note: values.note,
//                 };

//                 const res1 = await CreatePH(payloadBefore);
//                 const res2 = await CreatePH(payloadAfter);

//                 if ((res1 as any)?.status === 201 && (res2 as any)?.status === 201) {
//                     messageApi.success('บันทึกข้อมูล pH ก่อนและหลังบำบัดสำเร็จ');
//                     form.resetFields();
//                     setSelectedTreatmentID(null);
//                 } else {
//                     message.error('ไม่สามารถบันทึกข้อมูลก่อนหรือหลังได้');
//                 }
//             } else {
//                 const payload: CreatePHInterface = {
//                     Date: combinedDate.toISOString(),
//                     Data: values.data,
//                     BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
//                     StandardID: standardID,
//                     UnitID: values.unitID,
//                     EmployeeID: employeeID,
//                     Note: values.note,
//                 };

//                 const response = await CreatePH(payload);

//                 if ((response as any)?.status === 201) {
//                     messageApi.success('บันทึกข้อมูล pH สำเร็จ');
//                     form.resetFields();
//                     setSelectedTreatmentID(null);
//                 } else {
//                     message.error('ไม่สามารถบันทึกข้อมูลได้');
//                 }
//             }
//         } catch (error: any) {
//             console.error('Error creating pH:', error.response || error);
//             message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
//         }
//     };

//     const handleCancel = () => {
//         form.resetFields();
//         setSelectedTreatmentID(null);
//     };

//     return (
//         <div className="ph-container">
//             {contextHolder}
//             <Form
//                 form={form}
//                 layout="vertical"
//                 onFinish={handleFinish}
//                 initialValues={{
//                     date: dayjs(),
//                     time: dayjs(),
//                     standardType: 'middle',
//                 }}
//             >
//                 <div className="form-group-ph">
//                     <Form.Item label="วันที่บันทึกข้อมูล" name="date">
//                         <DatePicker format="DD/MM/YYYY" className="full-width-ph" placeholder="เลือกวัน" />
//                     </Form.Item>

//                     <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
//                         <TimePicker format="HH:mm" className="full-width-ph" placeholder="เลือกเวลา" />
//                     </Form.Item>
//                 </div>

//                 <div className="form-group-ph">
//                     <Form.Item
//                         label="หน่วยที่วัด"
//                         name="unitID"
//                         rules={[{ required: true, message: 'กรุณาเลือกหน่วยที่วัด' }]}
//                     >
//                         <Select placeholder="เลือกหน่วย">
//                             {unitOptions.map((u) => (
//                                 <Option key={u.ID} value={u.ID}>
//                                     {u.UnitName}
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>

//                     {/* <Form.Item label="ประเภทมาตรฐาน" name="standardType">
//                         <Select defaultValue="middle" onChange={(value) => setStandardType(value)}>
//                             <Option value="middle">ค่าเดียว (ค่ากลาง)</Option>
//                             <Option value="range">ช่วง (Min - Max)</Option>
//                             <Option value="custom">กำหนดเอง</Option>
//                         </Select>
//                     </Form.Item>

//                     {standardType === 'middle' && (
//                         <Form.Item
//                             label="ค่ากลาง (Middle)"
//                             name="standardID"
//                             rules={[{ required: true, message: 'กรุณาเลือกค่ากลาง' }]}
//                         >
//                             <Select placeholder="เลือกค่ากลาง">
//                                 {standardOptions.map((s) => (
//                                     <Option key={s.ID} value={s.ID}>
//                                         {s.MiddleValue}
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </Form.Item>
//                     )}

//                     {standardType === 'range' && (
//                         <Form.Item
//                             label="ช่วง (Min - Max)"
//                             name="standardID"
//                             rules={[{ required: true, message: 'กรุณาเลือกช่วงมาตรฐาน' }]}
//                         >
//                             <Select placeholder="เลือกช่วง">
//                                 {standardOptions.map((s) => (
//                                     <Option key={s.ID} value={s.ID}>
//                                         {s.MinValue} - {s.MaxValue}
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </Form.Item>
//                     )}

//                     {standardType === 'custom' && (
//                         <div style={{ display: 'flex', gap: '16px' }}>
//                             <Form.Item
//                                 label="ค่าต่ำสุด (Min)"
//                                 name="customMin"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าต่ำสุด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber placeholder="ค่าต่ำสุด" style={{ width: '100%' }} />
//                             </Form.Item>
//                             <Form.Item
//                                 label="ค่าสูงสุด (Max)"
//                                 name="customMax"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าสูงสุด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber placeholder="ค่าสูงสุด" style={{ width: '100%' }} />
//                             </Form.Item>
//                         </div>
//                     )}
//                 </div> */}



//                     {/* <Form.Item label="ประเภทมาตรฐาน" name="standardType">
//                         <Select defaultValue="middle" onChange={(value) => setStandardType(value)}>
//                             <Option value="middle">ค่าเดี่ยว</Option>
//                             <Option value="range">ช่วง (Min - Max)</Option>
//                             <Option value="custom-single">กำหนดเอง (ค่าเดี่ยว)</Option>
//                             <Option value="custom-range">กำหนดเอง (ช่วง (Min - Max))</Option>
//                         </Select>
//                     </Form.Item>

//                     {standardType === 'middle' && (
//                         <Form.Item
//                             label="ค่าเดี่ยว"
//                             name="standardID"
//                             rules={[{ required: true, message: 'กรุณาเลือกค่าเดี่ยว' }]}
//                         >
//                             <Select placeholder="เลือกค่าเดี่ยว">
//                                 {standardOptions.map((s) => (
//                                     <Option key={s.ID} value={s.ID}>
//                                         {s.MiddleValue}
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </Form.Item>
//                     )}

//                     {standardType === 'range' && (
//                         <Form.Item
//                             label="ช่วง (Min - Max)"
//                             name="standardID"
//                             rules={[{ required: true, message: 'กรุณาเลือกช่วงมาตรฐาน' }]}
//                         >
//                             <Select placeholder="เลือกช่วง">
//                                 {standardOptions.map((s) => (
//                                     <Option key={s.ID} value={s.ID}>
//                                         {s.MinValue} - {s.MaxValue}
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </Form.Item>
//                     )}

//                     {standardType === 'custom-single' && (
//                         <Form.Item
//                             label="กำหนดเอง (ค่าเดี่ยว)"
//                             name="customSingle"
//                             rules={[{ required: true, message: 'กรุณากรอกค่ากลาง' }]}
//                         >
//                             <InputNumber placeholder="กรอกค่ากลาง" style={{ width: '100%' }} />
//                         </Form.Item>
//                     )}

//                     {standardType === 'custom-range' && (
//                         <div style={{ display: 'flex', gap: '16px' }}>
//                             <Form.Item
//                                 label="ค่าต่ำสุด (Min)"
//                                 name="customMin"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าต่ำสุด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber placeholder="ค่าต่ำสุด" style={{ width: '100%' }} />
//                             </Form.Item>
//                             <Form.Item
//                                 label="ค่าสูงสุด (Max)"
//                                 name="customMax"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าสูงสุด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber placeholder="ค่าสูงสุด" style={{ width: '100%' }} />
//                             </Form.Item>
//                         </div>
//                     )}
//                 </div> */}


//                     <Form.Item label="ประเภทมาตรฐาน" name="standardType">
//                         <Select defaultValue="middle" onChange={(value) => setStandardType(value)}>
//                             <Option value="middle">ค่าเดี่ยว</Option>
//                             <Option value="range">ช่วง (Min - Max)</Option>
//                         </Select>
//                     </Form.Item>

//                     {/* ค่าเดี่ยว */}
//                     {standardType === 'middle' && (
//                         <>
//                             <Form.Item
//                                 label="ค่าเดี่ยว"
//                                 name="standardID"
//                                 rules={[{ required: true, message: 'กรุณาเลือกค่าเดี่ยว' }]}
//                             >
//                                 <Select
//                                     placeholder="เลือกค่าเดี่ยว"
//                                     onChange={(value) => {
//                                         if (value === 'custom') {
//                                             form.setFieldsValue({ standardID: undefined }); // เคลียร์ค่าเดิม
//                                             setStandardType('custom-single');
//                                         }
//                                     }}
//                                 >
//                                     {standardOptions.map((s) => (
//                                         <Option key={s.ID} value={s.ID}>
//                                             {s.MiddleValue}
//                                         </Option>
//                                     ))}
//                                     <Option value="custom">กำหนดเอง (ค่าเดี่ยว)</Option>
//                                 </Select>
//                             </Form.Item>
//                         </>
//                     )}

//                     {standardType === 'custom-single' && (
//                         <Form.Item
//                             label="กำหนดเอง (ค่าเดี่ยว)"
//                             name="customSingle"
//                             rules={[{ required: true, message: 'กรุณากรอกค่ากลาง' }]}
//                         >
//                             <InputNumber placeholder="กรอกค่ากลาง" style={{ width: '100%' }} />
//                         </Form.Item>
//                     )}

//                     {/* ช่วง */}
//                     {standardType === 'range' && (
//                         <>
//                             <Form.Item
//                                 label="ช่วง (Min - Max)"
//                                 name="standardID"
//                                 rules={[{ required: true, message: 'กรุณาเลือกช่วงมาตรฐาน' }]}
//                             >
//                                 <Select
//                                     placeholder="เลือกช่วง"
//                                     onChange={(value) => {
//                                         if (value === 'custom') setStandardType('custom-range');
//                                     }}
//                                 >
//                                     {standardOptions.map((s) => (
//                                         <Option key={s.ID} value={s.ID}>
//                                             {s.MinValue} - {s.MaxValue}
//                                         </Option>
//                                     ))}
//                                     <Option value="custom">กำหนดเอง (ช่วง)</Option>
//                                 </Select>
//                             </Form.Item>
//                         </>
//                     )}

//                     {/* กำหนดเอง (ค่าเดี่ยว) */}
//                     {standardType === 'custom-single' && (
//                         <Form.Item
//                             label="กำหนดเอง (ค่าเดี่ยว)"
//                             name="customSingle"
//                             rules={[{ required: true, message: 'กรุณากรอกค่ากลาง' }]}
//                         >
//                             <InputNumber placeholder="กรอกค่ากลาง" style={{ width: '100%' }} />
//                         </Form.Item>
//                     )}

//                     {/* กำหนดเอง (ช่วง) */}
//                     {standardType === 'custom-range' && (
//                         <div style={{ display: 'flex', gap: '16px' }}>
//                             <Form.Item
//                                 label="ค่าต่ำสุด (Min)"
//                                 name="customMin"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าต่ำสุด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber placeholder="ค่าต่ำสุด" style={{ width: '100%' }} />
//                             </Form.Item>
//                             <Form.Item
//                                 label="ค่าสูงสุด (Max)"
//                                 name="customMax"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าสูงสุด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber placeholder="ค่าสูงสุด" style={{ width: '100%' }} />
//                             </Form.Item>
//                         </div>
//                     )}
//                 </div>


//                 <div className="form-group-ph">
//                     <Form.Item
//                         label="ก่อน / หลัง / ก่อนและหลังบำบัด"
//                         name="beforeAfterTreatmentID"
//                         rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
//                     >
//                         <Select placeholder="เลือกสถานะ" onChange={(value) => setSelectedTreatmentID(value)}>
//                             {beforeAfterOptions.map((b) => (
//                                 <Option key={b.ID} value={b.ID}>
//                                     {renderCustomTreatmentLabel(b.TreatmentName || '')}
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>

//                     {selectedTreatmentID === 3 ? (
//                         <div style={{ display: 'flex', gap: '30px' }}>
//                             <Form.Item
//                                 label="ค่าที่วัดได้ก่อนบำบัด"
//                                 name="valueBefore"
//                                 rules={[{ required: true, message: 'กรอกค่าก่อนบำบัด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber style={{ width: '100%' }} placeholder="ค่าก่อนบำบัด" />
//                             </Form.Item>

//                             <Form.Item
//                                 label="ค่าที่วัดได้หลังบำบัด"
//                                 name="valueAfter"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าหลังบำบัด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber style={{ width: '100%' }} placeholder="ค่าหลังบำบัด" />
//                             </Form.Item>
//                         </div>
//                     ) : (
//                         <Form.Item
//                             label="ค่าที่วัดได้"
//                             name="data"
//                             rules={[{ required: true, message: 'กรอกค่าที่วัดได้' }]}
//                         >
//                             <InputNumber style={{ width: '100%' }} placeholder="ค่าที่วัดได้" />
//                         </Form.Item>
//                     )}
//                 </div>

//                 <div className="form-group-ph">
//                     <Form.Item label="หมายเหตุ" name="note">
//                         <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
//                     </Form.Item>
//                 </div>

//                 <Form.Item className="form-actions-ph">
//                     <Button className="cancel-ph" htmlType="button" onClick={handleCancel}>
//                         ยกเลิก
//                     </Button>
//                     <Button htmlType="reset" className="reset-ph">
//                         รีเซ็ต
//                     </Button>
//                     <Button type="primary" htmlType="submit" className="submit-ph">
//                         บันทึก
//                     </Button>
//                 </Form.Item>
//             </Form>
//         </div>
//     );
// };

// export default PHCentralForm;




/*true */
// import React, { useEffect, useState } from 'react';
// import {
//     Form,
//     InputNumber,
//     Button,
//     DatePicker,
//     TimePicker,
//     Select,
//     Input,
//     message,
// } from 'antd';
// import dayjs from 'dayjs';
// import './PHcenter.css';

// import {
//     ListBeforeAfterTreatment,
//     ListStandard,
//     ListUnit,
//     CreatePH,
// } from '../../../services/index';
// import { ListBeforeAfterTreatmentInterface } from '../../../interface/IBeforeAfterTreatment';
// import { ListStandardInterface } from '../../../interface/IStandard';
// import { ListUnitInterface } from '../../../interface/IUnit';
// import { CreatePHInterface } from '../../../interface/IpH';

// const { Option } = Select;

// const PHCentralForm: React.FC = () => {
//     const [form] = Form.useForm();

//     const [beforeAfterOptions, setBeforeAfterOptions] = useState<ListBeforeAfterTreatmentInterface[]>([]);
//     const [unitOptions, setUnitOptions] = useState<ListUnitInterface[]>([]);
//     const [standardOptions, setStandardOptions] = useState<ListStandardInterface[]>([]);
//     const [selectedTreatmentID, setSelectedTreatmentID] = useState<number | null>(null);

//     const [standardType, setStandardType] = useState<string>('middle'); // middle or range
//     const [useCustomStandard, setUseCustomStandard] = useState<boolean>(false);

//     const [messageApi, contextHolder] = message.useMessage();

//     const renderCustomTreatmentLabel = (text: string) => (
//         <>
//             ค่า pH บริเวณบ่อพักน้ำทิ้ง
//             <span style={{ color: '#f45415ff', fontWeight: 'bold' }}>{text}</span>
//             เข้าระบบบำบัด
//         </>
//     );

//     useEffect(() => {
//         const fetchInitialData = async () => {
//             const [beforeAfter, units, standards] = await Promise.all([
//                 ListBeforeAfterTreatment(),
//                 ListUnit(),
//                 ListStandard(),
//             ]);
//             if (beforeAfter) setBeforeAfterOptions(beforeAfter);
//             if (units) setUnitOptions(units);
//             if (standards) setStandardOptions(standards);
//         };
//         fetchInitialData();
//     }, []);

//     const handleStandardGroupChange = (value: string) => {
//         setStandardType(value);
//         setUseCustomStandard(false);
//         form.setFieldsValue({
//             standardID: undefined,
//             customSingle: undefined,
//             customMin: undefined,
//             customMax: undefined,
//         });
//     };

//     const handleStandardSelectChange = (value: string) => {
//         if (value === 'custom') {
//             setUseCustomStandard(true);
//             form.setFieldsValue({ standardID: undefined });
//         } else {
//             setUseCustomStandard(false);
//         }
//     };

//     const handleFinish = async (values: any) => {
//         try {
//             const dateValue = values.date ?? dayjs();
//             const timeValue = values.time ?? dayjs();
//             const combinedDate = dateValue.set('hour', timeValue.hour()).set('minute', timeValue.minute());
//             const employeeID = Number(localStorage.getItem('employeeid'));

//             const standardID = values.standardID ?? null;
//             const customSingle = values.customSingle;
//             const customMin = values.customMin;
//             const customMax = values.customMax;

//             if (selectedTreatmentID === 3) {
//                 const payloadBefore: CreatePHInterface = {
//                     Date: combinedDate.toISOString(),
//                     Data: values.valueBefore,
//                     BeforeAfterTreatmentID: 1,
//                     StandardID: standardID,
//                     UnitID: values.unitID,
//                     EmployeeID: employeeID,
//                     Note: values.note,
//                 };

//                 const payloadAfter: CreatePHInterface = {
//                     Date: combinedDate.toISOString(),
//                     Data: values.valueAfter,
//                     BeforeAfterTreatmentID: 2,
//                     StandardID: standardID,
//                     UnitID: values.unitID,
//                     EmployeeID: employeeID,
//                     Note: values.note,
//                 };

//                 const res1 = await CreatePH(payloadBefore);
//                 const res2 = await CreatePH(payloadAfter);

//                 if ((res1 as any)?.status === 201 && (res2 as any)?.status === 201) {
//                     messageApi.success('บันทึกข้อมูล pH ก่อนและหลังบำบัดสำเร็จ');
//                     form.resetFields();
//                     setSelectedTreatmentID(null);
//                     setUseCustomStandard(false);
//                 } else {
//                     message.error('ไม่สามารถบันทึกข้อมูลก่อนหรือหลังได้');
//                 }
//             } else {
//                 const payload: CreatePHInterface = {
//                     Date: combinedDate.toISOString(),
//                     Data: values.data,
//                     BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
//                     StandardID: standardID,
//                     UnitID: values.unitID,
//                     EmployeeID: employeeID,
//                     Note: values.note,
//                 };

//                 const response = await CreatePH(payload);

//                 if ((response as any)?.status === 201) {
//                     messageApi.success('บันทึกข้อมูล pH สำเร็จ');
//                     form.resetFields();
//                     setSelectedTreatmentID(null);
//                     setUseCustomStandard(false);
//                 } else {
//                     message.error('ไม่สามารถบันทึกข้อมูลได้');
//                 }
//             }
//         } catch (error: any) {
//             console.error('Error creating pH:', error);
//             message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
//         }
//     };

//     const handleCancel = () => {
//         form.resetFields();
//         setSelectedTreatmentID(null);
//         setUseCustomStandard(false);
//     };

//     return (
//         <div className="ph-container">
//             {contextHolder}
//             <Form
//                 form={form}
//                 layout="vertical"
//                 onFinish={handleFinish}
//                 initialValues={{
//                     date: dayjs(),
//                     time: dayjs(),
//                     standardType: 'middle',
//                 }}
//             >
//                 <div className="form-group-ph">
//                     <Form.Item label="วันที่บันทึกข้อมูล" name="date">
//                         <DatePicker format="DD/MM/YYYY" className="full-width-ph" placeholder="เลือกวัน" />
//                     </Form.Item>
//                     <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
//                         <TimePicker format="HH:mm" className="full-width-ph" placeholder="เลือกเวลา" />
//                     </Form.Item>
//                 </div>

//                 <div className="form-group-ph" >
//                     <div className='form-group-mini-ph'>
//                         <Form.Item
//                             label="หน่วยที่วัด"
//                             name="unitID"
//                             rules={[{ required: true, message: 'กรุณาเลือกหน่วยที่วัด' }]}
//                         >
//                             <Select placeholder="เลือกหน่วย">
//                                 {unitOptions.map((u) => (
//                                     <Option key={u.ID} value={u.ID}>
//                                         {u.UnitName}
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </Form.Item>
//                     </div>
//                     <div className='form-group-mini-ph' >
//                         <Form.Item label="ประเภทมาตรฐาน" name="standardType" >
//                             <Select defaultValue="middle" onChange={handleStandardGroupChange}>
//                                 <Option value="middle">ค่าเดี่ยว</Option>
//                                 <Option value="range">ช่วง (Min - Max)</Option>
//                             </Select>
//                         </Form.Item>
//                         <div style={{ position: 'relative', top: '-15px' }}>
//                         {/* ค่าเดี่ยว */}
//                         {standardType === 'middle' && !useCustomStandard && (
//                             <Form.Item
//                                 label="ค่าเดี่ยว"
//                                 name="standardID"
//                                 rules={[{ required: true, message: 'กรุณาเลือกค่าเดี่ยว' }]}
//                             >
//                                 <Select placeholder="เลือกค่าเดี่ยว" onChange={handleStandardSelectChange}>
//                                     {standardOptions.map((s) => (
//                                         <Option key={s.ID} value={s.ID}>
//                                             {s.MiddleValue}
//                                         </Option>
//                                     ))}
//                                     <Option value="custom">กำหนดเอง (ค่าเดี่ยว)</Option>
//                                 </Select>
//                             </Form.Item>
//                         )}

//                         {standardType === 'middle' && useCustomStandard && (
//                             <Form.Item
//                                 label="กำหนดเอง (ค่าเดี่ยว)"
//                                 name="customSingle"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่ากลาง' }]}
//                             >
//                                 <InputNumber placeholder="กรอกค่ากลาง" style={{ width: '100%' }} />
//                             </Form.Item>
//                         )}

//                         {/* ช่วง */}
//                         {standardType === 'range' && !useCustomStandard && (
//                             <Form.Item
//                                 label="ช่วง (Min - Max)"
//                                 name="standardID"
//                                 rules={[{ required: true, message: 'กรุณาเลือกช่วงมาตรฐาน' }]}
//                             >
//                                 <Select placeholder="เลือกช่วง" onChange={handleStandardSelectChange}>
//                                     {standardOptions.map((s) => (
//                                         <Option key={s.ID} value={s.ID}>
//                                             {s.MinValue} - {s.MaxValue}
//                                         </Option>
//                                     ))}
//                                     <Option value="custom">กำหนดเอง (ช่วง)</Option>
//                                 </Select>
//                             </Form.Item>
//                         )}

//                         {standardType === 'range' && useCustomStandard && (
//                             <div className='ph-fornt-small'>
//                                 <Form.Item
//                                     label="ค่าต่ำสุด (Min)"
//                                     name="customMin"
//                                     rules={[{ required: true, message: 'กรุณากรอกค่าต่ำสุด' }]}
//                                     style={{ flex: 1 }}
//                                 >
//                                     <InputNumber placeholder="ค่าต่ำสุด" style={{ width: '100%' }} />
//                                 </Form.Item>
//                                 <Form.Item
//                                     label="ค่าสูงสุด (Max)"
//                                     name="customMax"
//                                     rules={[{ required: true, message: 'กรุณากรอกค่าสูงสุด' }]}
//                                     style={{ flex: 1 }}
//                                 >
//                                     <InputNumber placeholder="ค่าสูงสุด" style={{ width: '100%' }} />
//                                 </Form.Item>
//                             </div>
//                         )}
//                         </div>
//                     </div>
//                 </div>

//                 <div className="form-group-ph">
//                     <div className='form-group-mini-ph' >
//                     <Form.Item
//                         label="ก่อน / หลัง / ก่อนและหลังบำบัด"
//                         name="beforeAfterTreatmentID"
//                         rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
//                     >
//                         <Select placeholder="เลือกสถานะ" onChange={(value) => setSelectedTreatmentID(value)}>
//                             {beforeAfterOptions.map((b) => (
//                                 <Option key={b.ID} value={b.ID}>
//                                     {renderCustomTreatmentLabel(b.TreatmentName || '')}
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>
//                     </div>
//                     <div className='form-group-mini-ph' >
//                     {selectedTreatmentID === 3 ? (
//                         <div style={{ display: 'flex', gap: '30px' }}>
//                             <Form.Item
//                                 label="ค่าที่วัดได้ก่อนบำบัด"
//                                 name="valueBefore"
//                                 rules={[{ required: true, message: 'กรอกค่าก่อนบำบัด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber style={{ width: '100%' }} placeholder="ค่าก่อนบำบัด" />
//                             </Form.Item>

//                             <Form.Item
//                                 label="ค่าที่วัดได้หลังบำบัด"
//                                 name="valueAfter"
//                                 rules={[{ required: true, message: 'กรุณากรอกค่าหลังบำบัด' }]}
//                                 style={{ flex: 1 }}
//                             >
//                                 <InputNumber style={{ width: '100%' }} placeholder="ค่าหลังบำบัด" />
//                             </Form.Item>
//                         </div>
//                     ) : (
//                         <Form.Item
//                             label="ค่าที่วัดได้"
//                             name="data"
//                             rules={[{ required: true, message: 'กรอกค่าที่วัดได้' }]}
//                         >
//                             <InputNumber style={{ width: '100%' }} placeholder="ค่าที่วัดได้" />
//                         </Form.Item>
//                     )}
//                     </div>
//                 </div>

//                 <div className="form-group-ph">
//                     <Form.Item label="หมายเหตุ" name="note">
//                         <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
//                     </Form.Item>
//                 </div>

//                 <Form.Item className="form-actions-ph">
//                     <Button className="cancel-ph" htmlType="button" onClick={handleCancel}>
//                         ยกเลิก
//                     </Button>
//                     <Button htmlType="reset" className="reset-ph">
//                         รีเซ็ต
//                     </Button>
//                     <Button type="primary" htmlType="submit" className="submit-ph">
//                         บันทึก
//                     </Button>
//                 </Form.Item>
//             </Form>
//         </div>
//     );
// };

// export default PHCentralForm;



import React, { useEffect, useState } from 'react';
import {
    Form,
    InputNumber,
    Button,
    DatePicker,
    TimePicker,
    Select,
    Input,
    message,
} from 'antd';
import dayjs from 'dayjs';
import './PHcenter.css';

import {
    ListBeforeAfterTreatment,
    ListMiddleStandard,
    ListRangeStandard,
    AddMiddleStandard,
    AddRangeStandard,
    ListUnit,
    CreatePH,
} from '../../../services/index';

import { ListBeforeAfterTreatmentInterface } from '../../../interface/IBeforeAfterTreatment';
import { ListMiddleStandardInterface, ListRangeStandardInterface } from '../../../interface/IStandard';
import { ListUnitInterface } from '../../../interface/IUnit';
import { CreatePHInterface } from '../../../interface/IpH';

const { Option } = Select;

const PHCentralForm: React.FC = () => {
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

    const [messageApi, contextHolder] = message.useMessage();

    const renderCustomTreatmentLabel = (text: string) => (
        <>
            ค่า pH บริเวณบ่อพักน้ำทิ้ง
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
        fetchInitialData();
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

    // const handleFinish = async (values: any) => {
    //     try {
    //         const dateValue = values.date ?? dayjs();
    //         const timeValue = values.time ?? dayjs();
    //         const combinedDate = dateValue.set('hour', timeValue.hour()).set('minute', timeValue.minute());
    //         const employeeID = Number(localStorage.getItem('employeeid'));

    //         const standardID = values.standardID ?? null;
    //         const customSingle = values.customSingle;
    //         const customMin = values.customMin;
    //         const customMax = values.customMax;

    //         if (selectedTreatmentID === 3) {
    //             const payloadBefore: CreatePHInterface = {
    //                 Date: combinedDate.toISOString(),
    //                 Data: values.valueBefore,
    //                 BeforeAfterTreatmentID: 1,
    //                 StandardID: standardID,
    //                 UnitID: values.unitID,
    //                 EmployeeID: employeeID,
    //                 Note: values.note,
    //             };

    //             const payloadAfter: CreatePHInterface = {
    //                 Date: combinedDate.toISOString(),
    //                 Data: values.valueAfter,
    //                 BeforeAfterTreatmentID: 2,
    //                 StandardID: standardID,
    //                 UnitID: values.unitID,
    //                 EmployeeID: employeeID,
    //                 Note: values.note,
    //             };

    //             const res1 = await CreatePH(payloadBefore);
    //             const res2 = await CreatePH(payloadAfter);

    //             if ((res1 as any)?.status === 201 && (res2 as any)?.status === 201) {
    //                 messageApi.success('บันทึกข้อมูล pH ก่อนและหลังบำบัดสำเร็จ');
    //                 form.resetFields();
    //                 setSelectedTreatmentID(null);
    //                 setUseCustomStandard(false);
    //             } else {
    //                 message.error('ไม่สามารถบันทึกข้อมูลก่อนหรือหลังได้');
    //             }
    //         } else {
    //             const payload: CreatePHInterface = {
    //                 Date: combinedDate.toISOString(),
    //                 Data: values.data,
    //                 BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
    //                 StandardID: standardID,
    //                 UnitID: values.unitID,
    //                 EmployeeID: employeeID,
    //                 Note: values.note,
    //             };

    //             const response = await CreatePH(payload);

    //             if ((response as any)?.status === 201) {
    //                 messageApi.success('บันทึกข้อมูล pH สำเร็จ');
    //                 form.resetFields();
    //                 setSelectedTreatmentID(null);
    //                 setUseCustomStandard(false);
    //             } else {
    //                 message.error('ไม่สามารถบันทึกข้อมูลได้');
    //             }
    //         }
    //     } catch (error: any) {
    //         console.error('Error creating pH:', error);
    //         message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    //     }
    // };

    /* */
    // const handleFinish = async (values: any) => {
    //     try {
    //         let standardID = values.standardID ?? null;

    //         // ตรวจสอบกรณีใช้ custom standard
    //         if (useCustomStandard) {
    //             if (standardType === 'middle' && customSingleValue !== undefined) {
    //                 // เรียกเพิ่มค่าเดี่ยว custom
    //                 const newStandard = await AddMiddleStandard({ MiddleValue: customSingleValue });
    //                 if (newStandard && newStandard.ID) {
    //                     standardID = newStandard.ID;
    //                     setMiddleStandards(prev => [...prev, newStandard]); // เพิ่มลง state
    //                 }
    //             } else if (
    //                 standardType === 'range' &&
    //                 customMinValue !== undefined &&
    //                 customMaxValue !== undefined
    //             ) {
    //                 // เรียกเพิ่มค่าช่วง custom
    //                 const newStandard = await AddRangeStandard({
    //                     MinValue: customMinValue,
    //                     MaxValue: customMaxValue,
    //                 });
    //                 if (newStandard && newStandard.ID) {
    //                     standardID = newStandard.ID;
    //                     setRangeStandards(prev => [...prev, newStandard]); // เพิ่มลง state
    //                 }
    //             }
    //         }

    //         // รวมวันที่และเวลา
    //         const dateValue = values.date ?? dayjs();
    //         const timeValue = values.time ?? dayjs();
    //         const combinedDate = dateValue.set('hour', timeValue.hour()).set('minute', timeValue.minute());
    //         const employeeID = Number(localStorage.getItem('employeeid'));

    //         if (selectedTreatmentID === 3) {
    //             // กรณีเลือก "ก่อนและหลังบำบัด"
    //             const payloadBefore: CreatePHInterface = {
    //                 Date: combinedDate.toISOString(),
    //                 Data: values.valueBefore,
    //                 BeforeAfterTreatmentID: 1,
    //                 StandardID: standardID,
    //                 UnitID: values.unitID,
    //                 EmployeeID: employeeID,
    //                 Note: values.note,
    //             };

    //             const payloadAfter: CreatePHInterface = {
    //                 Date: combinedDate.toISOString(),
    //                 Data: values.valueAfter,
    //                 BeforeAfterTreatmentID: 2,
    //                 StandardID: standardID,
    //                 UnitID: values.unitID,
    //                 EmployeeID: employeeID,
    //                 Note: values.note,
    //             };

    //             const res1 = await CreatePH(payloadBefore);
    //             const res2 = await CreatePH(payloadAfter);

    //             if ((res1 as any)?.status === 201 && (res2 as any)?.status === 201) {
    //                 messageApi.success('บันทึกข้อมูล pH ก่อนและหลังบำบัดสำเร็จ');
    //                 form.resetFields();
    //                 setSelectedTreatmentID(null);
    //                 setUseCustomStandard(false);
    //             } else {
    //                 message.error('ไม่สามารถบันทึกข้อมูลก่อนหรือหลังได้');
    //             }
    //         } else {
    //             // กรณีทั่วไป (ก่อน หรือ หลัง)
    //             const payload: CreatePHInterface = {
    //                 Date: combinedDate.toISOString(),
    //                 Data: values.data,
    //                 BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
    //                 StandardID: standardID,
    //                 UnitID: values.unitID,
    //                 EmployeeID: employeeID,
    //                 Note: values.note,
    //             };

    //             const response = await CreatePH(payload);

    //             if ((response as any)?.status === 201) {
    //                 messageApi.success('บันทึกข้อมูล pH สำเร็จ');
    //                 form.resetFields();
    //                 setSelectedTreatmentID(null);
    //                 setUseCustomStandard(false);
    //             } else {
    //                 message.error('ไม่สามารถบันทึกข้อมูลได้');
    //             }
    //         }

    //         // ล้างค่า custom input หลังบันทึก
    //         setCustomSingleValue(undefined);
    //         setCustomMinValue(undefined);
    //         setCustomMaxValue(undefined);

    //     } catch (error: any) {
    //         console.error('Error creating pH:', error);
    //         message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    //     }
    // };

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

            if (selectedTreatmentID === 3) {
                // กรณี "ก่อนและหลังบำบัด" ส่งข้อมูล 2 ชุด
                const payloadBefore: CreatePHInterface = {
                    Date: combinedDate.toISOString(),
                    Data: values.valueBefore,
                    BeforeAfterTreatmentID: 1,
                    StandardID: standardID,
                    UnitID: values.unitID,
                    EmployeeID: employeeID,
                    Note: values.note,
                };

                const payloadAfter: CreatePHInterface = {
                    Date: combinedDate.toISOString(),
                    Data: values.valueAfter,
                    BeforeAfterTreatmentID: 2,
                    StandardID: standardID,
                    UnitID: values.unitID,
                    EmployeeID: employeeID,
                    Note: values.note,
                };

                const res1 = await CreatePH(payloadBefore);
                const res2 = await CreatePH(payloadAfter);

                if ((res1 as any)?.status === 201 && (res2 as any)?.status === 201) {
                    messageApi.success('บันทึกข้อมูล pH ก่อนและหลังบำบัดสำเร็จ');
                    form.resetFields();
                    setSelectedTreatmentID(null);
                    setUseCustomStandard(false);
                } else {
                    message.error('ไม่สามารถบันทึกข้อมูลก่อนหรือหลังได้');
                }
            } else {
                // กรณีทั่วไป ส่งข้อมูลครั้งเดียว
                const payload: CreatePHInterface = {
                    Date: combinedDate.toISOString(),
                    Data: values.data,
                    BeforeAfterTreatmentID: values.beforeAfterTreatmentID,
                    StandardID: standardID,
                    UnitID: values.unitID,
                    EmployeeID: employeeID,
                    Note: values.note,
                };

                const response = await CreatePH(payload);

                if ((response as any)?.status === 201) {
                    messageApi.success('บันทึกข้อมูล pH สำเร็จ');
                    form.resetFields();
                    setSelectedTreatmentID(null);
                    setUseCustomStandard(false);
                } else {
                    message.error('ไม่สามารถบันทึกข้อมูลได้');
                }
            }

            // รีเซ็ตค่ากำหนดเอง
            setCustomSingleValue(undefined);
            setCustomMinValue(undefined);
            setCustomMaxValue(undefined);
        } catch (error) {
            console.error('Error creating pH:', error);
            message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedTreatmentID(null);
        setUseCustomStandard(false);
    };

    return (
        <div className="ph-container">
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
                <div className="form-group-ph">
                    <Form.Item label="วันที่บันทึกข้อมูล" name="date">
                        <DatePicker format="DD/MM/YYYY" className="full-width-ph" placeholder="เลือกวัน" />
                    </Form.Item>
                    <Form.Item label="เวลาที่บันทึกข้อมูล" name="time">
                        <TimePicker format="HH:mm" className="full-width-ph" placeholder="เลือกเวลา" />
                    </Form.Item>
                </div>

                <div className="form-group-ph">
                    <div className="form-group-mini-ph">
                        <Form.Item
                            label="หน่วยที่วัด"
                            name="unitID"
                            rules={[{ required: true, message: 'กรุณาเลือกหน่วยที่วัด' }]}
                        >
                            <Select placeholder="เลือกหน่วย">
                                {unitOptions.map((u) => (
                                    <Option key={u.ID} value={u.ID}>
                                        {u.UnitName}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                    <div className="form-group-mini-ph">
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
                                    rules={[{ required: true, message: 'กรุณากรอกค่ากลาง' }]}
                                >
                                    <InputNumber
                                        placeholder="กรอกค่ากลาง"
                                        style={{ width: '100%' }}
                                        value={customSingleValue}
                                        onChange={(value) => setCustomSingleValue(value ?? undefined)}
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
                                <div className="ph-fornt-small">
                                    <Form.Item
                                        label="ค่าต่ำสุด (Min)"
                                        name="customMin"
                                        rules={[{ required: true, message: 'กรุณากรอกค่าต่ำสุด' }]}
                                        style={{ flex: 1 }}
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

                <div className="form-group-ph">
                    <div className="form-group-mini-ph">
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
                    <div className="form-group-mini-ph">
                        {selectedTreatmentID === 3 ? (
                            <div style={{ display: 'flex', gap: '30px' }}>
                                <Form.Item
                                    label="ค่าที่วัดได้ก่อนบำบัด"
                                    name="valueBefore"
                                    rules={[{ required: true, message: 'กรอกค่าก่อนบำบัด' }]}
                                    style={{ flex: 1 }}
                                >
                                    <InputNumber style={{ width: '100%' }} placeholder="ค่าก่อนบำบัด" />
                                </Form.Item>

                                <Form.Item
                                    label="ค่าที่วัดได้หลังบำบัด"
                                    name="valueAfter"
                                    rules={[{ required: true, message: 'กรุณากรอกค่าหลังบำบัด' }]}
                                    style={{ flex: 1 }}
                                >
                                    <InputNumber style={{ width: '100%' }} placeholder="ค่าหลังบำบัด" />
                                </Form.Item>
                            </div>
                        ) : (
                            <Form.Item
                                label="ค่าที่วัดได้"
                                name="data"
                                rules={[{ required: true, message: 'กรอกค่าที่วัดได้' }]}
                            >
                                <InputNumber style={{ width: '100%' }} placeholder="ค่าที่วัดได้" />
                            </Form.Item>
                        )}
                    </div>
                </div>

                <div className="form-group-ph">
                    <Form.Item label="หมายเหตุ" name="note">
                        <Input.TextArea rows={2} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
                    </Form.Item>
                </div>

                <Form.Item className="form-actions-ph">
                    <Button className="cancel-ph" htmlType="button" onClick={handleCancel}>
                        ยกเลิก
                    </Button>
                    <Button htmlType="reset" className="reset-ph">
                        รีเซ็ต
                    </Button>
                    <Button type="primary" htmlType="submit" className="submit-ph">
                        บันทึก
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default PHCentralForm;
