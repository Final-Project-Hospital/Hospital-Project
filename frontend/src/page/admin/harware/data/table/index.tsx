import React, { useEffect, useState } from "react";
import { Table, Input, Button, Dropdown, Checkbox, Modal } from "antd";
import { SearchOutlined, DownloadOutlined, DownOutlined, FilterOutlined } from "@ant-design/icons";
import { CSVLink } from "react-csv";
import { GetSensorDataByHardwareID, GetSensorDataParametersBySensorDataID } from "../../../../../services/hardware";
import type { ColumnsType } from "antd/es/table";

interface TableDataProps {
  hardwareID: number;
}

const TableData: React.FC<TableDataProps> = ({ hardwareID }) => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [uniqueColumns, setUniqueColumns] = useState<string[]>(["Date"]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["Date"]);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!hardwareID) return;
      const res = await GetSensorDataByHardwareID(hardwareID);
      if (!Array.isArray(res)) {
        setTableData([]);
        setLoading(false);
        return;
      }

      const paramDetails: any[] = [];
      for (const sensor of res) {
        const parameters = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (Array.isArray(parameters)) {
          parameters.forEach((param: any) => {
            const name = param.HardwareParameter?.Parameter;
            const value = param.Data;
            let sensorDate = "ไม่ทราบวันที่";
            if (param?.Date && !isNaN(new Date(param.Date).getTime())) {
              sensorDate = new Date(param.Date).toLocaleString("th-TH", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
            }
            if (name) {
              paramDetails.push({
                ParameterName: name,
                Date: sensorDate,
                [name]: value,
              });
            }
          });
        }
      }

      const uniqueParams = Array.from(
        new Set(paramDetails.map((p) => p.ParameterName).filter(Boolean))
      );
      setUniqueColumns(["Date", ...uniqueParams]);
      setSelectedColumns(["Date", ...uniqueParams]);

      const groupedRows: Record<string, any> = {};
      paramDetails.forEach((p) => {
        const date = p.Date;
        if (!groupedRows[date]) groupedRows[date] = { Date: date };
        groupedRows[date] = { ...groupedRows[date], ...p };
        delete groupedRows[date].ParameterName;
      });
      const finalTableData = Object.values(groupedRows);

      setTableData(finalTableData);
      setLoading(false);
    };

    fetchData();
  }, [hardwareID]);

  useEffect(() => {
    setFilteredData(
      tableData.filter((item) =>
        selectedColumns.some((col) =>
          (item[col] ?? "")
            .toString()
            .toLowerCase()
            .includes(searchText.toLowerCase())
        )
      )
    );
  }, [searchText, tableData, selectedColumns]);

  // ---- Columns for antd Table with ColumnsType<any> ----
  const columns: ColumnsType<any> = [
    {
      title: (
        <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-transparent font-bold">
          No
        </span>
      ),
      dataIndex: "no",
      key: "no",
      width: 60,
      render: (_: any, __: any, idx: number) => idx + 1,
      fixed: "left" as const,
    },
    ...uniqueColumns
      .filter((col) => selectedColumns.includes(col))
      .map((col) => ({
        title: (
          <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-transparent font-bold">
            {col}
          </span>
        ),
        dataIndex: col,
        key: col,
        render: (val: any) => val ?? "-",
      })),
  ];

  // ---- Export CSV ----
  const getDataForCSV = (data: any[]) =>
    data.map((row: any, idx: number) => {
      const newRow: any = { No: idx + 1 };
      selectedColumns.forEach((col) => (newRow[col] = row[col] ?? "-"));
      return newRow;
    });

  // ---- Column select menu ----
  const columnSelectMenu = (
    <div className="p-2" style={{ minWidth: 200 }}>
      <Checkbox.Group
        value={selectedColumns}
        onChange={(vals) =>
          setSelectedColumns(vals.length ? (vals as string[]) : ["Date"])
        }
      >
        <div className="flex flex-col gap-2">
          {uniqueColumns.map((col) => (
            <Checkbox value={col} key={col}>
              {col}
            </Checkbox>
          ))}
        </div>
      </Checkbox.Group>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 mt-24 md:mt-0">
      <div className="paddings">
        <div className="bg-white rounded-2xl shadow-xl p-6 ">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-teal-400" />}
              placeholder="ค้นหาในทุกคอลัมน์..."
              className="rounded-xl border-teal-200 focus:border-teal-400 shadow w-full md:w-1/3"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <div className="flex gap-2">
              <Dropdown overlay={columnSelectMenu} trigger={['click']} placement="bottomRight" arrow>
                <Button icon={<FilterOutlined />}>
                  เลือกคอลัมน์ <DownOutlined />
                </Button>
              </Dropdown>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setShowDownloadModal(true)}
                className="flex items-center gap-2 bg-white text-teal-800 rounded-full hover:bg-teal-100 border-none shadow transition"
              >
                Download CSV
              </Button>
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(_, idx) => idx ?? Math.random()}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],
              position: ["bottomCenter"],
            }}
            className="rounded-2xl overflow-hidden"
            scroll={{ x: "max-content" }}
          />
        </div>
      </div>

      {/* Modal Download CSV */}
      <Modal
        open={showDownloadModal}
        onCancel={() => setShowDownloadModal(false)}
        footer={null}
        centered
      >
        <div className="flex flex-col gap-4 items-center py-6">
          <h3 className="text-lg font-bold mb-2">Export ข้อมูลเป็น CSV</h3>
          <div className="flex gap-3">
            <CSVLink
              data={getDataForCSV(filteredData)}
              filename="sensor-data-filtered.csv"
              className="ant-btn ant-btn-primary"
              onClick={() => setShowDownloadModal(false)}
              target="_blank"
            >
              เฉพาะข้อมูลที่ค้นหา
            </CSVLink>
            <CSVLink
              data={getDataForCSV(tableData)}
              filename="sensor-data-all.csv"
              className="ant-btn"
              onClick={() => setShowDownloadModal(false)}
              target="_blank"
            >
              ข้อมูลทั้งหมด
            </CSVLink>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TableData;
