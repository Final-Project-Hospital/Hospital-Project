import React, { useEffect, useState } from "react";
import { Modal, Form, Input, message, Spin } from "antd";
import {
  ListHardwareParameterByHardwareID,
  UpdateStandardHardwareByID,
  UpdateUnitHardwareByID,
} from "../../../../../services/hardware";

interface EditStandardUnitModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hardwareID: number;
}

const EditStandardUnitModal: React.FC<EditStandardUnitModalProps> = ({
  open,
  onClose,
  onSuccess,
  hardwareID,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !hardwareID) return;

    setLoading(true);
    ListHardwareParameterByHardwareID(hardwareID)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid parameter list");
        setParams(data);
        const initialValues: any = {};
        data.forEach((param) => {
          initialValues[`standard_${param.ID}`] = param.StandardHardware?.Standard ?? "";
          initialValues[`unit_${param.ID}`] = param.UnitHardware?.Unit ?? "";
        });
        form.setFieldsValue(initialValues);
      })
      .catch(() => {
        message.error("ไม่สามารถโหลดข้อมูลพารามิเตอร์ได้");
      })
      .finally(() => setLoading(false));
  }, [open, hardwareID]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await Promise.all(
        params.map(async (param) => {
          const rawStandard = values[`standard_${param.ID}`];
          const rawUnit = values[`unit_${param.ID}`];

          const newStandard = parseFloat(rawStandard);
          const newUnit = rawUnit;

          if (isNaN(newStandard)) {
            throw new Error(`Standard ของ ${param.Parameter} ไม่ถูกต้อง`);
          }

          await UpdateStandardHardwareByID(param.StandardHardware.ID, {
            Standard: newStandard,
          });

          await UpdateUnitHardwareByID(param.UnitHardware.ID, {
            Unit: newUnit,
          });
        })
      );

      message.success("อัปเดตข้อมูลเรียบร้อยแล้ว");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      closable={false}
      className="rounded-xl"
    >
      <div className="bg-teal-500 text-white text-lg font-semibold text-center py-2 rounded-t-xl">
        แก้ไขค่า Standard และหน่วยของพารามิเตอร์
      </div>

      <div className="px-4 sm:px-6 pt-4 pb-2 max-h-[80vh] overflow-y-auto">
        <Spin spinning={loading}>
          <Form layout="vertical" form={form}>
            {params.map((param) => (
              <div
                key={param.ID}
                className="bg-white border border-teal-100 rounded-lg px-4 py-3 mb-4 shadow-sm"
              >
                <div className="text-base font-semibold text-teal-700 mb-3">
                  {param.Parameter}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  {/* Label: Standard */}
                  <div className="sm:col-span-2 text-sm font-medium text-gray-700">
                    * Standard
                  </div>

                  {/* Input: Standard */}
                  <div className="sm:col-span-4">
                    <Form.Item
                      name={`standard_${param.ID}`}
                      rules={[{ required: true, message: "กรุณากรอกค่า Standard" }]}
                      noStyle
                    >
                      <Input
                        type="number"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300"
                      />
                    </Form.Item>
                  </div>

                  {/* Label: หน่วย */}
                  <div className="sm:col-span-2 text-sm font-medium text-gray-700">
                    * หน่วย
                  </div>

                  {/* Input: หน่วย */}
                  <div className="sm:col-span-4">
                    <Form.Item
                      name={`unit_${param.ID}`}
                      rules={[{ required: true, message: "กรุณากรอกหน่วย" }]}
                      noStyle
                    >
                      <Input className="w-full rounded-md border border-gray-300" />
                    </Form.Item>
                  </div>
                </div>
              </div>
            ))}
          </Form>
        </Spin>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 pb-4">
          <button
            className="px-4 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-1.5 text-sm rounded-md text-white bg-teal-500 hover:bg-teal-600 transition disabled:opacity-50"
          >
            บันทึก
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditStandardUnitModal;
