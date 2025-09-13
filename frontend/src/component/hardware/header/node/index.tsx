import { useTranslation } from "react-i18next";
import {
  FaMicrochip,
  FaEye,
  FaHashtag,
  FaTag,
  FaNetworkWired,
  FaTools,
  FaTrash,
  FaEdit,
  FaExclamationTriangle,
} from "react-icons/fa";
import { MediaCard } from "./card";
import { useEffect, useState } from "react";
import {
  ListHardware,
  UpdateHardwareByID,
  DeleteHardwareByID,
} from "../../../../services/hardware";
import { HardwareInterface } from "../../../../interface/IHardware";
import { Modal, Table, Button, Input, message } from "antd";
import { useStateContext } from "../../../../contexts/ContextProvider";

const Node = () => {
  const { t } = useTranslation();
  const { bumpReload } = useStateContext();

  const [count, setCount] = useState<number>(0);
  const [hardwares, setHardwares] = useState<HardwareInterface[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

  // ✅ Responsive width
  const [modalWidth, setModalWidth] = useState<number>(950);
  const [deleteModalWidth, setDeleteModalWidth] = useState<number>(400);

  const updateModalSize = () => {
    const width = window.innerWidth;
    if (width < 640) {
      // Mobile
      setModalWidth(width * 0.95);
      setDeleteModalWidth(width * 0.9);
    } else if (width < 1024) {
      // Tablet
      setModalWidth(700);
      setDeleteModalWidth(420);
    } else {
      // Desktop
      setModalWidth(950);
      setDeleteModalWidth(400);
    }
  };

  useEffect(() => {
    updateModalSize();
    window.addEventListener("resize", updateModalSize);
    return () => window.removeEventListener("resize", updateModalSize);
  }, []);

  const fetchHardwares = async () => {
    try {
      setLoading(true);
      const res = await ListHardware();
      if (res) {
        const data = res as HardwareInterface[];
        setHardwares(data);
        setCount(data.length);
      }
    } catch (error) {
      console.error("Error fetching hardwares:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHardwares();
  }, []);

  // ✅ ฟังก์ชันแก้ไขชื่อ
  const handleUpdate = async (id: number) => {
    if (!newName.trim()) {
      message.warning("กรุณากรอกชื่อใหม่");
      return;
    }
    const updated = await UpdateHardwareByID(id, newName);
    if (updated) {
      message.success("อัปเดตสำเร็จ");
      setEditingId(null);
      setNewName("");
      fetchHardwares();
      bumpReload();
    } else {
      message.error("อัปเดตไม่สำเร็จ");
    }
  };

  // ✅ ฟังก์ชันลบหลายตัว
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      for (const id of selectedRowKeys) {
        await DeleteHardwareByID(Number(id));
      }
      message.success(`ลบอุปกรณ์ทั้งหมด ${selectedRowKeys.length} รายการสำเร็จ`);
      setSelectedRowKeys([]);
      fetchHardwares();
      bumpReload();
    } catch (error) {
      message.error("ลบไม่สำเร็จ");
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const columns = [
    {
      title: (
        <span className="flex items-center gap-2 text-teal-600 font-semibold">
          <FaHashtag /> {t("ลำดับ")}
        </span>
      ),
      dataIndex: "ID",
      key: "ID",
    },
    {
      title: (
        <span className="flex items-center gap-2 text-teal-600 font-semibold">
          <FaTag /> {t("ชื่ออุปกรณ์")}
        </span>
      ),
      dataIndex: "Name",
      key: "Name",
    },
    {
      title: (
        <span className="flex items-center gap-2 text-teal-600 font-semibold">
          <FaNetworkWired /> {t("Mac Address")}
        </span>
      ),
      dataIndex: "MacAddress",
      key: "MacAddress",
    },
    {
      title: (
        <span className="flex items-center gap-2 text-teal-600 font-semibold">
          <FaTools /> {t("จัดการ")}
        </span>
      ),
      key: "action",
      render: (_: any, record: HardwareInterface) => (
        <div className="flex gap-2">
          {editingId === record.ID ? (
            <>
              <Input
                size="small"
                placeholder="ชื่อใหม่"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ width: 150 }}
              />
              <Button
                size="small"
                className="bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white rounded-full shadow-md px-3"
                onClick={() => handleUpdate(record.ID!)}
              >
                บันทึก
              </Button>
              <Button
                size="small"
                className="bg-gray-200 hover:bg-gray-300 rounded-full px-3"
                onClick={() => {
                  setEditingId(null);
                  setNewName("");
                }}
              >
                ยกเลิก
              </Button>
            </>
          ) : (
            <Button
              size="small"
              icon={<FaEdit />}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full shadow hover:shadow-lg transition px-3"
              onClick={() => setEditingId(record.ID!)}
            >
              แก้ไข
            </Button>
          )}
        </div>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <>
      <MediaCard
        icon={<FaMicrochip />}
        title={count.toString()}
        desc={t("อุปกรณ์")}
        actionIcon={<FaEye onClick={() => setOpen(true)} className="cursor-pointer" />}
        style={{ backgroundColor: "#ff4d4f", color: "#fff" }}
        classNames={{ body: "p-4" }}
      />
      <Modal
        title={
          <div className="flex justify-between items-center w-full pr-12">
            <span className="text-lg font-bold text-teal-600 flex items-center gap-2">
              <FaMicrochip /> {t("รายการอุปกรณ์ทั้งหมด")}
            </span>
            {selectedRowKeys.length > 0 && (
              <Button
                type="default"
                style={{ backgroundColor: "#ef4444", color: "#fff", border: "none" }}
                className="flex items-center gap-2 ml-4 hover:!bg-red-600 rounded-full shadow-md px-4"
                onClick={() => setDeleteModalOpen(true)}
              >
                <FaTrash /> ลบที่เลือก ({selectedRowKeys.length})
              </Button>
            )}
          </div>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={modalWidth}
        className="rounded-2xl"
        bodyStyle={{
          backgroundColor: "#fafafa",
          borderRadius: "0.75rem",
          padding: "1rem",
        }}
        style={{ top: 60 }}
      >
        <Table
  rowKey="ID"
  rowSelection={rowSelection}
  dataSource={hardwares}
  columns={columns}
  loading={loading}
  pagination={{ pageSize: 5 }}
  className="rounded-xl shadow-sm overflow-x-auto"
  scroll={{ x: "max-content" }} // ✅ ให้ Scroll แนวนอนเมื่อคอลัมน์เกิน
  components={{
    header: {
      cell: (props: any) => (
        <th
          {...props}
          className="!bg-gray-50 !text-teal-600 !font-semibold"
        />
      ),
    },
  }}
/>
      </Modal>

      {/* ✅ Modal ยืนยันการลบ (Responsive) */}
      <Modal
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        footer={null}
        centered
        width={deleteModalWidth}
        className="rounded-xl"
        bodyStyle={{ padding: "1rem" }}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
          <FaExclamationTriangle className="text-red-500 text-4xl" />
          <h2 className="text-lg font-semibold text-gray-800">
            ยืนยันการลบอุปกรณ์
          </h2>
          <p className="text-gray-600">
            คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
            <span className="text-red-500 font-bold">
              {selectedRowKeys.length}
            </span>{" "}
            รายการนี้?
          </p>

          {/* ปุ่ม Responsive */}
          <div className="flex flex-col sm:flex-row w-full gap-3 mt-2">
            <Button
              className="rounded-full px-4 w-full sm:w-auto"
              onClick={() => setDeleteModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full px-4 shadow-md hover:from-red-600 hover:to-pink-600 w-full sm:w-auto"
              onClick={handleBulkDelete}
            >
              ลบข้อมูล
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Node;
