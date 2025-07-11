import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, message } from "antd"; // <-- เพิ่ม message
import { UpdateHardwareParameterByID } from "../../../../../../services/hardware";

interface EditParameterModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: {
    parameter?: string;
    hardware_graph_id?: number;
    hardware_parameter_color_id?: number;
  };
}

const EditParameterModal: React.FC<EditParameterModalProps> = ({
  open,
  onClose,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues || {});
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const res = await UpdateHardwareParameterByID(1, values);
      setLoading(false);
      if (res) {
        message.success({ content: "อัปเดตสำเร็จ!", duration: 3 });
        onClose();
      } else {
        Modal.error({ content: "อัปเดตไม่สำเร็จ" });
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Edit Hardware Parameter"
      onCancel={onClose}
      onOk={handleOk}
      okText="Save"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Parameter Name"
          name="parameter"
          rules={[{ required: true, message: "กรุณาระบุ Parameter" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Hardware Graph ID"
          name="hardware_graph_id"
          rules={[{ required: true, message: "กรุณาระบุ Hardware Graph ID" }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Color ID"
          name="hardware_parameter_color_id"
          rules={[{ required: true, message: "กรุณาระบุ Hardware Parameter Color ID" }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditParameterModal;
