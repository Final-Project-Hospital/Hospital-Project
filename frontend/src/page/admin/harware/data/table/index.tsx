import React, { useEffect, useState } from "react";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID
} from "../../../../../services/hardware";
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Dialog,
} from "@mui/material";
import { CSVLink } from "react-csv";

interface TableDataProps {
  hardwareID: number;
}

const TableData: React.FC<TableDataProps> = ({ hardwareID }) => {
  const [sensorParameters, setSensorParameters] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["Date"]);
  const [searchText, setSearchText] = useState<string>("");
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [downloadFilename, setDownloadFilename] = useState("sensor-data.csv");
  const [downloadNow, setDownloadNow] = useState(false);
  const [allCsvData, setAllCsvData] = useState<any[]>([]);

  // Dynamic columns จากข้อมูลจริง (รวม "Date" เสมอ)
  const [uniqueParameterNames, setUniqueParameterNames] = useState<string[]>(["Date"]);
  //@ts-ignore
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleColumnChange = (event: any) => {
    const { target: { value } } = event;
    setSelectedColumns(typeof value === "string" ? value.split(",") : value);
  };

  const getDataForCSV = (data: any[]) => {
    return data.map((param, index) => {
      const row: any = { No: index + 1 };
      row["Date"] = param.Date ?? "-";
      selectedColumns.forEach(col => {
        if (col !== "Date") {
          row[col] = param[col] ?? "-";
        }
      });
      return row;
    });
  };

  const filteredData = sensorParameters.filter((item) =>
    selectedColumns.some(col =>
      col === "Date"
        ? item.Date?.toString().toLowerCase().includes(searchText.toLowerCase())
        : item[col]?.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  useEffect(() => {
    setAllCsvData(getDataForCSV(sensorParameters));
  }, [sensorParameters, selectedColumns]);

  useEffect(() => {
    const fetchSensorData = async () => {
      if (!hardwareID) return;

      const res = await GetSensorDataByHardwareID(hardwareID);
      if (!Array.isArray(res)) return;

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

      // ดึง ParameterName ไม่ซ้ำ
      const uniqueParams = Array.from(
        new Set(paramDetails.map(p => p.ParameterName).filter(Boolean))
      );

      // รวมข้อมูลแถวโดยใช้ Date เป็น key
      const groupedRows: Record<string, any> = {};

      paramDetails.forEach(p => {
        const date = p.Date;

        if (!groupedRows[date]) {
          groupedRows[date] = { Date: date };
        }

        groupedRows[date] = { ...groupedRows[date], ...p };
        delete groupedRows[date].ParameterName;
      });

      const finalTableData = Object.values(groupedRows);

      setSensorParameters(finalTableData);

      // ตั้งชื่อคอลัมน์แบบ dynamic รวม Date เสมอ
      setUniqueParameterNames(["Date", ...uniqueParams]);
      // ตั้ง selectedColumns default ให้แสดงทั้งหมดตอนโหลดครั้งแรก
      setSelectedColumns(["Date", ...uniqueParams]);
    };

    fetchSensorData();
  }, [hardwareID]);

  useEffect(() => {
    if (downloadNow) {
      document.getElementById("hiddenCSVDownloader")?.click();
      setDownloadNow(false);
    }
  }, [downloadNow]);

  const handleDownloadFiltered = () => {
    setCsvData(getDataForCSV(filteredData));
    setDownloadFilename("sensor-data-filtered.csv");
    setOpenDownloadDialog(false);
    setDownloadNow(true);
  };

  const handleDownloadAll = () => {
    setCsvData(allCsvData);
    setDownloadFilename("sensor-data-all.csv");
    setOpenDownloadDialog(false);
    setDownloadNow(true);
  };

  return (
    <>
      <div className="card my-5 shadow-md sm:rounded-lg bg-white border-[hsla(0,0%,0%,0)] px-3 py-3">
        <div className="flex items-center justify-between px-3 py-2">
          <h2 className="text-[18px] font-[700]">Recent Sensor Data</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search..."
              className="border rounded-md p-1"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button className="btn-blue !capitalize" onClick={() => setOpenDownloadDialog(true)}>
              Download CSV
            </Button>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="select-columns-label">Show Columns</InputLabel>
              <Select
                labelId="select-columns-label"
                multiple
                value={selectedColumns}
                onChange={handleColumnChange}
                label="Show Columns"
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {uniqueParameterNames.map((col) => (
                  <MenuItem key={col} value={col}>
                    <Checkbox checked={selectedColumns.indexOf(col) > -1} />
                    <ListItemText primary={col} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>No</strong></TableCell>
                  {uniqueParameterNames.map((col) =>
                    selectedColumns.includes(col) ? (
                      <TableCell key={col}><strong>{col}</strong></TableCell>
                    ) : null
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    {uniqueParameterNames.map((col) =>
                      selectedColumns.includes(col) ? (
                        <TableCell key={col}>{item[col] ?? "-"}</TableCell>
                      ) : null
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 25, 50, 100]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </div>

      <Dialog open={openDownloadDialog} onClose={() => setOpenDownloadDialog(false)}>
        <Paper className="p-5">
          <h2 className="text-lg font-semibold mb-4">Download CSV</h2>
          <p className="mb-4">ต้องการดาวน์โหลดเฉพาะคอลัมน์ที่เลือก และข้อมูลที่ค้นหา หรือ ดาวน์โหลดข้อมูลทั้งหมด?</p>
          <div className="flex justify-end gap-2">
            <Button variant="contained" onClick={handleDownloadFiltered}>
              Download Filtered
            </Button>
            <Button variant="outlined" onClick={handleDownloadAll}>
              Download All
            </Button>
          </div>
        </Paper>
      </Dialog>

      {/* Hidden CSV download trigger */}
      {downloadNow && (
        <CSVLink
          id="hiddenCSVDownloader"
          data={csvData}
          filename={downloadFilename}
          className="hidden"
          target="_blank"
        />
      )}
    </>
  );
};

export default TableData;
