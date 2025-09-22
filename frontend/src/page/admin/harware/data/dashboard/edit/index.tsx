// 📁 EditParameterModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Button,
  message,
  Spin,
  Image,
  Switch,
  Tooltip,
  Tag,
  Select,
  Popover,
} from "antd";
import {
  UpdateHardwareParameterByID,
  ListHardwareParameterByHardwareID,
  UpdateGroupDisplay, // ✅ ใช้ตัวนี้ยิง group_display + index + right พร้อมกัน
  UpdateLayoutDisplay,
  ListDataGraph, // ✅ ดึง "กราฟทั้งหมด" จาก backend
  AttachColorToHardwareParameter
} from "../../../../../../services/hardware";
import { ColorPicker } from "antd";
import LineChartingImg from "../../../../../../assets/chart/LineCharting.png";
import AreaChartingImg from "../../../../../../assets/chart/AreaCharting.png";
import BarChartingImg from "../../../../../../assets/chart/Mapping.png"; // ✅ ใช้ภาพเดิม (Mapping.png) แต่เปลี่ยนชื่อเป็น Bar
import StackChartingImg from "../../../../../../assets/chart/StackCharting.png";
import "./ColorSelectNoArrow.css";

interface EditParameterModalProps {
  open: boolean;
  onClose: () => void;
  hardwareID: number;
  onSuccess?: () => Promise<void>;
}

type SlotMode = "single" | "split";

type CellGraph = {
  graphTypeId: number | null; // 1..4
  graphInstanceUid?: string | null;
  paramIds: number[];
};
type Slot = { mode: SlotMode; graphs: (CellGraph | null)[] };

type ParamRow = {
  ID: number;
  Parameter: string;
  GroupDisplay: boolean;
  LayoutDisplay: boolean;
  HardwareGraphID?: number; // 1..4
  HardwareParameterColorID?: number;
  HardwareParameterColorCode?: string;
  Index?: number; // ✅ index ปัจจุบันจาก backend
  Right?: boolean; // ✅ right ปัจจุบันจาก backend (ถ้ามี)
};

type DataGraph = { ID: number; Graph: string };

// ประเภทกราฟ
const graphTypes = [
  { id: 1, name: "กราฟ Line", img: LineChartingImg },
  { id: 2, name: "กราฟ Area", img: AreaChartingImg },
  { id: 3, name: "กราฟ Bar", img: BarChartingImg }, // ✅ เปลี่ยนเป็น Bar
  { id: 4, name: "กราฟ Stacked", img: StackChartingImg },
];

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

type GraphInstance = { uid: string; graphTypeId: number; name: string };
//const uid = () => Math.random().toString(36).slice(2, 9);

// ✅ hook ตรวจขนาดหน้าจอ
const useViewportFlags = () => {
  const get = () => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1440;
    const isMobile = w < 768;
    const isTablet = w >= 768 && w <= 1280;
    return { isMobile, isTablet, isCompact: isMobile || isTablet, width: w };
  };
  const [state, setState] = useState(get());
  useEffect(() => {
    const onResize = () => setState(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return state;
};

// ✅ map ชื่อกราฟ (จาก backend) -> ชนิดกราฟ 1..4
const graphNameToTypeId = (name?: string): number => {
  const n = (name || "").toLowerCase();
  if (n.includes("stack")) return 4;
  if (n.includes("bar") || n.includes("mapping") || n.includes("color")) return 3; // ✅ รองรับทั้ง "Bar" และเดิม "Mapping/Color"
  if (n.includes("area")) return 2;
  if (n.includes("line")) return 1;
  // fallback: พยายามเทียบชื่อไทย
  if (n.includes("เส้น")) return 1;
  if (n.includes("พื้นที่")) return 2;
  if (n.includes("แท่ง") || n.includes("บาร์") || n.includes("แม็ป") || n.includes("แมป") || n.includes("สี")) return 3; // ✅ เพิ่มคำไทยของ Bar
  if (n.includes("ซ้อน") || n.includes("สแตก")) return 4;
  return 1;
};

const EditParameterModal: React.FC<EditParameterModalProps> = ({
  open,
  onClose,
  hardwareID,
  onSuccess,
}) => {
  // const { isMobile, isTablet, isCompact } = useViewportFlags();
  const { isCompact } = useViewportFlags();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<ParamRow[]>([]);
  const [initialValues, setInitialValues] = useState<ParamRow[]>([]);
  const [employeeid, setEmployeeid] = useState<number>(
    Number(localStorage.getItem("employeeid")) || 0
  );

  // ---- Drag state (Desktop เท่านั้น)
  const [draggedParamId, setDraggedParamId] = useState<number | null>(null);
  const [draggedGraphInstance, setDraggedGraphInstance] = useState<{
    uid: string;
    graphTypeId: number;
  } | null>(null);
  const [dragOverSlot, setDragOverSlot] =
    useState<{ slot: number; sub: number | null } | null>(null);

  // ---- Layout
  const [slots, setSlots] = useState<Slot[]>([{ mode: "single", graphs: [null] }]);
  const [layoutDirty, setLayoutDirty] = useState(false);

  // ---- Graph Instances (มาจาก BACKEND: ListDataGraph)
  const [instances, setInstances] = useState<GraphInstance[]>([]);

  // ---- Compact Color Editor (Mobile/iPad)
  const [colorEditPid, setColorEditPid] = useState<number | null>(null);
  const [colorTemp, setColorTemp] = useState<string>("#000000");

  // ---------- helpers ----------
  const graphMeta = (typeId: number | null | undefined) =>
    graphTypes.find((g) => g.id === (typeId ?? 0));

  const getInstanceByUid = (u?: string | null) => instances.find((it) => it.uid === u);

  const handleChange = (id: number, field: keyof ParamRow, value: any) => {
    setFormValues((prev) => prev.map((it) => (it.ID === id ? { ...it, [field]: value } : it)));
  };

  const getParamName = (id: number) => formValues.find((x) => x.ID === id)?.Parameter ?? `#${id}`;

  const getParamColorCode = (id: number): string | undefined =>
    formValues.find((x) => x.ID === id)?.HardwareParameterColorCode;

  const buildInitialSlots = (): Slot[] => [{ mode: "single", graphs: [null] }];

  // ---------- per-graph constraints ----------
  const hasOtherCellWithTwoOrMore = (
    graphTypeId: number,
    except?: { slotIdx: number; subIdx: number }
  ) => {
    for (let si = 0; si < slots.length; si++) {
      const sl = slots[si];
      for (let ci = 0; ci < sl.graphs.length; ci++) {
        const cg = sl.graphs[ci];
        if (!cg) continue;
        if (except && si === except.slotIdx && ci === except.subIdx) continue;
        if (cg.graphTypeId === graphTypeId && (cg.paramIds?.length ?? 0) >= 2) {
          return true;
        }
      }
    }
    return false;
  };

  // ---------- helper: สร้าง instances จาก ListDataGraph (ไม่ซ้ำชื่อ) ----------
  const buildInstancesFromGraphs = (graphs: DataGraph[]): GraphInstance[] => {
    const seen = new Set<string>();
    const list: GraphInstance[] = [];
    for (const g of graphs || []) {
      const name = String(g.Graph ?? "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue; // ❌ กันชื่อซ้ำ
      seen.add(key);
      const typeId = graphNameToTypeId(name);
      list.push({
        uid: `graph-${g.ID}`, // ทำให้คงที่ต่อเนื่อง
        graphTypeId: typeId,
        name,
      });
    }
    return list;
  };

  // ---------- helper: เลือก instance uid ที่ชนิดตรงกับ typeId (หรือ null) ----------
  const pickInstanceUidForType = (typeId: number, insts: GraphInstance[]): string | null => {
    const found = insts.find((it) => it.graphTypeId === typeId);
    return found ? found.uid : null;
  };

  // ---------- สร้างเลย์เอาต์จาก BACKEND + ผูก instance ที่ตรงชนิด ----------
  const buildLayoutFromBackend = (rows: ParamRow[], insts: GraphInstance[]) => {
    if (!rows || rows.length === 0) {
      return { slots: buildInitialSlots(), splitSet: new Set<number>() };
    }

    const indexes = Array.from(
      new Set(rows.map((r) => (typeof r.Index === "number" && r.Index! > 0 ? r.Index! : 1)))
    ).sort((a, b) => a - b);

    const newSlots: Slot[] = [];
    const splitParamIds = new Set<number>();

    indexes.forEach((rowIndex) => {
      const paramsInRow = rows.filter(
        (r) => (typeof r.Index === "number" && r.Index === rowIndex) || (r.Index == null && rowIndex === 1)
      );

      const leftParams = paramsInRow.filter((p) => p.Right === false).map((p) => p.ID);
      const rightParams = paramsInRow
        .filter((p) => p.Right === true || p.Right == null)
        .map((p) => p.ID);

      const isSplit = leftParams.length > 0 && rightParams.length > 0;

      if (isSplit) {
        const leftType = rows.find((r) => r.ID === leftParams[0])?.HardwareGraphID ?? 1;
        const rightType = rows.find((r) => r.ID === rightParams[0])?.HardwareGraphID ?? 1;

        const leftUid = pickInstanceUidForType(leftType, insts);
        const rightUid = pickInstanceUidForType(rightType, insts);

        const leftCell: CellGraph | null =
          leftParams.length > 0
            ? { graphTypeId: leftType, graphInstanceUid: leftUid, paramIds: leftParams }
            : null;
        const rightCell: CellGraph | null =
          rightParams.length > 0
            ? { graphTypeId: rightType, graphInstanceUid: rightUid, paramIds: rightParams }
            : null;

        leftParams.forEach((id) => splitParamIds.add(id));
        rightParams.forEach((id) => splitParamIds.add(id));

        newSlots.push({ mode: "split", graphs: [leftCell, rightCell] });
      } else {
        const allIds = paramsInRow.map((p) => p.ID);
        const cellType = rows.find((r) => r.ID === allIds[0])?.HardwareGraphID ?? 1;
        const uidForType = pickInstanceUidForType(cellType, insts);
        const cell: CellGraph | null =
          allIds.length > 0
            ? { graphTypeId: cellType, graphInstanceUid: uidForType, paramIds: allIds }
            : null;

        newSlots.push({ mode: "single", graphs: [cell] });
      }
    });

    return { slots: newSlots, splitSet: splitParamIds };
  };

  useEffect(() => {
    setEmployeeid(Number(localStorage.getItem("employeeid")));
    if (!open || !hardwareID) return;

    setLoading(true);
    Promise.all([
      ListHardwareParameterByHardwareID(hardwareID),
      ListDataGraph(), // ✅ ดึงรายการ "กราฟทั้งหมด"
    ])
      .then(([params, graphList]) => {
        // ----- กราฟทั้งหมด -----
        const insts = buildInstancesFromGraphs((graphList as DataGraph[]) || []);
        setInstances(insts);

        // ----- พารามิเตอร์ -----
        if (!params) {
          setFormValues([]);
          setInitialValues([]);
          setSlots(buildInitialSlots());
          setLayoutDirty(false);
          return;
        }

        const rows: ParamRow[] = (params as any[]).map((p: any) => ({
          ID: p.ID,
          Parameter: p.Parameter,
          GroupDisplay: p.GroupDisplay,
          LayoutDisplay: p.LayoutDisplay,
          HardwareGraphID: p.HardwareGraph?.ID,
          HardwareParameterColorID: p.HardwareParameterColor?.ID,
          HardwareParameterColorCode: p.HardwareParameterColor?.Code,
          Index: p.Index,
          Right: p.Right,
        }));

        setFormValues(rows);
        setInitialValues(deepClone(rows));

        // ✅ สร้างเลย์เอาต์จาก BACKEND + ผูก instance ตามชนิด
        const { slots: s, splitSet } = buildLayoutFromBackend(rows, insts);
        setSlots(s);

        // ✅ LayoutDisplay = true เฉพาะพารามิเตอร์ที่อยู่ในแถว split
        setFormValues((prev) =>
          prev.map((p) =>
            splitSet.has(p.ID) ? { ...p, LayoutDisplay: true } : { ...p, LayoutDisplay: false }
          )
        );

        setLayoutDirty(false);
      })
      .finally(() => setLoading(false));
  }, [open, hardwareID]);

  // ---------- ตรวจจับการแก้ไข ----------
  const hasUnsavedChanges = useMemo(() => {
    if (initialValues.length !== formValues.length) return true;
    const byId = new Map(initialValues.map((p) => [p.ID, p]));
    for (const cur of formValues) {
      const old = byId.get(cur.ID);
      if (!old) return true;
      if (
        old.GroupDisplay !== cur.GroupDisplay ||
        old.LayoutDisplay !== cur.LayoutDisplay ||
        old.HardwareGraphID !== cur.HardwareGraphID ||
        old.HardwareParameterColorCode !== cur.HardwareParameterColorCode
        // Note: Index/Right เปลี่ยนจากเลย์เอาต์ → พึ่ง layoutDirty
      ) {
        return true;
      }
    }
    return false;
  }, [initialValues, formValues]);

  const canSave = useMemo(() => hasUnsavedChanges || layoutDirty, [hasUnsavedChanges, layoutDirty]);

  // ---------- drag param (Desktop) ----------
  const handleParamDragStart = (paramId: number) => {
    setDraggedParamId(paramId);
    setDraggedGraphInstance(null);
  };
  const handleParamDragEnd = () => {
    setDraggedParamId(null);
  };

  // ---------- drag graph instance (Desktop) ----------
  const handleGraphInstanceDragStart = (inst: GraphInstance) => {
    setDraggedGraphInstance({ uid: inst.uid, graphTypeId: inst.graphTypeId });
    setDraggedParamId(null);
  };
  const handleGraphInstanceDragEnd = () => {
    setDraggedGraphInstance(null);
    setDragOverSlot(null);
  };

  // ---------- layout drop handlers (Desktop) ----------
  const handleDragOverSlot = (slotIndex: number, subIndex: number | null, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSlot({ slot: slotIndex, sub: subIndex });
  };

  const setCell = (slotIndex: number, subIndex: number | null, updater: (cg: CellGraph) => CellGraph) => {
    setSlots((prev) => {
      const next = [...prev];
      const idx = subIndex ?? 0;
      const s = { ...next[slotIndex], graphs: [...next[slotIndex].graphs] };
      const cur: CellGraph =
        s.graphs[idx] ?? { graphTypeId: null, graphInstanceUid: null, paramIds: [] };
      s.graphs[idx] = updater(cur);
      next[slotIndex] = s;
      return next;
    });
    setLayoutDirty(true);
  };

  const handleDropOnSlot = (slotIndex: number, subIndex: number | null) => {
    const slot = slots[slotIndex];
    const wantLayout = slot.mode === "split";
    const idx = subIndex ?? 0;
    const curCell = slots[slotIndex].graphs[idx];

    // 1) ลากกราฟ (instance)
    if (draggedGraphInstance) {
      const { uid: instUid, graphTypeId } = draggedGraphInstance;
      const existingParamIds = curCell?.paramIds ?? [];

      setCell(slotIndex, subIndex, (cg) => ({
        graphTypeId,
        graphInstanceUid: instUid,
        paramIds: cg.paramIds ?? [],
      }));

      existingParamIds.forEach((pid) => {
        const old = formValues.find((x) => x.ID === pid);
        if (old?.HardwareGraphID !== graphTypeId) {
          handleChange(pid, "HardwareGraphID", graphTypeId);
        }
        if (wantLayout && !old?.LayoutDisplay) {
          handleChange(pid, "LayoutDisplay", true);
        }
      });

      handleGraphInstanceDragEnd();
      return;
    }

    // 2) ลากพารามิเตอร์
    if (draggedParamId != null) {
      const paramId = draggedParamId;
      const target = formValues.find((x) => x.ID === paramId);
      if (!target) {
        setDraggedParamId(null);
        setDragOverSlot(null);
        return;
      }

      const existingTypeId = curCell?.graphTypeId ?? null;
      const graphTypeToUse = existingTypeId ?? (target.HardwareGraphID ?? 1);

      const currentSet = new Set([...(curCell?.paramIds ?? [])]);
      currentSet.add(paramId);
      const willBeCount = currentSet.size;

      if (willBeCount >= 2) {
        const haveOther2Plus = hasOtherCellWithTwoOrMore(graphTypeToUse, {
          slotIdx: slotIndex,
          subIdx: idx,
        });
        if (haveOther2Plus) {
          message.warning(
            `กราฟ "${graphMeta(graphTypeToUse)?.name ?? graphTypeToUse}" มีตำแหน่งอื่นที่มี ≥ 2 พารามิเตอร์อยู่แล้ว — จุดอื่นของกราฟเดียวกันรองรับได้แค่ 1 พารามิเตอร์`
          );
          setDraggedParamId(null);
          setDragOverSlot(null);
          return;
        }
      }

      setCell(slotIndex, subIndex, (cg) => ({
        graphTypeId: graphTypeToUse,
        graphInstanceUid: cg.graphInstanceUid ?? pickInstanceUidForType(graphTypeToUse, instances),
        paramIds: Array.from(new Set([...(cg.paramIds ?? []), paramId])),
      }));

      if (target.HardwareGraphID !== graphTypeToUse) {
        handleChange(paramId, "HardwareGraphID", graphTypeToUse);
      }
      if (wantLayout && !target.LayoutDisplay) {
        handleChange(paramId, "LayoutDisplay", true);
      }

      setDraggedParamId(null);
      setDragOverSlot(null);
    }
  };

  // ---------- add/remove/toggle slot ----------
  const paramCount = formValues.length;

  const addSingleSlot = () => {
    if (slots.length >= Math.max(1, paramCount)) return;
    setSlots((prev) => [...prev, { mode: "single", graphs: [null] }]);
    setLayoutDirty(true);
  };

  const clearParamsInSlot = (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot) return;
    const allParamIds = new Set<number>();
    slot.graphs.forEach((cg) => cg?.paramIds.forEach((pid) => allParamIds.add(pid)));
    allParamIds.forEach((pid) => handleChange(pid, "LayoutDisplay", false));
  };

  const toggleSplitAt = (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot) return;

    clearParamsInSlot(slotIndex);

    if (slot.mode === "single") {
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { mode: "split", graphs: [null, null] };
        return next;
      });
    } else {
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { mode: "single", graphs: [null] };
        return next;
      });
    }
    setLayoutDirty(true);
  };

  const removeParamFromCell = (slotIndex: number, subIndex: number | null, paramId: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const idx = subIndex ?? 0;
      const s = { ...next[slotIndex], graphs: [...next[slotIndex].graphs] };
      const cell = s.graphs[idx];
      if (!cell) return prev;

      const newParamIds = cell.paramIds.filter((id) => id !== paramId);
      s.graphs[idx] = newParamIds.length === 0 ? null : { ...cell, paramIds: newParamIds };

      next[slotIndex] = s;
      return next;
    });

    const stillUsedSomewhere = slots.some((sl, si) =>
      sl.graphs.some((cg, ci) => {
        if (!cg) return false;
        if (si === slotIndex && (sl.mode === "single" ? 0 : ci) === (subIndex ?? 0)) return false;
        return cg.paramIds.includes(paramId);
      })
    );
    if (!stillUsedSomewhere) {
      handleChange(paramId, "LayoutDisplay", false);
    }
    setLayoutDirty(true);
  };

  const deleteSlot = (slotIndex: number) => {
    clearParamsInSlot(slotIndex);
    setSlots((prev) => prev.filter((_, i) => i !== slotIndex));
    setLayoutDirty(true);
  };

  // ---------- รายการพารามิเตอร์ที่ยังไม่ถูกใช้ใน layout (Desktop) ----------
  const usedParamIds = useMemo(() => {
    const s = new Set<number>();
    slots.forEach((sl) => sl.graphs.forEach((cg) => cg?.paramIds.forEach((id) => s.add(id))));
    return s;
  }, [slots]);

  const visibleParams = useMemo(
    () => formValues.filter((p) => !usedParamIds.has(p.ID)),
    [formValues, usedParamIds]
  );

  // ---------- GroupDisplay AUTO (≥2 ใน cell เดียว) ----------
  useEffect(() => {
    const grouped = new Set<number>();
    slots.forEach((slot) =>
      slot.graphs.forEach((cg) => {
        if (!cg) return;
        if ((cg.paramIds?.length ?? 0) >= 2) {
          cg.paramIds.forEach((pid) => grouped.add(pid));
        }
      })
    );
    setFormValues((prev) =>
      prev.map((p) => (p.GroupDisplay === grouped.has(p.ID) ? p : { ...p, GroupDisplay: grouped.has(p.ID) }))
    );
  }, [slots]);

  // ---------- Compact helpers ----------
  const allParamOptions = useMemo(
    () =>
      formValues.map((p) => ({
        rawId: p.ID,
        value: p.ID,
        label: (
          <div className="flex items-center gap-2">
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: p.HardwareParameterColorCode || "#8b8b8b",
                border: "1px solid #d1d5db",
              }}
            />
            <span className="truncate">{p.Parameter}</span>
          </div>
        ),
      })),
    [formValues]
  );

  const getParamOptionsForCell = (slotIdx: number, subIdx: number | null) => {
    const currentCell = slots[slotIdx].graphs[subIdx ?? 0];
    const currentSet = new Set(currentCell?.paramIds ?? []);
    const usedElsewhere = new Set<number>();
    slots.forEach((sl, si) =>
      sl.graphs.forEach((cg, ci) => {
        if (!cg) return;
        const isSameCell = si === slotIdx && (sl.mode === "single" ? 0 : ci) === (subIdx ?? 0);
        if (isSameCell) return;
        cg.paramIds.forEach((id) => usedElsewhere.add(id));
      })
    );
    return allParamOptions
      .filter((opt) => !usedElsewhere.has(opt.rawId) || currentSet.has(opt.rawId))
      .map(({ value, label }) => ({ value, label }));
  };

  const handleCompactGraphTypeChange = (
    slotIdx: number,
    subIdx: number | null,
    newType: number | null
  ) => {
    setCell(slotIdx, subIdx, (cg) => {
      let nextIds = cg.paramIds ?? [];
      if (newType && nextIds.length >= 2) {
        const violate = hasOtherCellWithTwoOrMore(newType, {
          slotIdx,
          subIdx: subIdx ?? 0,
        });
        if (violate) {
          message.warning(
            `กราฟ "${graphMeta(newType)?.name}" มีจุดอื่นที่มี ≥ 2 พารามิเตอร์แล้ว — จะคงไว้เพียง 1 พารามิเตอร์ในช่องนี้`
          );
          nextIds = nextIds.slice(0, 1);
        }
      }
      return {
        ...cg,
        graphTypeId: newType,
        graphInstanceUid: newType != null ? pickInstanceUidForType(newType, instances) : null,
        paramIds: nextIds,
      };
    });

    const curCell = slots[slotIdx].graphs[subIdx ?? 0];
    const ids = curCell?.paramIds ?? [];
    ids.forEach((pid) => {
      const old = formValues.find((x) => x.ID === pid);
      if ((old && old.HardwareGraphID !== newType) || (old && newType === null)) {
        handleChange(pid, "HardwareGraphID", newType ?? undefined);
      }
    });
  };

  const handleCompactParamChange = (slotIdx: number, subIdx: number | null, newIds: number[]) => {
    const cell = slots[slotIdx].graphs[subIdx ?? 0];
    const typeId = cell?.graphTypeId ?? 1;

    if (newIds.length >= 2) {
      const violate = hasOtherCellWithTwoOrMore(typeId, {
        slotIdx,
        subIdx: subIdx ?? 0,
      });
      if (violate) {
        message.warning(
          `กราฟ "${graphMeta(typeId)?.name}" มีจุดอื่นที่มี ≥ 2 พารามิเตอร์แล้ว — ช่องนี้เลือกได้เพียง 1 พารามิเตอร์`
        );
        newIds = newIds.slice(0, 1);
      }
    }

    setCell(slotIdx, subIdx, (cg) => ({
      ...cg,
      graphTypeId: cg.graphTypeId ?? typeId,
      graphInstanceUid: pickInstanceUidForType(cg.graphTypeId ?? typeId, instances),
      paramIds: Array.from(new Set(newIds)),
    }));

    const wantLayout = slots[slotIdx].mode === "split";
    const prevIds = cell?.paramIds ?? [];
    const removed = prevIds.filter((id) => !newIds.includes(id));
    const added = newIds.filter((id) => !prevIds.includes(id));

    added.forEach((pid) => {
      const old = formValues.find((x) => x.ID === pid);
      if (!old) return;
      if (old.HardwareGraphID !== typeId) {
        handleChange(pid, "HardwareGraphID", typeId);
      }
      if (wantLayout && !old.LayoutDisplay) {
        handleChange(pid, "LayoutDisplay", true);
      }
    });

    removed.forEach((pid) => {
      const usedElsewhere = slots.some((sl, si) =>
        sl.graphs.some((cg, ci) => {
          if (!cg) return false;
          if (si === slotIdx && (sl.mode === "single" ? 0 : ci) === (subIdx ?? 0)) return false;
          return cg.paramIds.includes(pid);
        })
      );
      if (!usedElsewhere) {
        handleChange(pid, "LayoutDisplay", false);
      }
    });
  };

  // ---------- save ----------
  const handleSave = async () => {
    setSaving(true);
    const plan: Array<{
      type: string;
      paramId?: number;
      parameter?: string;
      payload?: any;
    }> = [];
    try {
      // 1) คำนวณ index/right + กราฟจากเลย์เอาต์
      const indexByParamId = new Map<number, number>();
      const rightByParamId = new Map<number, boolean>();
      const graphTypeByParamId = new Map<number, number>();

      slots.forEach((slot, slotIdx) => {
        const rowIndex = slotIdx + 1;

        if (slot.mode === "single") {
          const cg = slot.graphs[0];
          if (cg) {
            cg.paramIds.forEach((pid) => {
              indexByParamId.set(pid, rowIndex);
              rightByParamId.set(pid, true);
              if (cg.graphTypeId != null) graphTypeByParamId.set(pid, cg.graphTypeId);
            });
          }
        } else {
          slot.graphs.forEach((cg, subIdx) => {
            if (!cg) return;
            const isRight = subIdx === 1;
            cg.paramIds.forEach((pid) => {
              indexByParamId.set(pid, rowIndex);
              rightByParamId.set(pid, isRight);
              if (cg.graphTypeId != null) graphTypeByParamId.set(pid, cg.graphTypeId);
            });
          });
        }
      });

      // 2) LayoutDisplay = true เฉพาะพารามิเตอร์ที่อยู่ในแถว split
      const selectedParamIds = new Set<number>();
      slots.forEach((slot) => {
        if (slot.mode !== "split") return;
        slot.graphs.forEach((cg) => {
          if (!cg) return;
          cg.paramIds.forEach((pid) => selectedParamIds.add(pid));
        });
      });
      const willLayoutTrue = new Set(selectedParamIds);

      const initialMap = new Map(initialValues.map((p) => [p.ID, p]));
      const updates: Promise<any>[] = [];

      formValues.forEach((cur) => {
        const old = initialMap.get(cur.ID);

        // (a) Graph type per parameter — ใช้ค่าจากเลย์เอาต์เป็นหลัก
        const desiredGraphType = graphTypeByParamId.get(cur.ID) ?? cur.HardwareGraphID;
        if (!old || old.HardwareGraphID !== desiredGraphType) {
          updates.push(
            UpdateHardwareParameterByID(cur.ID, {
              hardware_graph_id: desiredGraphType,
            })
          );
        }

        // (b) Color per parameter
        // (b) Color per parameter — ใช้ "ParameterID + code" → ให้ BE หา/สร้างสี แล้วผูกให้พารามิเตอร์
        if (
          (!old || old.HardwareParameterColorCode !== cur.HardwareParameterColorCode) &&
          cur.HardwareParameterColorCode // ← ต้องมีโค้ดสี (string)
        ) {
          plan.push({
            type: "AttachColorToHardwareParameter",
            paramId: cur.ID,
            parameter: cur.Parameter,
            payload: {
              code: cur.HardwareParameterColorCode,
              employee_id: employeeid,
            },
          });
          updates.push(
            AttachColorToHardwareParameter(
              cur.ID, // ✅ ใช้ ParameterID
              cur.HardwareParameterColorCode, // ✅ code
              employeeid
            )
          );
        }

        console.log(cur.HardwareParameterColorID,
          cur.HardwareParameterColorCode || "#000000",
          employeeid)

        // (c) GroupDisplay + Index + Right (ใช้ endpoint เดียว)
        const desiredIndex = indexByParamId.get(cur.ID); // undefined = ไม่ถูกวางในเลย์เอาต์
        const desiredRight = rightByParamId.get(cur.ID); // undefined = ไม่ถูกวางในเลย์เอาต์

        const groupChanged = !old || old.GroupDisplay !== cur.GroupDisplay;
        const indexChanged =
          typeof desiredIndex === "number" && (!old || old.Index !== desiredIndex);
        const rightChanged =
          typeof desiredRight === "boolean" && (!old || old.Right !== desiredRight);

        if (groupChanged || indexChanged || rightChanged) {
          const payload: { group_display?: boolean; index?: number; right?: boolean } = {};
          if (groupChanged) payload.group_display = cur.GroupDisplay;
          if (indexChanged && typeof desiredIndex === "number") payload.index = desiredIndex;
          if (rightChanged && typeof desiredRight === "boolean") payload.right = desiredRight;

          if (Object.keys(payload).length > 0) {
            updates.push(UpdateGroupDisplay(cur.ID, payload));
          }
        }

        // (d) LayoutDisplay (true เฉพาะที่อยู่ใน split layout)
        const desiredLayout = willLayoutTrue.has(cur.ID);
        if (!old || old.LayoutDisplay !== desiredLayout) {
          updates.push(UpdateLayoutDisplay(cur.ID, { layout_display: desiredLayout }));
        }
      });

      await Promise.all(updates);

      // 3) sync ค่าเริ่มต้นใหม่ และปิด flag dirty
      const nextInitial = deepClone(formValues).map((p) => ({
        ...p,
        Index: indexByParamId.get(p.ID) ?? p.Index,
        Right: rightByParamId.get(p.ID) ?? p.Right,
        HardwareGraphID: graphTypeByParamId.get(p.ID) ?? p.HardwareGraphID,
        LayoutDisplay: willLayoutTrue.has(p.ID),
      }));
      setInitialValues(nextInitial);
      setLayoutDirty(false);

      message.success("บันทึกสำเร็จ");
      if (onSuccess) await onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      message.error("บันทึกล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(96vw, 1400px)"
      style={{ top: 9 }}
      bodyStyle={{
        padding: 0,
        maxHeight: "calc(100dvh - 96px)",
        overflowY: "auto",
        borderRadius: 18,
        background: "#f7f7f8",
      }}
      title=""
      className="paddings"
      destroyOnClose
    >
      {/* Header */}
      <div className="flex justify-center items-center w-full mt-4 mb-5 px-3">
        <span className="text-center text-[18px] md:text-[20px] font-bold bg-emerald-600 text-white py-2 px-5 md:px-8 rounded-xl shadow select-none tracking-wide">
          แก้ไขข้อมูลการแสดงผลของกราฟ
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Spin size="large" />
        </div>
      ) : (
        <div className="px-3 sm:px-5 md:px-7 pb-6 pt-0 w-full">
          <div
            className={
              isCompact ? "grid gap-6 grid-cols-1" : "grid gap-6 xl:[grid-template-columns:1.35fr_1fr]"
            }
          >
            {/* ซ้าย: กราฟทั้งหมด + พารามิเตอร์ (Desktop) */}
            {!isCompact && (
              <div className="order-2 xl:order-1 space-y-6">
                {/* กราฟทั้งหมด (จาก backend) */}
                <div className="bg-white rounded-xl shadow border border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-800">กราฟทั้งหมด</span>
                    <Tag className="text-[11px] rounded-md" color="blue">
                      {instances.length} รายการ
                    </Tag>
                  </div>
                  {instances.length === 0 ? (
                    <div className="text-gray-500 text-sm mt-3">
                      ไม่พบกราฟจากระบบ
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {instances.map((inst) => {
                        const meta = graphMeta(inst.graphTypeId)!;
                        return (
                          <div
                            key={inst.uid}
                            className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                            draggable
                            onDragStart={() => handleGraphInstanceDragStart(inst)}
                            onDragEnd={handleGraphInstanceDragEnd}
                            title="ลากกล่องกราฟนี้ไปวางที่เลย์เอาต์"
                          >
                            <Image
                              src={meta?.img}
                              alt={meta?.name}
                              preview={false}
                              style={{
                                width: 52,
                                height: 52,
                                objectFit: "contain",
                                borderRadius: 10,
                                border: "1px solid #eee",
                              }}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-gray-800 truncate max-w-[140px] sm:max-w-[180px]">
                                {inst.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[140px] sm:max-w-[180px]">
                                {meta?.name}
                              </div>
                            </div>
                            <Tag className="ml-auto text-[11px] hidden sm:inline-block" color="blue">
                              ลากไปที่เลย์เอาต์
                            </Tag>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* พารามิเตอร์ */}
                <div className="bg-white rounded-xl shadow border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-gray-800">พารามิเตอร์</span>
                  </div>

                  {visibleParams.length === 0 ? (
                    <div className="text-gray-500 text-sm">ทุกพารามิเตอร์ถูกใช้อยู่ในเลย์เอาต์แล้ว</div>
                  ) : (
                    <div
                      className={`flex flex-col gap-2 ${visibleParams.length > 7 ? "max-h-[60vh] overflow-y-auto pr-1" : ""
                        }`}
                    >
                      {visibleParams.map((rowParam) => (
                        <div
                          key={rowParam.ID}
                          className="inline-flex items-center bg-gray-50 rounded-lg px-3 py-2 cursor-move border border-gray-200 w-full hover:bg-gray-100 transition"
                          style={{ minHeight: 44, gap: 10, justifyContent: "space-between" }}
                          draggable
                          onDragStart={() => handleParamDragStart(rowParam.ID)}
                          onDragEnd={handleParamDragEnd}
                          title="ลากพารามิเตอร์ไปวางที่เลย์เอาต์"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: rowParam.HardwareParameterColorCode || "#8b8b8b",
                                border: "1px solid #d1d5db",
                              }}
                            />
                            <span
                              className="font-medium text-gray-700"
                              style={{
                                fontSize: 13.5,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 220,
                              }}
                              title={rowParam.Parameter}
                            >
                              {rowParam.Parameter}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <Form.Item style={{ marginBottom: 0 }}>
                              <ColorPicker
                                value={rowParam.HardwareParameterColorCode || "#000000"}
                                onChange={(c) => {
                                  const hex = c.toHexString();
                                  handleChange(rowParam.ID, "HardwareParameterColorCode", hex);
                                }}
                                presets={[
                                  {
                                    label: "แนะนำ",
                                    colors: [
                                      "#1B3F71",
                                      "#2563eb",
                                      "#22c55e",
                                      "#eab308",
                                      "#ef4444",
                                      "#9333ea",
                                      "#0ea5e9",
                                      "#64748b",
                                    ],
                                  },
                                ]}
                              />
                            </Form.Item>

                            <Tooltip
                              title="ตั้งค่าเป็น 'รวมกลุ่ม' อัตโนมัติเมื่อมี ≥ 2 พารามิเตอร์ในช่องเดียวกัน"
                              placement="top"
                            >
                              <Switch size="small" checked={rowParam.GroupDisplay} disabled checkedChildren="G" unCheckedChildren="G" />
                            </Tooltip>
                            <Tooltip title="การแสดงในเลย์เอาต์ (เดี่ยว=ปิด, แบ่งสอง=เปิด)" placement="top">
                              <Switch
                                size="small"
                                checked={rowParam.LayoutDisplay}
                                onChange={(checked) => handleChange(rowParam.ID, "LayoutDisplay", checked)}
                                checkedChildren="L"
                                unCheckedChildren="L"
                              />
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ขวา: พื้นที่เลย์เอาต์ */}
            <div className={isCompact ? "order-1 space-y-5" : "order-1 xl:order-2 space-y-5"}>
              <div className="bg-white rounded-xl shadow border border-gray-100 px-4 sm:px-5 py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] md:text-[17px] font-semibold text-gray-800">พื้นที่เลย์เอาต์</span>
                    <Tag className="rounded-md text-[11px]">
                      แถวเดี่ยว: {slots.filter((s) => s.mode === "single").length}/{Math.max(1, formValues.length)}
                    </Tag>
                    {(canSave || isCompact) && (
                      <Tag color="orange" className="rounded-md text-[11px]">
                        {isCompact ? "โหมดแก้ไขบนมือถือ/แท็บเล็ต" : "มีการเปลี่ยนแปลง"}
                      </Tag>
                    )}
                  </div>
                  <Button size="small" onClick={addSingleSlot} disabled={slots.length >= Math.max(1, formValues.length)}>
                    + เพิ่มแถวเดี่ยว
                  </Button>
                </div>

                <div className="mt-3 flex flex-col gap-4">
                  {slots.map((slot, slotIdx) => {
                    const isSplit = slot.mode === "split";
                    const subCount = isSplit ? 2 : 1;
                    return (
                      <div key={slotIdx} className="rounded-lg border border-gray-200 p-3 bg-gradient-to-b from-white to-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">แถว {slotIdx + 1}</span>
                            <Tag color={isSplit ? "blue" : "default"} className="text-[11px]">
                              {isSplit ? "แบ่ง 2 ช่อง (ซ้าย/ขวา)" : "เดี่ยว"}
                            </Tag>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="small" onClick={() => toggleSplitAt(slotIdx)}>
                              {isSplit ? "รวมเป็นเดี่ยว" : "แบ่ง 2 ช่อง"}
                            </Button>
                            <Button size="small" danger onClick={() => deleteSlot(slotIdx)} disabled={slots.length <= 1}>
                              ลบแถว
                            </Button>
                          </div>
                        </div>

                        <div className={`grid gap-3 ${isSplit ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                          {Array.from({ length: subCount }).map((_, subIdx) => {
                            const cell = slot.graphs[subIdx ?? 0];
                            const meta = graphMeta(cell?.graphTypeId ?? null);
                            const inst = getInstanceByUid(cell?.graphInstanceUid || undefined);
                            const isOver =
                              dragOverSlot?.slot === slotIdx &&
                              dragOverSlot?.sub === (isSplit ? subIdx : null);

                            return (
                              <div
                                key={subIdx}
                                className={`relative rounded-xl border p-3 min-h=[160px] min-h-[160px] transition ${isOver ? "border-teal-400 bg-teal-50" : "border-gray-300 bg-gray-50"
                                  }`}
                                onDragOver={!isCompact ? (e) => handleDragOverSlot(slotIdx, isSplit ? subIdx : null, e) : undefined}
                                onDrop={!isCompact ? () => handleDropOnSlot(slotIdx, isSplit ? subIdx : null) : undefined}
                                title={isSplit ? (subIdx === 0 ? "ช่องซ้าย" : "ขวา") : "ช่องเดี่ยว"}
                              >
                                {/* Header cell */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isSplit && (
                                      <Tag className="text-[11px]" color="geekblue" style={{ borderRadius: 6 }}>
                                        {subIdx === 0 ? "ซ้าย" : "ขวา"}
                                      </Tag>
                                    )}
                                    {cell?.graphTypeId ? (
                                      <>
                                        <Image
                                          src={meta?.img}
                                          alt={meta?.name}
                                          preview={false}
                                          style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8 }}
                                        />
                                        <div className="min-w-0">
                                          <div className="text-sm font-semibold truncate max-w-[180px] sm:max-w-[240px]">
                                            {meta?.name || "กราฟ"}
                                          </div>
                                          {inst?.name && (
                                            <div className="text-xs text-gray-500 truncate max-w-[180px] sm:max-w-[240px]">
                                              {inst.name}
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-gray-500 text-sm">
                                        {isCompact ? "เลือกกราฟและพารามิเตอร์ด้านล่าง" : "ลากกราฟหรือพารามิเตอร์มาวางที่นี่"}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Compact controls */}
                                {isCompact && (
                                  <div className="space-y-2 mb-2">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-gray-600">ประเภทกราฟ</span>
                                      <Select
                                        size="middle"
                                        placeholder="เลือกประเภทกราฟ"
                                        value={cell?.graphTypeId ?? undefined}
                                        onChange={(val) => handleCompactGraphTypeChange(slotIdx, isSplit ? subIdx : null, val)}
                                        options={graphTypes.map((g) => ({ value: g.id, label: g.name }))}
                                        className="w-full"
                                        allowClear
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-gray-600">พารามิเตอร์ในช่องนี้</span>
                                      <Select
                                        mode="multiple"
                                        size="middle"
                                        placeholder="เลือกพารามิเตอร์"
                                        value={cell?.paramIds ?? []}
                                        onChange={(newIds) =>
                                          handleCompactParamChange(slotIdx, isSplit ? subIdx : null, newIds as number[])
                                        }
                                        options={getParamOptionsForCell(slotIdx, isSplit ? subIdx : null)}
                                        className="w-full"
                                        maxTagCount="responsive"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* รายการพารามิเตอร์ใน cell */}
                                {cell?.graphTypeId && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {cell.paramIds.length === 0 ? (
                                      <span className="text-xs text-gray-500">
                                        {isCompact ? "ยังไม่เลือกพารามิเตอร์…" : "ลากพารามิเตอร์มาวางที่นี่…"}
                                      </span>
                                    ) : (
                                      cell.paramIds.map((pid) => {
                                        const color = getParamColorCode(pid);
                                        const param = formValues.find((p) => p.ID === pid);

                                        const desktopColorNode = (
                                          <ColorPicker
                                            value={param?.HardwareParameterColorCode || "#000000"}
                                            onChange={(c) => {
                                              const hex = c.toHexString();
                                              handleChange(pid, "HardwareParameterColorCode", hex);
                                            }}
                                            presets={[
                                              {
                                                label: "แนะนำ",
                                                colors: [
                                                  "#1B3F71",
                                                  "#2563eb",
                                                  "#22c55e",
                                                  "#eab308",
                                                  "#ef4444",
                                                  "#9333ea",
                                                  "#0ea5e9",
                                                  "#64748b",
                                                ],
                                              },
                                            ]}
                                          />
                                        );

                                        return (
                                          <div key={pid} className="flex items-center">
                                            <Tag
                                              closable
                                              onClose={(e) => {
                                                e.preventDefault();
                                                removeParamFromCell(slotIdx, isSplit ? subIdx : null, pid);
                                              }}
                                              className="px-2 py-1"
                                            >
                                              {isCompact ? (
                                                <span
                                                  onClick={() => {
                                                    setColorTemp(color || "#000000");
                                                    setColorEditPid(pid);
                                                  }}
                                                  style={{
                                                    display: "inline-block",
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 999,
                                                    background: color || "#8b8b8b",
                                                    marginRight: 6,
                                                    border: "1px solid #d1d5db",
                                                    verticalAlign: "middle",
                                                    cursor: "pointer",
                                                  }}
                                                  title="แตะเพื่อเปลี่ยนสี"
                                                />
                                              ) : (
                                                <Popover
                                                  content={desktopColorNode}
                                                  trigger="click"
                                                  overlayInnerStyle={{ padding: 8 }}
                                                >
                                                  <span
                                                    style={{
                                                      display: "inline-block",
                                                      width: 10,
                                                      height: 10,
                                                      borderRadius: 999,
                                                      background: color || "#8b8b8b",
                                                      marginRight: 6,
                                                      border: "1px solid #d1d5db",
                                                      verticalAlign: "middle",
                                                      cursor: "pointer",
                                                    }}
                                                    title="คลิกเพื่อเปลี่ยนสี"
                                                  />
                                                </Popover>
                                              )}
                                              {getParamName(pid)}
                                            </Tag>

                                            {isCompact && (
                                              <Button
                                                size="small"
                                                style={{ marginLeft: 4 }}
                                                onClick={() => {
                                                  setColorTemp(color || "#000000");
                                                  setColorEditPid(pid);
                                                }}
                                              >
                                                เปลี่ยนสี
                                              </Button>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                  <Button onClick={onClose} size="small" className="rounded-md font-semibold px-4 h-[34px] text-[14px] border">
                    ยกเลิก
                  </Button>
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    size="small"
                    className="rounded-md font-semibold px-4 h-[34px] text-[14px] text-white bg-teal-600"
                  >
                    บันทึกทั้งหมด
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Compact Color Editor Modal (Mobile/iPad) */}
      <Modal
        open={isCompact && colorEditPid !== null}
        onCancel={() => setColorEditPid(null)}
        onOk={() => {
          if (colorEditPid != null) {
            handleChange(colorEditPid, "HardwareParameterColorCode", colorTemp);
          }
          setColorEditPid(null);
        }}
        okText="บันทึก"
        cancelText="ยกเลิก"
        title="เลือกสีพารามิเตอร์"
        destroyOnClose
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: colorTemp,
              border: "1px solid #d1d5db",
            }}
          />
          <ColorPicker
            value={colorTemp}
            onChange={(c) => setColorTemp(c.toHexString())}
            presets={[
              {
                label: "แนะนำ55",
                colors: [
                  "#1B3F71",
                  "#2563eb",
                  "#22c55e",
                  "#eab308",
                  "#ef4444",
                  "#9333ea",
                  "#0ea5e9",
                  "#64748b",
                ],
              },
            ]}
          />
        </div>
      </Modal>

      {/* สไตล์เสริมเฉพาะคอมโพเนนต์นี้ */}
      <style>{`
        @media (max-width: 640px) {
          .ant-modal-root .ant-modal {
            padding: 0 8px;
            top: 56px !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1280px) {
          .ant-modal-root .ant-modal {
            top: 40px !important;
          }
        }
        .paddings .ant-select {
          max-width: 100%;
        }
      `}</style>
    </Modal>
  );
};

export default EditParameterModal;
