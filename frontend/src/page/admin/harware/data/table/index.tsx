import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Dropdown,
  Checkbox,
  Input,
  Modal,
  DatePicker,
} from "antd";
import {
  DownloadOutlined,
  DownOutlined,
  FilterOutlined,
  FileExcelOutlined,
  SearchOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { CSVLink } from "react-csv";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { GetSensorDataByHardwareID, GetSensorDataParametersBySensorDataID } from "../../../../../services/hardware";
import type { ColumnsType } from "antd/es/table";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;

interface TableDataProps {
  hardwareID: number;
  onLoaded?: () => void;
}

const TableData: React.FC<TableDataProps> = ({ hardwareID, onLoaded }) => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [uniqueColumns, setUniqueColumns] = useState<string[]>(["Date"]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["Date"]);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!hardwareID) {
        setLoading(false);
        onLoaded?.();
        return;
      }
      const res = await GetSensorDataByHardwareID(hardwareID);
      if (!Array.isArray(res)) {
        setTableData([]);
        setLoading(false);
        onLoaded?.();
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
            let rawDate = "";
            if (param?.Date && !isNaN(new Date(param.Date).getTime())) {
              rawDate = param.Date;
              sensorDate = dayjs(param.Date).format("DD/MM/YYYY HH:mm");
            }
            if (name) {
              paramDetails.push({
                ParameterName: name,
                Date: sensorDate,
                rawDate: rawDate,
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

      // group by date
      const groupedRows: Record<string, any> = {};
      paramDetails.forEach((p) => {
        const date = p.Date;
        if (!groupedRows[date]) groupedRows[date] = { Date: date, rawDate: p.rawDate };
        groupedRows[date] = { ...groupedRows[date], ...p };
        delete groupedRows[date].ParameterName;
      });
      const finalTableData = Object.values(groupedRows);

      setTableData(finalTableData);
      setLoading(false);
      onLoaded?.();
    };

    fetchData();
  }, [hardwareID, onLoaded]);

  useEffect(() => {
    let data = tableData;

    // Filter by date range (แก้ให้รวมวันแรก-วันสุดท้ายจริง)
    if (dateRange[0] && dateRange[1]) {
      data = data.filter((item) => {
        const d = dayjs(item.rawDate);
        return (
          d.isValid() &&
          d.isSameOrAfter(dateRange[0], "day") &&
          d.isSameOrBefore(dateRange[1], "day")
        );
      });
    }

    // Filter by text search
    if (searchText.trim() !== "") {
      data = data.filter((item) =>
        selectedColumns.some((col) =>
          (item[col] ?? "")
            .toString()
            .toLowerCase()
            .includes(searchText.toLowerCase())
        )
      );
    }
    setFilteredData(data);
  }, [searchText, tableData, selectedColumns, dateRange]);

  const columns: ColumnsType<any> = [
    {
      title: (
        <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 bg-clip-text text-transparent font-bold">
          ID
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

  const getDataForCSV = (data: any[]) =>
    data.map((row: any, idx: number) => {
      const newRow: any = { No: idx + 1 };
      selectedColumns.forEach((col) => (newRow[col] = row[col] ?? "-"));
      return newRow;
    });

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
    <div className="w-full mt-6">
      <div className="p-0 sm:p-3">
        <div
          className="bg-white rounded-2xl shadow-xl p-2 sm:p-6"
          style={{ minHeight: 320 }}
        >
          {/* Toolbar: Desktop = row, Mobile = col */}
          <div className="flex sm:flex-row flex-col gap-2 w-full sm:items-center sm:justify-between mb-3">
            <div className="flex sm:flex-row flex-col gap-2 w-full items-center">
              <div className="sm:w-auto w-full">
                <Input
                  allowClear
                  prefix={<SearchOutlined className="text-teal-700" />}
                  placeholder="ค้นหาในตาราง..."
                  className="rounded-lg border-teal-200 focus:border-teal-400 shadow"
                  style={{
                    fontSize: 16,
                    width: "100%",
                    background: "#f0fdfa",
                  }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="sm:w-auto w-full">
                <RangePicker
                  className="rounded-lg border border-teal-200 shadow w-full"
                  format="DD/MM/YYYY"
                  style={{ background: "#f0fdfa", width: "100%" }}
                  allowClear={true}
                  onChange={(dates) =>
                    setDateRange(dates ? (dates as [Dayjs, Dayjs]) : [null, null])
                  }
                  value={dateRange}
                  placeholder={["วันที่เริ่มต้น", "วันที่สิ้นสุด"]}
                  suffixIcon={<CalendarOutlined className="text-teal-500" />}
                />
              </div>
              <div className="sm:w-auto w-full">
                <Dropdown
                  overlay={columnSelectMenu}
                  trigger={["click"]}
                  placement="bottomRight"
                  arrow
                >
                  <Button icon={<FilterOutlined />} className="w-full sm:w-auto">
                    เลือกคอลัมน์ <DownOutlined />
                  </Button>
                </Dropdown>
              </div>
              <div className="sm:w-auto w-full">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => setShowDownloadModal(true)}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-teal-400 text-white border-none shadow transition w-full sm:w-auto"
                  style={{ fontWeight: 600 }}
                >
                  Download CSV
                </Button>
              </div>
            </div>
          </div>
          {/* Table: responsive overflow & scroll */}
          <div
            className="w-full overflow-x-auto"
            style={{ scrollbarWidth: "thin", maxWidth: "100vw" }}
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey={(_, idx) => idx ?? Math.random()}
              loading={loading}
              pagination={{
                pageSize: pageSize,
                showSizeChanger: true,
                pageSizeOptions: [5, 10, 20, 50],
                position: ["bottomCenter"],
                onShowSizeChange: (_, size) => setPageSize(size),
                responsive: true,
              }}
              className="rounded-2xl overflow-x-auto"
              scroll={{ x: 600 }}
              style={{ minWidth: 350 }}
            />
          </div>
        </div>
      </div>

      {/* Modal Download CSV */}
      <Modal
        open={showDownloadModal}
        onCancel={() => setShowDownloadModal(false)}
        footer={null}
        centered
        bodyStyle={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px 16px 28px 16px",
          minHeight: 200,
        }}
        width={390}
      >
        <div className="flex flex-col gap-4 items-center justify-center">
          <FileExcelOutlined
            style={{
              fontSize: 48,
              color: "#14b8a6",
              filter: "drop-shadow(0 2px 8px #99f6e4)",
            }}
          />
          <div className="text-lg font-extrabold text-gray-700 mb-1">
            Export ข้อมูลเป็น CSV
          </div>
          <div className="w-full flex flex-col gap-3 mt-2">
            <CSVLink
              data={getDataForCSV(filteredData)}
              filename="sensor-data-filtered.csv"
              className="ant-btn ant-btn-primary"
              style={{
                background: "linear-gradient(90deg, #0d9488 0%, #5eead4 100%)",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                borderRadius: 14,
                boxShadow: "0 1px 4px 0 #134e4a25",
                padding: "0.8em 1.2em",
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onClick={() => setShowDownloadModal(false)}
              target="_blank"
            >
              <DownloadOutlined /> ดาวน์โหลดเฉพาะที่ค้นหา
            </CSVLink>
            <CSVLink
              data={getDataForCSV(tableData)}
              filename="sensor-data-all.csv"
              className="ant-btn"
              style={{
                background: "linear-gradient(90deg, #14b8a6 0%, #0ea5e9 100%)",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                borderRadius: 14,
                boxShadow: "0 1px 4px 0 #134e4a20",
                padding: "0.8em 1.2em",
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onClick={() => setShowDownloadModal(false)}
              target="_blank"
            >
              <DownloadOutlined /> ดาวน์โหลดทั้งหมด
            </CSVLink>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TableData;
