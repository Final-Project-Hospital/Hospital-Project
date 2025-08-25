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
  UpdateGroupDisplay,
  UpdateLayoutDisplay,
  UpdateHardwareParameterColorByID, // ✅ ใช้ service นี้ในการอัปเดตสี (code)
} from "../../../../../../services/hardware";
import { ColorPicker } from "antd";
import LineChartingImg from "../../../../../../assets/chart/LineCharting.png";
import AreaChartingImg from "../../../../../../assets/chart/AreaCharting.png";
import MappingImg from "../../../../../../assets/chart/Mapping.png";
import StackChartingImg from "../../../../../../assets/chart/StackCharting.png";
import "./ColorSelectNoArrow.css";

interface EditParameterModalProps {
  open: boolean;
  onClose: () => void;
  hardwareID: number;
  onSuccess?: () => Promise<void>;
}

type SlotMode = "single" | "split";

// โครงสร้างของ cell ใน layout
type CellGraph = {
  graphTypeId: number | null; // 1..4
  graphInstanceUid?: string | null; // uid ของ instance
  paramIds: number[];
};

type Slot = { mode: SlotMode; graphs: (CellGraph | null)[] };

type ParamRow = {
  ID: number;
  Parameter: string;
  GroupDisplay: boolean;
  LayoutDisplay: boolean;
  HardwareGraphID?: number; // 1..4
  HardwareParameterColorID?: number; // ✅ ใช้เพื่อชี้ไปยัง record สีเดิมที่ผูกอยู่
  HardwareParameterColorCode?: string; // ✅ เก็บ code ของสีเพื่อแก้ด้วย ColorPicker
};

// ประเภทกราฟ
const graphTypes = [
  { id: 1, name: "กราฟเส้น (ค่าเริ่มต้น)", img: LineChartingImg },
  { id: 2, name: "กราฟพื้นที่ (Area)", img: AreaChartingImg },
  { id: 3, name: "กราฟ Color Mapping", img: MappingImg },
  { id: 4, name: "กราฟ Stacked", img: StackChartingImg },
];

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const STORAGE_KEY = (hardwareID: number) => `hw-layout-v2-${hardwareID}`;

// instance ของกราฟ (สำหรับ Desktop/Drag)
type GraphInstance = {
  uid: string;
  graphTypeId: number; // 1..4
  name: string; // เช่น "Area #2"
};

const uid = () => Math.random().toString(36).slice(2, 9);

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

const EditParameterModal: React.FC<EditParameterModalProps> = ({
  open,
  onClose,
  hardwareID,
  onSuccess,
}) => {
  const { isMobile, isTablet, isCompact } = useViewportFlags();

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
  // ใช้ตรวจว่ามีการแก้ layout/instances เพื่อเปิดปุ่ม "บันทึกทั้งหมด"
  const [layoutDirty, setLayoutDirty] = useState(false);

  // ---- Graph Instances (Desktop)
  const [instances, setInstances] = useState<GraphInstance[]>([]);
  const [addingTypeId, setAddingTypeId] = useState<number>(1);

  // ---- Compact Color Editor (Mobile/iPad) ----
  const [colorEditPid, setColorEditPid] = useState<number | null>(null);
  const [colorTemp, setColorTemp] = useState<string>("#000000");

  // ---------- helpers ----------
  const graphMeta = (typeId: number | null | undefined) =>
    graphTypes.find((g) => g.id === (typeId ?? 0));

  const getInstanceByUid = (u?: string | null) =>
    instances.find((it) => it.uid === u);

  const handleChange = (id: number, field: keyof ParamRow, value: any) => {
    setFormValues((prev) =>
      prev.map((it) => (it.ID === id ? { ...it, [field]: value } : it))
    );
  };

  const getParamName = (id: number) =>
    formValues.find((x) => x.ID === id)?.Parameter ?? `#${id}`;

  const getParamColorCode = (id: number): string | undefined =>
    formValues.find((x) => x.ID === id)?.HardwareParameterColorCode;

  // Layout เริ่มต้น
  const buildInitialSlots = (): Slot[] => [{ mode: "single", graphs: [null] }];

  // ---------- utilities: per-graph constraints ----------
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

  // ---------- localStorage: load/save layout & instances ----------
  const loadLayoutFromStorage = (rows: ParamRow[]) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(hardwareID));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { slots: Slot[]; instances: GraphInstance[] };
      if (!parsed || !Array.isArray(parsed.slots)) return null;

      const validIds = new Set(rows.map((r) => r.ID));
      const cleanedSlots: Slot[] = parsed.slots.map((slot) => {
        const isSplit = slot.mode === "split";
        const graphs = (slot.graphs || [])
          .slice(0, isSplit ? 2 : 1)
          .map((cg) => {
            if (!cg) return null;
            const graphTypeId =
              typeof cg.graphTypeId === "number" && [1, 2, 3, 4].includes(cg.graphTypeId)
                ? cg.graphTypeId
                : null;
            const paramIds = Array.from(
              new Set((cg.paramIds || []).filter((id) => validIds.has(id)))
            );
            const graphInstanceUid =
              typeof cg.graphInstanceUid === "string" ? cg.graphInstanceUid : null;
            return graphTypeId || paramIds.length
              ? { graphTypeId, graphInstanceUid, paramIds }
              : null;
          });
        if (isSplit) {
          while (graphs.length < 2) graphs.push(null);
        } else {
          graphs.splice(1);
        }
        return { mode: isSplit ? "split" : "single", graphs };
      });

      const cleanedInstances = (Array.isArray(parsed.instances) ? parsed.instances : []).filter(
        (it) => it && typeof it.uid === "string" && [1, 2, 3, 4].includes(it.graphTypeId)
      );

      const paramInSplitLayout = new Set<number>();
      cleanedSlots.forEach((slot) => {
        if (slot.mode !== "split") return;
        slot.graphs.forEach((cg) => cg?.paramIds.forEach((id) => paramInSplitLayout.add(id)));
      });
      setFormValues((prev) =>
        prev.map((p) => ({
          ...p,
          LayoutDisplay: paramInSplitLayout.has(p.ID),
        }))
      );

      return { slots: cleanedSlots, instances: cleanedInstances };
    } catch {
      return null;
    }
  };

  const saveLayoutToStorage = (value: { slots: Slot[]; instances: GraphInstance[] }) => {
    try {
      localStorage.setItem(STORAGE_KEY(hardwareID), JSON.stringify(value));
    } catch { }
  };

  useEffect(() => {
    setEmployeeid(Number(localStorage.getItem("employeeid")));
    if (!open || !hardwareID) return;
    setLoading(true);
    ListHardwareParameterByHardwareID(hardwareID)
      .then((params) => {
        if (!params) return;
        const rows: ParamRow[] = params.map((p: any) => ({
          ID: p.ID,
          Parameter: p.Parameter,
          GroupDisplay: p.GroupDisplay,
          LayoutDisplay: p.LayoutDisplay,
          HardwareGraphID: p.HardwareGraph?.ID,
          HardwareParameterColorID: p.HardwareParameterColor?.ID,
          HardwareParameterColorCode: p.HardwareParameterColor?.Code,
        }));
        setFormValues(rows);
        setInitialValues(deepClone(rows));

        const fromStore = loadLayoutFromStorage(rows);
        if (fromStore?.slots?.length) {
          setSlots(fromStore.slots);
          setInstances(fromStore.instances ?? []);
        } else {
          setSlots(buildInitialSlots());
          setInstances([]);
        }

        setLayoutDirty(false); // reset สถานะ dirty หลังโหลด
      })
      .finally(() => setLoading(false));
  }, [open, hardwareID]);

  // ---------- ตรวจจับการแก้ไข (formValues) ----------
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
        old.HardwareParameterColorCode !== cur.HardwareParameterColorCode // ✅ เทียบ code (ไม่ใช่ id)
      ) {
        return true;
      }
    }
    return false;
  }, [initialValues, formValues]);

  const canSave = useMemo(
    () => hasUnsavedChanges || layoutDirty,
    [hasUnsavedChanges, layoutDirty]
  );

  // ---------- Graph Instances (Desktop) ----------
  const addGraphInstance = () => {
    const meta = graphMeta(addingTypeId);
    if (!meta) return;
    const countSameType = instances.filter((it) => it.graphTypeId === addingTypeId).length;
    const inst: GraphInstance = {
      uid: uid(),
      graphTypeId: addingTypeId,
      name: `${meta.name} #${countSameType + 1}`,
    };
    setInstances((prev) => [...prev, inst]);
    setLayoutDirty(true);
  };

  const removeGraphInstance = (uidToRemove: string) => {
    setInstances((prev) => prev.filter((it) => it.uid !== uidToRemove));
    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        graphs: slot.graphs.map((cg) => {
          if (!cg) return cg;
          if (cg.graphInstanceUid === uidToRemove) {
            return { ...cg, graphInstanceUid: null };
          }
          return cg;
        }),
      }))
    );
    setLayoutDirty(true);
  };

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
  const handleDragOverSlot = (
    slotIndex: number,
    subIndex: number | null,
    e: React.DragEvent
  ) => {
    e.preventDefault();
    setDragOverSlot({ slot: slotIndex, sub: subIndex });
  };

  const setCell = (
    slotIndex: number,
    subIndex: number | null,
    updater: (cg: CellGraph) => CellGraph
  ) => {
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

    // ✅ 1) ลาก "graph instance" → เปลี่ยนกราฟโดยคงพารามิเตอร์เดิมไว้
    if (draggedGraphInstance) {
      const { uid: instUid, graphTypeId } = draggedGraphInstance;
      const existingParamIds = curCell?.paramIds ?? [];

      setCell(slotIndex, subIndex, (cg) => ({
        graphTypeId,
        graphInstanceUid: instUid,
        paramIds: cg.paramIds ?? [],
      }));

      // อัปเดต HardwareGraphID ให้กับทุกพารามิเตอร์ใน cell นี้
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

    // 2) ลาก "parameter"
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

      // กฎจำกัด: cell อื่นของกราฟเดียวกันที่มี ≥2 พารามิเตอร์ได้เพียง 1 จุด
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
        graphInstanceUid: cg.graphInstanceUid ?? null,
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

  // ลบพารามิเตอร์ทั้งหมดใน slot หนึ่ง ๆ และอัปเดต LayoutDisplay = false
  const clearParamsInSlot = (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot) return;
    const allParamIds = new Set<number>();
    slot.graphs.forEach((cg) => cg?.paramIds.forEach((pid) => allParamIds.add(pid)));
    allParamIds.forEach((pid) => handleChange(pid, "LayoutDisplay", false));
  };

  // เมื่อกด Split/Merge → ลบพารามิเตอร์ใน slot นั้นออกให้หมด
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

  // เอา parameter ออกจาก cell
  const removeParamFromCell = (
    slotIndex: number,
    subIndex: number | null,
    paramId: number
  ) => {
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

    // อัปเดต LayoutDisplay ถ้า parameter ไม่ถูกใช้ที่อื่น
    const stillUsedSomewhere = slots.some((sl, si) =>
      sl.graphs.some((cg, ci) => {
        if (!cg) return false;
        if (si === slotIndex && (sl.mode === "single" ? 0 : ci) === (subIndex ?? 0))
          return false;
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

  // ---------- รายการพารามิเตอร์: ซ่อนตัวที่ถูกใช้ใน layout (ใช้เฉพาะ Desktop) ----------
  const usedParamIds = useMemo(() => {
    const s = new Set<number>();
    slots.forEach((sl) =>
      sl.graphs.forEach((cg) => cg?.paramIds.forEach((id) => s.add(id)))
    );
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
      prev.map((p) =>
        p.GroupDisplay === grouped.has(p.ID)
          ? p
          : { ...p, GroupDisplay: grouped.has(p.ID) }
      )
    );
  }, [slots]);

  // ---------- Compact mode helpers (Mobile/iPad): เลือกในพื้นที่เลย์เอาต์ ----------
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

  // ⚠️ ห้ามให้พารามิเตอร์ที่ถูกใช้ใน cell อื่น โผล่มาให้เลือก
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
    // อนุญาตเฉพาะ param ที่ "ไม่ถูกใช้ที่อื่น" หรือ "เป็นของ cell นี้อยู่แล้ว"
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
        paramIds: nextIds,
      };
    });

    // sync HardwareGraphID ให้ param ใน cell
    const curCell = slots[slotIdx].graphs[subIdx ?? 0];
    const ids = curCell?.paramIds ?? [];
    ids.forEach((pid) => {
      const old = formValues.find((x) => x.ID === pid);
      if ((old && old.HardwareGraphID !== newType) || (old && newType === null)) {
        handleChange(pid, "HardwareGraphID", newType ?? undefined);
      }
    });
  };

  const handleCompactParamChange = (
    slotIdx: number,
    subIdx: number | null,
    newIds: number[]
  ) => {
    const cell = slots[slotIdx].graphs[subIdx ?? 0];
    const typeId = cell?.graphTypeId ?? 1; // ถ้ายังไม่เลือกให้ default = 1 (Line)

    // ตรวจ constraint: ไม่ให้มีอีก cell ของกราฟเดียวกันมี ≥2 แล้ว
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

    // อัปเดต cell
    setCell(slotIdx, subIdx, (cg) => ({
      ...cg,
      graphTypeId: cg.graphTypeId ?? typeId,
      paramIds: Array.from(new Set(newIds)),
    }));

    // sync HardwareGraphID + LayoutDisplay
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

    // ถ้า param ถูกถอดออกและไม่ได้ใช้ที่อื่น → LayoutDisplay = false
    removed.forEach((pid) => {
      const usedElsewhere = slots.some((sl, si) =>
        sl.graphs.some((cg, ci) => {
          if (!cg) return false;
          if (si === slotIdx && (sl.mode === "single" ? 0 : ci) === (subIdx ?? 0))
            return false;
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
    try {
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

        // อัปเดตประเภทกราฟที่ผูกกับพารามิเตอร์ (ถ้าเปลี่ยน)
        if (!old || old.HardwareGraphID !== cur.HardwareGraphID) {
          updates.push(
            UpdateHardwareParameterByID(cur.ID, {
              hardware_graph_id: cur.HardwareGraphID,
            })
          );
        }

        // ✅ อัปเดตสี: ถ้า code เปลี่ยน และมี HardwareParameterColorID
        if (
          (!old || old.HardwareParameterColorCode !== cur.HardwareParameterColorCode) &&
          cur.HardwareParameterColorID
        ) {
          updates.push(
            UpdateHardwareParameterColorByID(
              cur.HardwareParameterColorID,
              cur.HardwareParameterColorCode || "#000000",
              employeeid
            )
          );
        }

        // GroupDisplay (auto ตามจำนวนพารามิเตอร์ใน cell)
        if (!old || old.GroupDisplay !== cur.GroupDisplay) {
          updates.push(UpdateGroupDisplay(cur.ID, { group_display: cur.GroupDisplay }));
        }

        // LayoutDisplay (true เฉพาะที่อยู่ใน split layout)
        const desiredLayout = willLayoutTrue.has(cur.ID);
        if (!old || old.LayoutDisplay !== desiredLayout) {
          updates.push(UpdateLayoutDisplay(cur.ID, { layout_display: desiredLayout }));
        }
      });

      await Promise.all(updates);

      // บันทึก layout/instances ลง localStorage
      saveLayoutToStorage({ slots, instances });

      // sync ค่าเริ่มต้นใหม่ และปิด flag dirty
      setInitialValues(deepClone(formValues));
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
      style={{ top: 12 }}
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
              isCompact
                ? "grid gap-6 grid-cols-1" // ✅ Compact: ซ่อนแถบซ้าย เหลือเฉพาะเลย์เอาต์
                : "grid gap-6 xl:[grid-template-columns:1.35fr_1fr]"
            }
          >
            {/* ซ้าย: รายการกราฟ + พารามิเตอร์ (แสดงเฉพาะ Desktop) */}
            {!isCompact && (
              <div className="order-2 xl:order-1 space-y-6">
                {/* เพิ่มกราฟ */}
                <div className="bg-white rounded-xl shadow border border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-800">เพิ่มกราฟ</span>
                    <Button
                      size="small"
                      onClick={() => setAddingTypeId(1)}
                      className={addingTypeId === 1 ? "border-blue-500" : ""}
                    >
                      Line
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setAddingTypeId(2)}
                      className={addingTypeId === 2 ? "border-blue-500" : ""}
                    >
                      Area
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setAddingTypeId(3)}
                      className={addingTypeId === 3 ? "border-blue-500" : ""}
                    >
                      Mapping
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setAddingTypeId(4)}
                      className={addingTypeId === 4 ? "border-blue-500" : ""}
                    >
                      Stacked
                    </Button>
                    <Button size="small" type="primary" onClick={addGraphInstance}>
                      + เพิ่มกราฟ
                    </Button>
                  </div>
                  {instances.length === 0 ? (
                    <div className="text-gray-500 text-sm mt-3">
                      ยังไม่มีกล่องกราฟ (กดปุ่ม “+ เพิ่มกราฟ” เพื่อสร้าง)
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
                            {/* ลบได้เลย ไม่ต้องยืนยัน */}
                            <Button size="small" danger onClick={() => removeGraphInstance(inst.uid)}>
                              ลบ
                            </Button>
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
                            {/* สีพารามิเตอร์ */}
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
                            {/* ✅ ColorPicker แทน Select รายการสี */}
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
                              <Switch
                                size="small"
                                checked={rowParam.GroupDisplay}
                                disabled
                                checkedChildren="G"
                                unCheckedChildren="G"
                              />
                            </Tooltip>
                            <Tooltip
                              title="การแสดงในเลย์เอาต์ (เดี่ยว=ปิด, แบ่งสอง=เปิด)"
                              placement="top"
                            >
                              <Switch
                                size="small"
                                checked={rowParam.LayoutDisplay}
                                onChange={(checked) =>
                                  handleChange(rowParam.ID, "LayoutDisplay", checked)
                                }
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

            {/* ขวา: พื้นที่เลย์เอาต์ (Mobile/iPad: แก้ไขได้ในพื้นที่นี้เลย) */}
            <div className={isCompact ? "order-1 space-y-5" : "order-1 xl:order-2 space-y-5"}>
              <div className="bg-white rounded-xl shadow border border-gray-100 px-4 sm:px-5 py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] md:text-[17px] font-semibold text-gray-800">
                      พื้นที่เลย์เอาต์
                    </span>
                    <Tag className="rounded-md text-[11px]">
                      แถวเดี่ยว: {slots.filter((s) => s.mode === "single").length}/
                      {Math.max(1, formValues.length)}
                    </Tag>
                    {(canSave || isCompact) && (
                      <Tag color="orange" className="rounded-md text-[11px]">
                        {isCompact ? "โหมดแก้ไขบนมือถือ/แท็บเล็ต" : "มีการเปลี่ยนแปลง"}
                      </Tag>
                    )}
                  </div>
                  <Button
                    size="small"
                    onClick={addSingleSlot}
                    disabled={slots.length >= Math.max(1, formValues.length)}
                  >
                    + เพิ่มแถวเดี่ยว
                  </Button>
                </div>

                <div className="mt-3 flex flex-col gap-4">
                  {slots.map((slot, slotIdx) => {
                    const isSplit = slot.mode === "split";
                    const subCount = isSplit ? 2 : 1;
                    return (
                      <div
                        key={slotIdx}
                        className="rounded-lg border border-gray-200 p-3 bg-gradient-to-b from-white to-gray-50"
                      >
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
                            {/* ลบได้เลย ไม่ต้องยืนยัน */}
                            <Button
                              size="small"
                              danger
                              onClick={() => deleteSlot(slotIdx)}
                              disabled={slots.length <= 1}
                            >
                              ลบแถว
                            </Button>
                          </div>
                        </div>

                        <div
                          className={`grid gap-3 ${isSplit ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                            }`}
                        >
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
                                className={`relative rounded-xl border p-3 min-h-[160px] transition ${isOver ? "border-teal-400 bg-teal-50" : "border-gray-300 bg-gray-50"
                                  }`}
                                onDragOver={
                                  !isCompact
                                    ? (e) => handleDragOverSlot(slotIdx, isSplit ? subIdx : null, e)
                                    : undefined
                                }
                                onDrop={
                                  !isCompact
                                    ? () => handleDropOnSlot(slotIdx, isSplit ? subIdx : null)
                                    : undefined
                                }
                                title={
                                  isSplit ? (subIdx === 0 ? "ช่องซ้าย" : "ขวา") : "ช่องเดี่ยว"
                                }
                              >
                                {/* ส่วนหัวของ cell */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isSplit && (
                                      <Tag
                                        className="text-[11px]"
                                        color="geekblue"
                                        style={{ borderRadius: 6 }}
                                      >
                                        {subIdx === 0 ? "ซ้าย" : "ขวา"}
                                      </Tag>
                                    )}
                                    {cell?.graphTypeId ? (
                                      <>
                                        <Image
                                          src={meta?.img}
                                          alt={meta?.name}
                                          preview={false}
                                          style={{
                                            width: 40,
                                            height: 40,
                                            objectFit: "contain",
                                            borderRadius: 8,
                                          }}
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
                                        {isCompact
                                          ? "เลือกกราฟและพารามิเตอร์ด้านล่าง"
                                          : "ลากกราฟหรือพารามิเตอร์มาวางที่นี่"}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* ✅ Compact Controls: Mobile/iPad เลือกใน cell */}
                                {isCompact && (
                                  <div className="space-y-2 mb-2">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-gray-600">ประเภทกราฟ</span>
                                      <Select
                                        size="middle"
                                        placeholder="เลือกประเภทกราฟ"
                                        value={cell?.graphTypeId ?? undefined}
                                        onChange={(val) =>
                                          handleCompactGraphTypeChange(
                                            slotIdx,
                                            isSplit ? subIdx : null,
                                            val
                                          )
                                        }
                                        options={graphTypes.map((g) => ({
                                          value: g.id,
                                          label: g.name,
                                        }))}
                                        className="w-full"
                                        allowClear
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-gray-600">
                                        พารามิเตอร์ในช่องนี้
                                      </span>
                                      <Select
                                        mode="multiple"
                                        size="middle"
                                        placeholder="เลือกพารามิเตอร์"
                                        value={cell?.paramIds ?? []}
                                        onChange={(newIds) =>
                                          handleCompactParamChange(
                                            slotIdx,
                                            isSplit ? subIdx : null,
                                            newIds as number[]
                                          )
                                        }
                                        options={getParamOptionsForCell(
                                          slotIdx,
                                          isSplit ? subIdx : null
                                        )}
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

                                        // ✅ Desktop: แก้สีผ่าน Popover
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
                                                removeParamFromCell(
                                                  slotIdx,
                                                  isSplit ? subIdx : null,
                                                  pid
                                                );
                                              }}
                                              className="px-2 py-1"
                                            >
                                              {/* จุดสี */}
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

                                            {/* ปุ่มลัดเปิดตัวเลือกสี (เฉพาะ Compact) */}
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
                  <Button
                    onClick={onClose}
                    size="small"
                    className="rounded-md font-semibold px-4 h-[34px] text-[14px] border"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    size="small"
                    className="rounded-md font-semibold px-4 h-[34px] text-[14px]"
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
        </div>
      </Modal>

      {/* สไตล์เสริมเฉพาะคอมโพเนนต์นี้ */}
      <style>{`
        /* มือถือ: ขยับโมดัลลงมาอีกหน่อย และคง padding ด้านข้าง */
        @media (max-width: 640px) {
          .ant-modal-root .ant-modal {
            padding: 0 8px;
            top: 56px !important; /* ดันลงมาจากขอบบน */
          }
        }

        /* ✅ iPad: 768px–1280px ปรับระยะห่างบนเล็กน้อย */
        @media (min-width: 768px) and (max-width: 1280px) {
          .ant-modal-root .ant-modal {
            top: 40px !important;
          }
        }

        /* ✅ ทำให้ Select ในโหมด Compact กว้างเต็ม cell สวยงาม */
        .paddings .ant-select {
          max-width: 100%;
        }
      `}</style>
    </Modal>
  );
};

export default EditParameterModal;
