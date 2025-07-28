import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Dropdown,
  Checkbox,
  Input,
  Modal,
} from "antd";
import {
  DownloadOutlined,
  DownOutlined,
  FilterOutlined,
  FileExcelOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { CSVLink } from "react-csv";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import DateRangePickerWrapper from "./DateRangePickerWrapper";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
} from "../../../../../services/hardware";
import type { ColumnsType } from "antd/es/table";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface TableDataProps {
  hardwareID: number;
  onLoaded?: () => void;
}

const TableData: React.FC<TableDataProps> = ({ hardwareID, onLoaded }) => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [uniqueColumns, setUniqueColumns] = useState<string[]>(["Date"]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["Date"]);
  const [paramUnits, setParamUnits] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  const currentYear = new Date().getFullYear();
  const defaultStart = new Date(currentYear, 0, 1);
  const defaultEnd = new Date(currentYear, 11, 31);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    defaultStart,
    defaultEnd,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await GetSensorDataByHardwareID(hardwareID);
      if (!Array.isArray(res)) {
        setLoading(false);
        return;
      }

      const paramDetails: any[] = [];
      for (const sensor of res) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (Array.isArray(params)) {
          params.forEach((param: any) => {
            const name = param.HardwareParameter?.Parameter;
            const value = param.Data;
            const standard = param.HardwareParameter?.StandardHardware?.Standard ?? null;
            const unit = param.HardwareParameter?.UnitHardware?.Unit ?? "";

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
                rawDate,
                [name]: value,
                [`${name}_standard`]: standard,
                [`${name}_unit`]: unit,
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

      const unitMap: Record<string, string> = {};
      paramDetails.forEach((p) => {
        if (p.ParameterName && p[`${p.ParameterName}_unit`]) {
          unitMap[p.ParameterName] = p[`${p.ParameterName}_unit`];
        }
      });
      setParamUnits(unitMap);

      const groupedRows: Record<string, any> = {};
      paramDetails.forEach((p) => {
        const date = p.Date;
        if (!groupedRows[date])
          groupedRows[date] = { Date: date, rawDate: p.rawDate };
        Object.entries(p).forEach(([key, val]) => {
          if (key !== "ParameterName" && key !== "rawDate") {
            groupedRows[date][key] = val;
          }
        });
      });

      const finalTableData = Object.values(groupedRows);
      setTableData(finalTableData);
      onLoaded?.();
      setLoading(false);
    };

    fetchData();
  }, [hardwareID, onLoaded]);

  useEffect(() => {
    let data = tableData;

    if (dateRange[0] && dateRange[1]) {
      data = data.filter((item) => {
        const d = dayjs(item.rawDate);
        return (
          d.isValid() &&
          d.isSameOrAfter(dayjs(dateRange[0]), "day") &&
          d.isSameOrBefore(dayjs(dateRange[1]), "day")
        );
      });
    }

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
        <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-bold">
          ID
        </span>
      ),
      dataIndex: "no",
      key: "no",
      render: (_: any, __: any, idx: number) => idx + 1,
      width: 60,
      fixed: "left",
    },
    ...uniqueColumns
      .filter((col) => selectedColumns.includes(col))
      .map((col) => {
        const displayTitle =
          col === "Date"
            ? "Date"
            : paramUnits[col]
              ? `${col} (${paramUnits[col]})`
              : col;

        return {
          title: (
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-bold">
              {displayTitle}
            </span>
          ),
          dataIndex: col,
          key: col,
          render: (val: any, row: any) => {
            if (col === "Date" || col === "rawDate") return val;
            const standard = row[`${col}_standard`];
            const num = typeof val === "number" ? val : parseFloat(val);

            if (!isNaN(num) && standard !== null) {
              if (num > standard) {
                return (
                  <span style={{ color: "red", fontWeight: "bold" }}>
                    {num.toFixed(2)}
                  </span>
                );
              } else if (num >= standard * 0.9) {
                return (
                  <span style={{ color: "orange", fontWeight: "bold" }}>
                    {num.toFixed(2)}
                  </span>
                );
              } else {
                return num.toFixed(2);
              }
            }
            return val ?? "-";
          },
        };
      }),
  ];

  const getDataForCSV = (data: any[]) =>
    data.map((row: any, idx: number) => {
      const result: any = { No: idx + 1 };
      selectedColumns.forEach((col) => (result[col] = row[col] ?? "-"));
      return result;
    });

  const columnSelectMenu = (
    <div className="p-2">
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
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex flex-col md:flex-wrap lg:flex-row gap-3 items-stretch lg:items-center justify-start mb-4 w-full">
          <div className="w-full lg:w-[300px]">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-teal-600" />}
              placeholder="ค้นหา..."
              className="rounded-lg border-teal-300 focus:border-teal-500 shadow w-full"
              style={{ fontSize: 16, background: "#f0fdfa" }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="w-full lg:w-[300px]">
            <DateRangePickerWrapper
              value={dateRange}
              onChange={(val) =>
                setDateRange(val ? [val[0], val[1]] : [null, null])
              }
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <Dropdown
              overlay={columnSelectMenu}
              trigger={["click"]}
              placement="bottomRight"
              arrow
            >
              <Button
                icon={<FilterOutlined />}
                className="font-semibold w-full md:w-[120px]"
              >
                คอลัมน์ <DownOutlined />
              </Button>
            </Dropdown>

            <Button
              icon={<DownloadOutlined />}
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center justify-center gap-2 w-full md:w-auto rounded-full text-white border-none shadow font-semibold transition duration-300 ease-in-out bg-gradient-to-r from-teal-500 to-cyan-500"
              style={{ minWidth: 140 }}
            >
              Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(_, idx) => idx ?? Math.random()}
            loading={loading}
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],
              position: ["bottomCenter"],
              onShowSizeChange: (_, size) => setPageSize(size),
              responsive: true,
            }}
            scroll={{ x: 600 }}
            className="rounded-2xl"
          />
        </div>
      </div>

      <Modal
        open={showDownloadModal}
        onCancel={() => setShowDownloadModal(false)}
        footer={null}
        centered
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6 px-4 text-center">
          <FileExcelOutlined style={{ fontSize: 48, color: "#14b8a6" }} />
          <h2 className="text-lg font-bold text-gray-700">Export ข้อมูลเป็น CSV</h2>

          <CSVLink
            data={getDataForCSV(filteredData)}
            filename="filtered-data.csv"
            className="w-full"
          >
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold shadow hover:from-cyan-500 hover:to-teal-500 transition"
              size="large"
            >
              ดาวน์โหลดเฉพาะที่ค้นหา
            </Button>
          </CSVLink>

          <CSVLink
            data={getDataForCSV(tableData)}
            filename="all-data.csv"
            className="w-full"
          >
            <Button
              icon={<DownloadOutlined />}
              className="w-full rounded-lg border border-teal-500 text-teal-700 font-semibold hover:bg-teal-50 transition"
              size="large"
            >
              ดาวน์โหลดทั้งหมด
            </Button>
          </CSVLink>
        </div>
      </Modal>
    </div>
  );
};

export default TableData;
