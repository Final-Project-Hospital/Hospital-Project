import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Dropdown, Checkbox, Input, Modal, message, Select } from "antd";
import {
  DownloadOutlined,
  DownOutlined,
  FilterOutlined,
  FileExcelOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ClearOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";
import { CSVLink } from "react-csv";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import DateRangePickerWrapper from "./DateRangePickerWrapper";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
  CreateNoteBySensorDataParameterID,
  DeleteSensorDataParametersByIds,
  DeleteAllSensorDataParametersBySensorDataID,
} from "../../../../../services/hardware";
import type { ColumnsType } from "antd/es/table";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface TableDataProps {
  hardwareID: number;
  onLoaded?: () => void;
}

/** ✅ จอมือถือ */
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
};

/** ✅ จอแท็บเล็ต (iPad) 768–1300px ตามที่ระบุ */
const useIsTabletView = (min = 768, max = 1300) => {
  const [isTablet, setIsTablet] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth >= min && window.innerWidth <= max : false
  );
  useEffect(() => {
    const onResize = () => setIsTablet(window.innerWidth >= min && window.innerWidth <= max);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [min, max]);
  return isTablet;
};

/** ✅ ปลอดภัยกับเบราว์เซอร์ที่ไม่มี crypto.randomUUID() */
const generateId = () =>
  typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

/** ✅ ค่าพิเศษสำหรับ “ทั้งหมด” */
const ALL_PARAM = "__ALL__";

type RangeFilter = {
  id: string;
  param?: string;
  min?: number | null;
  max?: number | null;
};

const TableData: React.FC<TableDataProps> = ({ hardwareID, onLoaded }) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTabletView(768, 1300);

  const [tableData, setTableData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [uniqueColumns, setUniqueColumns] = useState<string[]>(["วันที่", "เวลา", "หมายเหตุ"]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["วันที่", "เวลา", "หมายเหตุ"]);
  const [paramUnits, setParamUnits] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  // ✅ การเลือกแถว + Modal ลบ (bulk)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Modal เพิ่ม/แก้ไขหมายเหตุ
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteRowIndex, setNoteRowIndex] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // ✅ Modal สำหรับ Clear Data ทั้ง “ตารางนี้”
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // ✅ เก็บ SensorDataID ทั้งหมดของ Hardware นี้ (ไม่ซ้ำ)
  const [allSensorDataIDs, setAllSensorDataIDs] = useState<number[]>([]);

  const currentYear = new Date().getFullYear();
  const defaultStart = new Date(currentYear, 0, 1);
  const defaultEnd = new Date(currentYear, 11, 31);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([defaultStart, defaultEnd]);

  /** ✅ ฟิลเตอร์ช่วงค่าหลายตัว */
  const [rangeFilters, setRangeFilters] = useState<RangeFilter[]>([]);

  // ✅ โหลดข้อมูล
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await GetSensorDataByHardwareID(hardwareID);
      if (!Array.isArray(res)) {
        setTableData([]);
        setFilteredData([]);
        setAllSensorDataIDs([]);
        setLoading(false);
        return;
      }

      const ids = Array.from(new Set((res || []).map((s: any) => Number(s.ID)).filter(Boolean)));
      setAllSensorDataIDs(ids);

      const paramDetails: any[] = [];
      for (const sensor of res) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (Array.isArray(params)) {
          params.forEach((param: any) => {
            const name = param.HardwareParameter?.Parameter;
            const value = param.Data;
            const standard = param.HardwareParameter?.StandardHardware?.MaxValueStandard ?? null;
            const minStandard = param.HardwareParameter?.StandardHardware?.MinValueStandard ?? null;
            const unit = param.HardwareParameter?.UnitHardware?.Unit ?? "";
            const note: string = param?.Note ?? "";
            const sdpId: number | undefined = param?.ID;

            let sensorDate = "ไม่ทราบวันที่";
            let rawDate = "";
            let timeString = "";

            if (param?.Date && !isNaN(new Date(param.Date).getTime())) {
              rawDate = param.Date;
              const parsedDate = dayjs(param.Date);
              sensorDate = parsedDate.format("DD/MM/YYYY");
              timeString = parsedDate.format("HH:mm:ss");
            }

            if (name) {
              paramDetails.push({
                ParameterName: name,
                วันที่: sensorDate,
                เวลา: timeString,
                rawDate,
                [name]: value,
                [`${name}_standard`]: standard,
                [`${name}_min`]: minStandard,
                [`${name}_unit`]: unit,
                [`${name}_note`]: note,
                __id: sdpId,
                Note: note,
              });
            }
          });
        }
      }

      const uniqueParams = Array.from(
        new Set(paramDetails.map((p) => p.ParameterName).filter(Boolean))
      );

      setUniqueColumns(["วันที่", "เวลา", "หมายเหตุ", ...uniqueParams]);
      setSelectedColumns(["วันที่", "เวลา", "หมายเหตุ", ...uniqueParams]);

      const unitMap: Record<string, string> = {};
      paramDetails.forEach((p) => {
        if (p.ParameterName && p[`${p.ParameterName}_unit`]) {
          unitMap[p.ParameterName] = p[`${p.ParameterName}_unit`];
        }
      });
      setParamUnits(unitMap);

      const groupedRows: Record<string, any> = {};
      paramDetails.forEach((p) => {
        const key = `${p.วันที่}-${p.เวลา}`;
        if (!groupedRows[key]) {
          groupedRows[key] = {
            __key: key,
            วันที่: p.วันที่,
            เวลา: p.เวลา,
            rawDate: p.rawDate,
            หมายเหตุ: "",
            __ids: new Set<number>(),
          };
        }

        Object.entries(p).forEach(([k, v]) => {
          if (!["ParameterName", "rawDate", "วันที่", "เวลา", "Note", "__id"].includes(k)) {
            groupedRows[key][k] = v;
          }
        });

        const noteText = typeof p.Note === "string" && p.Note.trim().length > 0 ? p.Note.trim() : "";
        if (noteText) {
          if (groupedRows[key]["หมายเหตุ"]) {
            if (!groupedRows[key]["หมายเหตุ"].includes(noteText)) {
              groupedRows[key]["หมายเหตุ"] = groupedRows[key]["หมายเหตุ"] + " | " + noteText;
            }
          } else {
            groupedRows[key]["หมายเหตุ"] = noteText;
          }
        }

        if (typeof p.__id === "number") {
          groupedRows[key].__ids.add(p.__id);
        }
      });

      const finalTableData = Object.values(groupedRows)
        .map((row: any, idx: number) => ({
          ...row,
          __ids: Array.from(row.__ids ?? []),
          __key: `${row.rawDate || row.__key}-${idx}`,
        }))
        .sort((a: any, b: any) => dayjs(b.rawDate).valueOf() - dayjs(a.rawDate).valueOf());

      setTableData(finalTableData);
      onLoaded?.();
    } catch (e) {
      console.error(e);
      message.error("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hardwareID]);

  const handleClearQuery = () => {
    setSearchText("");
    setDateRange([defaultStart, defaultEnd]);
    setSelectedColumns(uniqueColumns);
    setRangeFilters([]);
  };

  /** ✅ รายการคีย์ที่เป็นพารามิเตอร์จริง (ไม่รวม วันที่/เวลา/หมายเหตุ) */
  const numericParamKeys = useMemo(
    () => uniqueColumns.filter((c) => !["วันที่", "เวลา", "หมายเหตุ"].includes(c)),
    [uniqueColumns]
  );

  /** ✅ helper ตรวจว่าค่าอยู่ในช่วงหรือไม่ */
  const isValueInRange = (raw: any, min?: number | null, max?: number | null) => {
    const num = typeof raw === "number" ? raw : parseFloat(raw);
    if (isNaN(num)) return false;

    const hasMin = min !== null && min !== undefined && min !== 0;
    const hasMax = max !== null && max !== undefined && max !== 0;

    if (hasMin && num < (min as number)) return false;
    if (hasMax && num > (max as number)) return false;
    return hasMin || hasMax ? true : false; // ถ้าไม่มีเกณฑ์เลย ถือว่าไม่ผ่านการเช็ค (จะไปเป็น "-" ในคอลัมน์สถานะ)
  };

  /** ✅ ตรวจสอบ row ให้ผ่านเงื่อนไข range ทั้งหมด (AND) */
  const rowPassRangeFilters = (row: any) => {
    if (!rangeFilters.length) return true;
    for (const rf of rangeFilters) {
      if (!rf.param || (rf.min == null && rf.max == null)) continue;
      if (rf.param === ALL_PARAM) {
        const anyMatch = numericParamKeys.some((k) => isValueInRange(row[k], rf.min, rf.max));
        if (!anyMatch) return false;
      } else {
        if (!isValueInRange(row[rf.param], rf.min, rf.max)) return false;
      }
    }
    return true;
  };

  useEffect(() => {
    let data = tableData;

    // 1) ฟิลเตอร์วันเวลา
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

    // 2) ฟิลเตอร์ค้นหาข้อความ
    if (searchText.trim() !== "") {
      data = data.filter((item) =>
        selectedColumns.some((col) =>
          (item[col] ?? "").toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    // 3) ฟิลเตอร์ช่วงค่า (หลายเงื่อนไข AND)
    if (rangeFilters.length) {
      data = data.filter(rowPassRangeFilters);
    }

    setFilteredData(data);
  }, [searchText, tableData, selectedColumns, dateRange, rangeFilters]);

  const handleAddNote = (rowIndex: number) => {
    setNoteRowIndex(rowIndex);
    setNoteInput(filteredData[rowIndex]?.หมายเหตุ || "");
    setShowNoteModal(true);
  };

  /** ✅ บันทึกหมายเหตุ “ทุก ID” ของแถวนั้น */
  const saveNote = async () => {
    if (noteRowIndex === null) return;

    try {
      setSavingNote(true);

      // 1) อัปเดต UI ทันที (optimistic) ทั้ง filteredData และ tableData
      const updatedFiltered = [...filteredData];
      const rowKey = updatedFiltered[noteRowIndex].__key;
      const rowDate = updatedFiltered[noteRowIndex].วันที่;
      const rowTime = updatedFiltered[noteRowIndex].เวลา;
      updatedFiltered[noteRowIndex].หมายเหตุ = noteInput;
      setFilteredData(updatedFiltered);

      const updatedTable = tableData.map((r) =>
        r.วันที่ === rowDate && r.เวลา === rowTime ? { ...r, หมายเหตุ: noteInput } : r
      );
      setTableData(updatedTable);

      // 2) เรียก API กับ "ทุก ID" ของแถวนั้น
      const ids: number[] = Array.isArray(updatedFiltered[noteRowIndex].__ids)
        ? updatedFiltered[noteRowIndex].__ids
        : [];

      if (!ids.length) {
        message.warning("ไม่พบ SensorDataParameterID ในแถวนี้");
      } else {
        const results = await Promise.allSettled(
          ids.map((id) => CreateNoteBySensorDataParameterID(id, noteInput))
        );

        const success = results.filter((r) => r.status === "fulfilled" && (r as any).value).length;
        const fail = results.length - success;

        if (success > 0 && fail === 0) {
          message.success(`บันทึกหมายเหตุสำเร็จ (${success}/${results.length})`);
        } else if (success > 0 && fail > 0) {
          message.warning(`บันทึกหมายเหตุสำเร็จบางส่วน: สำเร็จ ${success}, ล้มเหลว ${fail}`);
        } else {
          message.error("บันทึกหมายเหตุไม่สำเร็จ");
        }
      }

      // 3) รีเฟรชข้อมูลให้ตรงกับ backend
      await fetchData();
    } catch (e) {
      message.error("เกิดข้อผิดพลาดระหว่างบันทึกหมายเหตุ");
    } finally {
      setSavingNote(false);
      setShowNoteModal(false);
    }
  };

  const hasNote = (row: any) =>
    typeof row?.หมายเหตุ === "string" && row.หมายเหตุ.trim().length > 0;

  // ✅ รวม IDs ของแถวที่เลือกทั้งหมด (flatten + unique)
  const collectSelectedIds = (): number[] => {
    const keySet = new Set(selectedRowKeys);
    const ids: number[] = [];
    filteredData.forEach((row) => {
      if (keySet.has(row.__key)) {
        if (Array.isArray(row.__ids)) row.__ids.forEach((id: number) => ids.push(id));
      }
    });
    return Array.from(new Set(ids));
  };

  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) return;
    setShowDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    const ids = collectSelectedIds();
    if (ids.length === 0) {
      message.warning("ไม่พบรายการสำหรับลบ");
      setShowDeleteModal(false);
      return;
    }

    try {
      setLoading(true);
      const res = await DeleteSensorDataParametersByIds(ids);
      if (res) {
        message.success(res.message || `ลบสำเร็จ ${res.deleted_ids.length} รายการ`);
        setSelectedRowKeys([]);
        await fetchData();
      } else {
        message.error("ลบข้อมูลไม่สำเร็จ");
      }
    } catch (e: any) {
      message.error(e?.message || "ลบข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // ✅ เปิด modal Clear Data ทั้งหมด
  const openClearAllModal = () => {
    if (allSensorDataIDs.length === 0) {
      message.info("ไม่มีข้อมูลให้ลบ");
      return;
    }
    setShowClearAllModal(true);
  };

  // ✅ ยืนยันลบทั้งหมดของตารางนี้
  const confirmClearAll = async () => {
    try {
      setLoading(true);
      const tasks = allSensorDataIDs.map((sid) => DeleteAllSensorDataParametersBySensorDataID(sid));
      const settled = await Promise.allSettled(tasks);

      const success = settled.filter((s) => s.status === "fulfilled").length;
      const fail = settled.length - success;

      if (success > 0 && fail === 0) {
        message.success(`ลบข้อมูลทั้งหมดสำเร็จ (${success} ชุด SensorData)`);
      } else if (success > 0 && fail > 0) {
        message.warning(`ลบบางส่วนสำเร็จ: สำเร็จ ${success}, ล้มเหลว ${fail}`);
      } else {
        message.error("ลบข้อมูลทั้งหมดไม่สำเร็จ");
      }

      setSelectedRowKeys([]);
      await fetchData();
    } catch (e: any) {
      message.error(e?.message || "ลบข้อมูลทั้งหมดไม่สำเร็จ");
    } finally {
      setLoading(false);
      setShowClearAllModal(false);
    }
  };

  /** ✅ ฟังก์ชันช่วยฟอร์แมตรูปแบบช่วงมาตรฐาน */
  const formatStdRange = (min: number | null | undefined, max: number | null | undefined) => {
    const hasMin = min !== null && min !== undefined && min !== 0;
    const hasMax = max !== null && max !== undefined && max !== 0;
    if (!hasMin && !hasMax) return "-";
    if (hasMin && hasMax) return `${min}-${max}`;
    if (hasMin) return `${min}-`;
    return `-${max}`;
  };

  /** ✅ สถานะผ่าน/ไม่ผ่าน (ตาม min/max, นับ 0 = ไม่ได้ตั้ง) */
  type PassFail = "PASS" | "FAIL" | "-";
  const judgeStatus = (rawVal: any, min?: number | null, max?: number | null): PassFail => {
    const num = typeof rawVal === "number" ? rawVal : parseFloat(rawVal);
    if (isNaN(num)) return "-";

    const hasMin = min !== null && min !== undefined && min !== 0;
    const hasMax = max !== null && max !== undefined && max !== 0;

    if (!hasMin && !hasMax) return "-";
    if (hasMin && num < (min as number)) return "FAIL";
    if (hasMax && num > (max as number)) return "FAIL";
    return "PASS";
  };

  const renderStatusTag = (status: PassFail) => {
    if (status === "PASS") {
      return (
        <div className="flex items-center gap-2 text-green-500 font-medium">
          <CheckCircleFilled />
          <span>ผ่านเกณฑ์มาตรฐาน</span>
        </div>
      );
    }
    if (status === "FAIL") {
      return (
        <div className="flex items-center gap-2 text-red-500 font-medium">
          <CloseCircleFilled />
          <span>ไม่ผ่านเกณฑ์มาตรฐาน</span>
        </div>
      );
    }
    return <span>-</span>;
  };

  /** ✅ Columns: ใส่ “มาตรฐาน” และ “สถานะ” ถัดจากทุกคอลัมน์พารามิเตอร์ */
  // ตั้งความกว้างให้เหมาะกับอุปกรณ์
  const minColWidth = isMobile ? 110 : isTablet ? 130 : 160;
  const stdColWidth = isMobile ? 100 : isTablet ? 120 : 140;
  const statusColWidth = isMobile ? 160 : isTablet ? 180 : 220;

  const columns: ColumnsType<any> = [
    {
      title: (
        <span className="col-title bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-bold">
          ลำดับ
        </span>
      ),
      dataIndex: "ลำดับ",
      key: "ลำดับ",
      render: (_: any, __: any, idx: number) => idx + 1,
      width: 70,
      fixed: !isMobile && !isTablet ? "left" : undefined,
      ellipsis: true,
    },
    ...uniqueColumns
      .filter((col) => selectedColumns.includes(col))
      .flatMap((col) => {
        // คอลัมน์ฐาน (วันที่/เวลา/หมายเหตุ)
        if (["วันที่", "เวลา", "หมายเหตุ"].includes(col)) {
          const baseCol: any = {
            title: (
              <span className="col-title bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-bold">
                {col}
              </span>
            ),
            dataIndex: col,
            key: col,
            width: minColWidth,
            ellipsis: true,
            render: (val: any) => (col === "หมายเหตุ" ? val || "-" : val),
          };
          return [baseCol];
        }

        // พารามิเตอร์จริง
        const displayTitle = paramUnits[col] ? `${col} (${paramUnits[col]})` : col;

        const valueCol: any = {
          title: (
            <span className="col-title bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-bold">
              {displayTitle}
            </span>
          ),
          dataIndex: col,
          key: col,
          width: minColWidth,
          ellipsis: true,
          render: (val: any, row: any) => {
            const standardMax = row[`${col}_standard`];
            const standardMin = row[`${col}_min`];
            const num = typeof val === "number" ? val : parseFloat(val);

            if (!isNaN(num) && (standardMax !== null || standardMin !== null)) {
              if (standardMax !== null && standardMax !== 0 && num > standardMax) {
                return <span style={{ color: "red", fontWeight: "bold" }}>{num.toFixed(2)}</span>;
              } else if (standardMax !== null && standardMax !== 0 && num >= standardMax * 0.9) {
                return <span style={{ color: "orange", fontWeight: "bold" }}>{num.toFixed(2)}</span>;
              } else if (standardMin !== null && standardMin !== 0 && num < standardMin) {
                return <span style={{ color: "goldenrod", fontWeight: "bold" }}>{num.toFixed(2)}</span>;
              } else {
                return !isNaN(num) ? num.toFixed(2) : val ?? "-";
              }
            }
            if (!isNaN(num)) return num.toFixed(2);
            return val ?? "-";
          },
        };

        const stdColKey = `${col}_STD_COL`;
        const stdCol: any = {
          title: (
            <span className="col-title bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-bold">
              มาตรฐาน
            </span>
          ),
          key: stdColKey,
          dataIndex: stdColKey,
          width: stdColWidth,
          ellipsis: true,
          render: (_: any, row: any) => {
            const min = row[`${col}_min`];
            const max = row[`${col}_standard`];
            return formatStdRange(min, max);
          },
        };

        const statusColKey = `${col}_STATUS_COL`;
        const statusCol: any = {
          title: (
            <span className="col-title bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-bold">
              สถานะ
            </span>
          ),
          key: statusColKey,
          dataIndex: statusColKey,
          width: statusColWidth,
          ellipsis: true,
          render: (_: any, row: any) => {
            const val = row[col];
            const min = row[`${col}_min`];
            const max = row[`${col}_standard`];
            const status = judgeStatus(val, min, max);
            return renderStatusTag(status);
          },
        };

        // เรียงเป็น: ค่า → มาตรฐาน → สถานะ
        return [valueCol, stdCol, statusCol];
      }),
    {
      title: (
        <span className="col-title bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-bold">
          Action
        </span>
      ),
      key: "action",
      width: isMobile ? 120 : isTablet ? 150 : 170,
      fixed: !isMobile && !isTablet ? "right" : undefined,
      ellipsis: true,
      render: (_: any, row: any, idx: number) => {
        const isEdit = hasNote(row);
        return (
          <Button
            icon={<EditOutlined />}
            onClick={() => handleAddNote(idx)}
            size={isMobile ? "middle" : "large"}
            type={isEdit ? "default" : "primary"}
            style={{
              background: isEdit
                ? "linear-gradient(90deg, #20c997, #0d9488)"
                : "linear-gradient(90deg, #14b8a6, #0f766e)",
              color: "#fff",
              fontSize: isMobile || isTablet ? 12 : 14,
              fontWeight: 700,
              padding: isMobile || isTablet ? "4px 10px" : "1px 8px",
              width: isMobile ? "100%" : "100%",
            }}
          >
            {isEdit ? "แก้ไขหมายเหตุ" : "เพิ่มหมายเหตุ"}
          </Button>
        );
      },
    },
  ];

  /** ✅ CSV: ใส่คอลัมน์ Standard และ สถานะ ต่อท้ายพารามิเตอร์ด้วย */
  const getDataForCSV = (data: any[], columnsToInclude: string[]) => {
    return data.map((row: any, idx: number) => {
      const result: any = { ลำดับ: `${idx + 1}\t` };

      columnsToInclude.forEach((col) => {
        if (col === "วันที่") {
          result["วัน/เดือน/ปี"] = row[col] ? `${row[col]}\t` : "-";
        } else if (col === "เวลา") {
          result["เวลา"] = row[col] ? `${row[col]}\t` : "-";
        } else if (col === "หมายเหตุ") {
          result["หมายเหตุ"] = row[col] ? `${row[col]}\t` : "-";
        } else {
          const unit = paramUnits[col];
          const displayKey = unit ? `${col} (${unit})` : col;
          const rawVal = row[col];
          const num = typeof rawVal === "number" ? rawVal : parseFloat(rawVal);
          const valFormatted =
            !isNaN(num) && rawVal !== null && rawVal !== undefined ? `${num.toFixed(2)}\t` : "-";
          result[displayKey] = valFormatted;

          const min = row[`${col}_min`];
          const max = row[`${col}_standard`];
          const stdKey = `มาตรฐาน ${displayKey}`;
          result[stdKey] = `${formatStdRange(min, max)}\t`;

          const statusKey = `สถานะ ${displayKey}`;
          const pf = judgeStatus(rawVal, min, max);
          const pfText =
            pf === "PASS" ? "ผ่านเกณฑ์มาตรฐาน" : pf === "FAIL" ? "ไม่ผ่านเกณฑ์มาตรฐาน" : "-";
          result[statusKey] = `${pfText}\t`;
        }
      });

      return result;
    });
  };

  const filteredCSVData = useMemo(() => {
    const sorted = [...filteredData].sort(
      (a, b) => dayjs(a.rawDate).valueOf() - dayjs(b.rawDate).valueOf()
    );
    return getDataForCSV(sorted, selectedColumns);
  }, [filteredData, selectedColumns]);

  /** ✅ รายการคอลัมน์พารามิเตอร์ (ตัดวันที่/เวลา/หมายเหตุ) — แสดงครบทุกตัว + “ทั้งหมด” */
  const parameterOptions = useMemo(() => {
    const items = uniqueColumns
      .filter((c) => !["วันที่", "เวลา", "หมายเหตุ"].includes(c))
      .map((c) => ({
        label: paramUnits[c] ? `${c} (${paramUnits[c]})` : c,
        value: c,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "th"));
    return [{ label: "ทั้งหมด", value: ALL_PARAM }, ...items];
  }, [uniqueColumns, paramUnits]);

  // แปลงค่าเป็น number|null แบบปลอดภัย
  const toNumOrNull = (v: string | number | null) =>
    v === null || v === "" ? null : typeof v === "number" ? v : isNaN(parseFloat(v)) ? null : parseFloat(v);

  // อนุญาตเฉพาะตัวเลข, จุดทศนิยม, และเครื่องหมายลบข้างหน้า
  const sanitizeNumeric = (s: string) =>
    s.replace(/[^\d.\-]/g, "").replace(/(?!^)-/g, "").replace(/(\..*)\./g, "$1");

  /** ✅ UI เลือกช่วงค่า (หลายเงื่อนไข) */
  const RangeFilterRow: React.FC<{ rf: RangeFilter }> = ({ rf }) => {
    const [minText, setMinText] = useState(rf.min != null ? String(rf.min) : "");
    const [maxText, setMaxText] = useState(rf.max != null ? String(rf.max) : "");

    useEffect(() => {
      setMinText(rf.min != null ? String(rf.min) : "");
      setMaxText(rf.max != null ? String(rf.max) : "");
    }, [rf.id]);

    const onChange = (patch: Partial<RangeFilter>) => {
      setRangeFilters((prev) => prev.map((x) => (x.id === rf.id ? { ...x, ...patch } : x)));
    };

    const remove = () => setRangeFilters((prev) => prev.filter((x) => x.id !== rf.id));

    return (
      <div className="w-full grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        <div className="sm:col-span-5">
          <Select
            options={parameterOptions}
            placeholder="เลือกพารามิเตอร์"
            value={rf.param}
            onChange={(v) => onChange({ param: v })}
            className="w-full"
            allowClear
            showSearch
            optionFilterProp="label"
            getPopupContainer={() => document.body}
            virtual={!isMobile && !isTablet}
            dropdownMatchSelectWidth={false}
            listHeight={260}
          />
        </div>

        <div className="sm:col-span-3">
          <Input
            placeholder="Min"
            value={minText}
            inputMode="decimal"
            onChange={(e) => setMinText(sanitizeNumeric(e.target.value))}
            onBlur={() => onChange({ min: toNumOrNull(minText) })}
            onPressEnter={() => onChange({ min: toNumOrNull(minText) })}
          />
        </div>

        <div className="sm:col-span-3">
          <Input
            placeholder="Max"
            value={maxText}
            inputMode="decimal"
            onChange={(e) => setMaxText(sanitizeNumeric(e.target.value))}
            onBlur={() => onChange({ max: toNumOrNull(maxText) })}
            onPressEnter={() => onChange({ max: toNumOrNull(maxText) })}
          />
        </div>

        <div className="sm:col-span-1 flex justify-end">
          <Button danger onClick={remove}>
            ลบ
          </Button>
        </div>
      </div>
    );
  };

  const addRangeFilter = () =>
    setRangeFilters((prev) => [
      ...prev,
      {
        id: generateId(),
        param: ALL_PARAM,
        min: null,
        max: null,
      },
    ]);

  const clearRangeFilters = () => setRangeFilters([]);

  const columnSelectMenu = (
    <div className="bg-white rounded-lg shadow-md p-4 w-56">
      <h4 className="text-gray-800 font-semibold mb-2">เลือกคอลัมน์ที่ต้องการแสดง</h4>
      <Checkbox.Group
        value={selectedColumns}
        onChange={(vals) =>
          setSelectedColumns(vals.length ? (vals as string[]) : ["วันที่", "เวลา", "หมายเหตุ"])
        }
      >
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {uniqueColumns.map((col) => (
            <Checkbox value={col} key={col} className="hover:bg-teal-50 px-2 py-1 rounded">
              <span className="text-gray-700">
                {["วันที่", "เวลา", "หมายเหตุ"].includes(col)
                  ? col
                  : paramUnits[col]
                  ? `${col} (${paramUnits[col]})`
                  : col}
              </span>
            </Checkbox>
          ))}
        </div>
      </Checkbox.Group>
    </div>
  );

  const modalTitle =
    noteRowIndex !== null && hasNote(filteredData[noteRowIndex]) ? "แก้ไขหมายเหตุ" : "เพิ่มหมายเหตุ";

  return (
    <div className="w-full mt-6 table-wrap">
      <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-4 md:p-6">
        {/* Top controls */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-start mb-4 w-full">
          {/* Search */}
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

          {/* Date range */}
          <div className="w-full lg:w-[300px]">
            <DateRangePickerWrapper
              value={dateRange}
              onChange={(val) => setDateRange(val ? [val[0], val[1]] : [null, null])}
            />
          </div>

          {/* Column selector */}
          <Dropdown overlay={columnSelectMenu} trigger={["click"]} placement="bottomRight" arrow>
            <Button icon={<FilterOutlined />} className="font-semibold w-full md:w-[120px]">
              คอลัมน์ <DownOutlined />
            </Button>
          </Dropdown>

          {/* Clear filters */}
          <Button
            onClick={handleClearQuery}
            className="w-full md:w-[160px] text-teal-700 border border-teal-500 hover:bg-teal-50 transition font-semibold"
          >
            ล้างตัวกรองทั้งหมด
          </Button>

          {/* Export CSV */}
          <Button
            icon={<DownloadOutlined />}
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center justify-center gap-2 w-full md:w-auto rounded-full text-white border-none shadow font-semibold transition duration-300 ease-in-out bg-gradient-to-r from-teal-500 to-cyan-500"
            style={{ minWidth: 140 }}
          >
            Export CSV
          </Button>

          {/* Delete selected */}
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteSelected}
              disabled={loading}
              className="w-full md:w-auto"
            >
              ลบที่เลือก ({selectedRowKeys.length})
            </Button>
          )}

          <div className="flex-1" />

          {/* Clear Data */}
          <Button
            icon={<ClearOutlined />}
            onClick={openClearAllModal}
            disabled={loading || allSensorDataIDs.length === 0}
            className="w-full md:w-auto ml-auto bg-red-500 hover:bg-red-600 text-white font-bold border-none"
          >
            Clear Data
          </Button>
        </div>

        {/* 🔎 Range Filters */}
        <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3 sm:p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h3 className="text-teal-800 font-semibold">
              ค้นหาช่วงค่า (Range Filter){rangeFilters.length ? ` : ${rangeFilters.length} เงื่อนไข` : ""}
            </h3>
            <div className="flex gap-2">
              <Button type="dashed" onClick={addRangeFilter}>
                + เพิ่มช่วงค่า
              </Button>
              {rangeFilters.length > 0 && <Button onClick={clearRangeFilters}>ล้างช่วงค่า</Button>}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {rangeFilters.length === 0 ? (
              <div className="text-gray-600 text-sm">ยังไม่มีเงื่อนไขช่วงค่า กด “เพิ่มช่วงค่า” เพื่อเริ่มต้น</div>
            ) : (
              rangeFilters.map((rf) => <RangeFilterRow key={rf.id} rf={rf} />)
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="__key"
            loading={loading}
            tableLayout="fixed"
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],
              position: ["bottomCenter"],
              onShowSizeChange: (_, size) => setPageSize(size),
              responsive: true,
            }}
            scroll={{ x: true }}
            className="rounded-2xl [&_.ant-table-cell]:!align-middle"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              preserveSelectedRowKeys: true,
              getCheckboxProps: () => ({ disabled: loading }),
            }}
            size={isMobile ? "small" : "middle"}
          />
        </div>
      </div>

      {/* Modal Export CSV */}
      <Modal open={showDownloadModal} onCancel={() => setShowDownloadModal(false)} footer={null} centered>
        <div className="flex flex-col items-center justify-center gap-4 py-6 px-4 text-center">
          <FileExcelOutlined style={{ fontSize: 48, color: "#14b8a6" }} />
          <h2 className="text-lg font-bold text-gray-700">ยืนยันการโหลดข้อมูล</h2>

          <CSVLink
            data={filteredData.length ? filteredCSVData : []}
            filename="filtered-data.csv"
            className="w-full"
            separator=","
          >
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold shadow hover:from-cyan-500 hover:to-teal-500 transition"
              size="large"
              disabled={filteredData.length === 0}
            >
              ยืนยันการโหลดข้อมูล
            </Button>
          </CSVLink>
        </div>
      </Modal>

      {/* Modal เพิ่ม/แก้ไขหมายเหตุ */}
      <Modal
        open={showNoteModal}
        onCancel={() => setShowNoteModal(false)}
        onOk={saveNote}
        okText="บันทึก"
        cancelText="ยกเลิก"
        centered
        confirmLoading={savingNote}
        title={modalTitle}
      >
        <Input.TextArea
          rows={4}
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="กรอกหมายเหตุที่นี่..."
        />
      </Modal>

      {/* Modal ยืนยันลบที่เลือก */}
      <Modal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        footer={null}
        centered
        title={null}
        bodyStyle={{ padding: 0 }}
      >
        <div className="rounded-lg p-6 bg-white">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-3 rounded-full mb-3 shadow-sm">
              <DeleteOutlined className="text-red-500 text-2xl" />
            </div>
            <h2 className="text-lg text-red-600 font-medium">ยืนยันการลบข้อมูลที่เลือก</h2>
            <p className="text-sm text-gray-700 mt-1 mb-3">
              คุณแน่ใจหรือไม่ว่าต้องการลบทั้งหมด{" "}
              <span className="text-red-500">{selectedRowKeys.length}</span> แถว?
            </p>

            <ul className="bg-gray-50 border border-gray-200 rounded-md max-h-40 overflow-y-auto px-4 py-2 text-left w-full text-sm text-gray-700 list-disc list-inside">
              {filteredData
                .filter((r) => selectedRowKeys.includes(r.__key))
                .map((r) => (
                  <li key={r.__key}>{`${r.วันที่} ${r.เวลา}`}</li>
                ))}
            </ul>

            <p className="text-xs text-gray-500 mt-3">การลบนี้ไม่สามารถย้อนกลับได้</p>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <Button onClick={() => setShowDeleteModal(false)} className="rounded-md">
              ยกเลิก
            </Button>
            <Button
              type="primary"
              danger
              onClick={confirmBulkDelete}
              className="bg-red-400 hover:bg-red-500 text-white font-semibold rounded-md border-none"
              disabled={loading}
            >
              ลบ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal ยืนยัน Clear Data ทั้งตาราง */}
      <Modal
        open={showClearAllModal}
        onCancel={() => setShowClearAllModal(false)}
        centered
        onOk={confirmClearAll}
        okText="Clear Data"
        cancelText="ยกเลิก"
        confirmLoading={loading}
        title="ยืนยันการลบข้อมูลทั้งหมดของตารางนี้"
      >
        <div className="text-sm text-gray-700">
          {allSensorDataIDs.length > 0 ? (
            <>
              คุณต้องการลบ <b>SensorDataParameter ทั้งหมด</b> ของ Hardware นี้หรือไม่?
              <div className="mt-2">
                จะทำการลบสำหรับ <b>{allSensorDataIDs.length}</b> รายการ SensorData ที่เกี่ยวข้อง
              </div>
              <div className="mt-2 text-xs text-red-500">การลบนี้ไม่สามารถย้อนกลับได้</div>
            </>
          ) : (
            "ไม่พบ SensorData สำหรับลบ"
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TableData;
