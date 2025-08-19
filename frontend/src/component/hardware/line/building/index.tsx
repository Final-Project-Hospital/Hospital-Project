import { useEffect, useState } from "react";
import { Card, Table, Button, Modal, Input, message, Space } from "antd";
import { useTranslation } from "react-i18next";
import {
  ListBuilding,
  CreateBuilding,
  DeleteBuildingByID,
  UpdateBuildingByID,
} from "../../../../services/hardware";
import { BuildingInterface } from "../../../../interface/IBuilding";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { FaBuilding } from "react-icons/fa";
import { useNotificationContext } from "../../line/NotificationContext"; // ✅ ใช้ context

const BuildingALL = () => {
  const { t } = useTranslation();
  const { triggerReload } = useNotificationContext(); // ✅ ดึงฟังก์ชันมาใช้

  const [buildings, setBuildings] = useState<BuildingInterface[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState("");

  // Delete confirm modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInterface | null>(null);

  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBuilding, setEditBuilding] = useState<BuildingInterface | null>(null);
  const [editName, setEditName] = useState("");

  // โหลดข้อมูลอาคาร
  const fetchBuildings = async () => {
    setLoading(true);
    const res = await ListBuilding();
    if (res) setBuildings(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  // ✅ Create building
  const handleCreateBuilding = async () => {
    if (!newBuildingName.trim()) {
      message.warning("กรุณากรอกชื่ออาคาร");
      return;
    }
    const res = await CreateBuilding({ BuildingName: newBuildingName });
    if (res) {
      message.success("เพิ่มข้อมูลอาคารสำเร็จ");
      setIsModalOpen(false);
      setNewBuildingName("");
      fetchBuildings();
      triggerReload(); // ✅ แจ้งให้ Building รีโหลด
    } else {
      message.error("ไม่สามารถเพิ่มข้อมูลอาคารได้");
    }
  };

  // ✅ Delete building
  const handleDeleteBuilding = async () => {
    if (!selectedBuilding) return;
    const res = await DeleteBuildingByID(selectedBuilding.ID!);
    if (res) {
      message.success("ลบข้อมูลอาคารสำเร็จ");
      setDeleteModalVisible(false);
      setSelectedBuilding(null);
      fetchBuildings();
      triggerReload(); // ✅ แจ้งให้ Building รีโหลด
    } else {
      message.error("ไม่สามารถลบข้อมูลอาคารได้");
    }
  };

  // ✅ Edit building
  const handleEditBuilding = async () => {
    if (!editName.trim()) {
      message.warning("กรุณากรอกชื่ออาคาร");
      return;
    }
    if (!editBuilding?.ID) return;

    const res = await UpdateBuildingByID(editBuilding.ID, { BuildingName: editName });
    if (res) {
      message.success("แก้ไขข้อมูลอาคารสำเร็จ");
      setEditModalVisible(false);
      setEditBuilding(null);
      setEditName("");
      fetchBuildings();
      triggerReload(); // ✅ แจ้งให้ Building รีโหลด
    } else {
      message.error("ไม่สามารถแก้ไขข้อมูลอาคารได้");
    }
  };

  // ✅ columns
  const columns = [
    {
      title: "ลำดับ",
      width: 80,
      align: "center" as const,
      render: (_: any, __: BuildingInterface, index: number) => (
        <span className="text-xs text-gray-600">{index + 1}</span>
      ),
    },
    {
      title: "ชื่ออาคาร",
      dataIndex: "BuildingName",
      ellipsis: true,
      render: (text: string) => (
        <span className="text-sm text-gray-700">{text}</span>
      ),
    },
    {
      title: "การจัดการ",
      align: "center" as const,
      width: 160,
      render: (_: any, record: BuildingInterface) => (
        <Space>
          <Button
            size="small"
            type="default"
            icon={<EditOutlined />}
            style={{ color: "teal", borderColor: "teal" }}
            onClick={() => {
              setEditBuilding(record);
              setEditName(record.BuildingName || "");
              setEditModalVisible(true);
            }}
          >
            แก้ไข
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedBuilding(record);
              setDeleteModalVisible(true);
            }}
          >
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{height: "100%"}}
      title={
        <span className="flex items-center gap-2 text-teal-600 font-semibold">
          <FaBuilding /> {t("อาคารทั้งหมด")}
        </span>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ backgroundColor: "teal", borderColor: "teal" }}
          onClick={() => setIsModalOpen(true)}
        >
          เพิ่มข้อมูลอาคาร
        </Button>
      }
      classNames={{ body: "pt-0", header: "border-0" }}
      bordered={false}
    >
      <Table
        rowKey="ID"
        dataSource={buildings}
        loading={loading}
        pagination={false}
        columns={columns}
        bordered={false}
        size="middle"
        scroll={buildings.length > 4 ? { y: 195 } : undefined}
        className="[&_.ant-table-thead>tr>th]:bg-teal-50 [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-[12px] [&_.ant-table-thead>tr>th]:border-b-2 [&_.ant-table-body]:pb-4"
      />

      {/* Modal เพิ่มอาคาร */}
      <Modal
        title="เพิ่มข้อมูลอาคาร"
        open={isModalOpen}
        onOk={handleCreateBuilding}
        onCancel={() => setIsModalOpen(false)}
        centered
        okText="บันทึก"
        cancelText="ยกเลิก"
        okButtonProps={{ style: { backgroundColor: "teal", borderColor: "teal" } }}
      >
        <Input
          placeholder="กรอกชื่ออาคาร"
          value={newBuildingName}
          onChange={(e) => setNewBuildingName(e.target.value)}
        />
      </Modal>

      {/* Modal ลบ */}
      <Modal
        title="ยืนยันการลบ"
        open={deleteModalVisible}
        onOk={handleDeleteBuilding}
        onCancel={() => setDeleteModalVisible(false)}
        centered
        okText="ลบ"
        cancelText="ยกเลิก"
        okButtonProps={{ danger: true }}
      >
        <p>
          คุณต้องการลบอาคาร{" "}
          <span className="font-semibold text-red-500">
            {selectedBuilding?.BuildingName}
          </span>{" "}
          ใช่หรือไม่?
        </p>
      </Modal>

      {/* Modal แก้ไข */}
      <Modal
        title="แก้ไขข้อมูลอาคาร"
        open={editModalVisible}
        onOk={handleEditBuilding}
        onCancel={() => setEditModalVisible(false)}
        centered
        okText="บันทึก"
        cancelText="ยกเลิก"
        okButtonProps={{ style: { backgroundColor: "teal", borderColor: "teal" } }}
      >
        <Input
          placeholder="แก้ไขชื่ออาคาร"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
        />
      </Modal>
    </Card>
  );
};

export default BuildingALL;
