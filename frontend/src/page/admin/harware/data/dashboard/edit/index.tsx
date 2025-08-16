// 📁 EditParameterModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Select,
  Button,
  message,
  Spin,
  Image,
  Switch,
  Tooltip,
  Tag,
  Popconfirm,
} from "antd";
import {
  UpdateHardwareParameterByID,
  ListHardwareParameterByHardwareID,
  ListHardwareColors,
  UpdateGroupDisplay,
  UpdateLayoutDisplay,
} from "../../../../../../services/hardware";
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

// Cell ใน layout: เก็บชนิดกราฟ (จาก instance) และรายการพารามิเตอร์ที่ใช้
type CellGraph = {
  graphTypeId: number | null;       // 1..4
  graphInstanceUid?: string | null; // uid ของ instance (อาจมีหรือไม่มีก็ได้)
  paramIds: number[];
};

type Slot = { mode: SlotMode; graphs: (CellGraph | null)[] };

type ParamRow = {
  ID: number;
  Parameter: string;
  GroupDisplay: boolean;
  LayoutDisplay: boolean;
  HardwareGraphID?: number;           // 1..4
  HardwareParameterColorID?: number;
  HardwareParameterColorCode?: string;
};

// ประเภทกราฟ (ชนิด)
const graphTypes = [
  { id: 1, name: "Default Graph", img: LineChartingImg },
  { id: 2, name: "Area", img: AreaChartingImg },
  { id: 3, name: "Color Mapping", img: MappingImg },
  { id: 4, name: "Stacked", img: StackChartingImg },
];

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const STORAGE_KEY = (hardwareID: number) => `hw-layout-v2-${hardwareID}`;

// instance กราฟ (สร้างได้หลายอัน)
type GraphInstance = {
  uid: string;          // unique ต่อ instance
  graphTypeId: number;  // 1..4
  name: string;         // เช่น "Area #2"
};

const uid = () => Math.random().toString(36).slice(2, 9);

const EditParameterModal: React.FC<EditParameterModalProps> = ({
  open,
  onClose,
  hardwareID,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formValues, setFormValues] = useState<ParamRow[]>([]);
  const [initialValues, setInitialValues] = useState<ParamRow[]>([]);
  const [colorOptions, setColorOptions] = useState<any[]>([]);

  // ---- Drag state
  const [draggedParamId, setDraggedParamId] = useState<number | null>(null);
  const [draggedGraphInstance, setDraggedGraphInstance] = useState<{ uid: string; graphTypeId: number } | null>(null);
  const [dragOverSlot, setDragOverSlot] =
    useState<{ slot: number; sub: number | null } | null>(null);

  // ---- Layout
  const [slots, setSlots] = useState<Slot[]>([{ mode: "single", graphs: [null] }]);

  // ---- Graph Instances (เพิ่มได้หลายอัน)
  const [instances, setInstances] = useState<GraphInstance[]>([]);
  const [addingTypeId, setAddingTypeId] = useState<number>(1);

  // ---------- helpers ----------
  const graphMeta = (typeId: number | null | undefined) =>
    graphTypes.find((g) => g.id === (typeId ?? 0));

  const handleChange = (id: number, field: keyof ParamRow, value: any) => {
    setFormValues((prev) => prev.map((it) => (it.ID === id ? { ...it, [field]: value } : it)));
  };

  const getParamName = (id: number) =>
    formValues.find((x) => x.ID === id)?.Parameter ?? `#${id}`;

  // Layout เริ่มต้น
  const buildInitialSlots = (): Slot[] => [{ mode: "single", graphs: [null] }];

  // ---------- iterate helpers ----------
  type CellCoord = { slotIdx: number; subIdx: number; cell: CellGraph };
  const foreachCell = (fn: (coord: CellCoord) => void) => {
    slots.forEach((sl, slotIdx) =>
      sl.graphs.forEach((cg, subIdx) => {
        if (cg) fn({ slotIdx, subIdx, cell: cg });
      })
    );
  };
  const findOtherOwnerWith2Plus = (graphTypeId: number, except?: { slotIdx: number; subIdx: number }) => {
    let owner: CellCoord | null = null;
    foreachCell(({ slotIdx, subIdx, cell }) => {
      if (cell.graphTypeId !== graphTypeId) return;
      if (except && slotIdx === except.slotIdx && subIdx === except.subIdx) return;
      if ((cell.paramIds?.length ?? 0) >= 2) {
        owner = { slotIdx, subIdx, cell };
      }
    });
    return owner;
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
        const graphs = (slot.graphs || []).slice(0, isSplit ? 2 : 1).map((cg) => {
          if (!cg) return null;
          const graphTypeId =
            typeof cg.graphTypeId === "number" && [1, 2, 3, 4].includes(cg.graphTypeId)
              ? cg.graphTypeId
              : null;
          const paramIds = Array.from(new Set((cg.paramIds || []).filter((id) => validIds.has(id))));
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

      // instances
      const cleanedInstances = (Array.isArray(parsed.instances) ? parsed.instances : [])
        .filter((it) => it && typeof it.uid === "string" && [1,2,3,4].includes(it.graphTypeId));

      // โหลดค่า L จาก layout: ให้ L=true เฉพาะ param ที่อยู่ใน "Split" slots
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
    } catch {}
  };

  // ---------- load ----------
  useEffect(() => {
    if (!open || !hardwareID) return;
    setLoading(true);
    Promise.all([ListHardwareParameterByHardwareID(hardwareID), ListHardwareColors()])
      .then(([params, colors]) => {
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

        // พยายามโหลด layout + instances จาก localStorage
        const fromStore = loadLayoutFromStorage(rows);
        if (fromStore?.slots?.length) {
          setSlots(fromStore.slots);
          setInstances(fromStore.instances ?? []);
        } else {
          setSlots(buildInitialSlots());
          setInstances([]);
        }

        if (colors) {
          setColorOptions(
            colors.map((color: any) => ({
              value: color.ID,
              label: (
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    background: color.Code,
                    borderRadius: 7,
                    border: "1px solid #bbb",
                    verticalAlign: "middle",
                  }}
                  title={color.Color}
                />
              ),
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [open, hardwareID]);

  // ---------- unsaved detection ----------
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
        old.HardwareParameterColorID !== cur.HardwareParameterColorID
      ) {
        return true;
      }
    }
    return false;
  }, [initialValues, formValues]);

  // ---------- Graph Instances: add/remove ----------
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
  };

  // ---------- drag param ----------
  const handleParamDragStart = (paramId: number) => {
    setDraggedParamId(paramId);
    setDraggedGraphInstance(null);
  };
  const handleParamDragEnd = () => {
    setDraggedParamId(null);
  };

  // ---------- drag graph instance ----------
  const handleGraphInstanceDragStart = (inst: GraphInstance) => {
    setDraggedGraphInstance({ uid: inst.uid, graphTypeId: inst.graphTypeId });
    setDraggedParamId(null);
  };
  const handleGraphInstanceDragEnd = () => {
    setDraggedGraphInstance(null);
    setDragOverSlot(null);
  };

  // ---------- layout drop handlers ----------
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
      const cur: CellGraph = s.graphs[idx] ?? { graphTypeId: null, graphInstanceUid: null, paramIds: [] };
      s.graphs[idx] = updater(cur);
      next[slotIndex] = s;
      return next;
    });
  };

  const handleDropOnSlot = (slotIndex: number, subIndex: number | null) => {
    const slot = slots[slotIndex];
    const wantLayout = slot.mode === "split"; // split => L=true, single => L=false
    const idx = subIndex ?? 0;
    const curCell = slots[slotIndex].graphs[idx];

    // 1) ลาก "graph instance" → ตั้งชนิดกราฟใน cell
    if (draggedGraphInstance) {
      const { uid: instUid, graphTypeId } = draggedGraphInstance;
      setCell(slotIndex, subIndex, (cg) => ({
        graphTypeId,
        graphInstanceUid: instUid,
        paramIds: cg.paramIds ?? [],
      }));
      handleGraphInstanceDragEnd();
      return;
    }

    // 2) ลาก "parameter" → เพิ่ม parameter เข้า cell
    if (draggedParamId != null) {
      const paramId = draggedParamId;
      const target = formValues.find((x) => x.ID === paramId);
      if (!target) {
        setDraggedParamId(null);
        setDragOverSlot(null);
        return;
      }

      const existingTypeId = curCell?.graphTypeId ?? null;
      const cellGraphType = existingTypeId;
      // ถ้า cell ยังไม่มีกราฟ → ใช้ชนิดกราฟจากพารามิเตอร์ (หรือ 1 = Default Graph)
      const graphTypeToUse = cellGraphType ?? (target.HardwareGraphID ?? 1);

      // ---- RULE: สำหรับกราฟชนิดเดียวกัน อนุญาตให้มี instance ที่มี >=2 params ได้เพียง 1 instance เท่านั้น
      // จะเพิ่ม param เข้า cell ปัจจุบัน → ตรวจว่าถ้าหลังเพิ่มแล้วจำนวนจะ >=2 ?
      const currentParamCount = curCell?.paramIds?.length ?? 0;
      const isGoingToBeAtLeastTwo = currentParamCount + (curCell?.paramIds?.includes(paramId) ? 0 : 1) >= 2;

      if (isGoingToBeAtLeastTwo) {
        const owner = findOtherOwnerWith2Plus(graphTypeToUse, { slotIdx: slotIndex, subIdx: idx });
        // ถ้ามี owner อยู่แล้ว และ cell นี้ยังไม่ได้มี >=2 (หรือจะกลายเป็น >=2 ครั้งแรก) → บล็อก
        if (owner) {
          message.warning(
            `ชนิดกราฟ "${graphMeta(graphTypeToUse)?.name ?? graphTypeToUse}" มี cell ที่ถือ ≥2 parameters อยู่แล้ว (อนุญาตแค่ 1 cell ต่อชนิดกราฟ). Cell อื่นต้องมีได้ไม่เกิน 1 parameter.`
          );
          setDraggedParamId(null);
          setDragOverSlot(null);
          return;
        }
      }

      // ผ่านเงื่อนไข → อนุญาตให้เพิ่ม
      setCell(slotIndex, subIndex, (cg) => ({
        graphTypeId: graphTypeToUse,
        graphInstanceUid: cg.graphInstanceUid ?? null,
        paramIds: Array.from(new Set([...(cg.paramIds ?? []), paramId])),
      }));

      // sync graph type (ถ้าต้องเก็บลง backend)
      if (target.HardwareGraphID !== graphTypeToUse) {
        handleChange(paramId, "HardwareGraphID", graphTypeToUse);
      }
      // Single ⇒ L=false, Split ⇒ L=true
      handleChange(paramId, "LayoutDisplay", wantLayout);

      setDraggedParamId(null);
      setDragOverSlot(null);
    }
  };

  // ---------- add/remove/toggle slot ----------
  const paramCount = formValues.length;

  const addSingleSlot = () => {
    if (slots.length >= Math.max(1, paramCount)) return;
    setSlots((prev) => [...prev, { mode: "single", graphs: [null] }]);
  };

  const toggleSplitAt = (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (slot.mode === "single") {
      setSlots((prev) => {
        const next = [...prev];
        const cur = next[slotIndex];
        // คง cell เดิมไว้ที่ฝั่งซ้ายเพื่อไม่ให้กราฟ/รูปหาย
        next[slotIndex] = { mode: "split", graphs: [cur.graphs[0] ?? null, null] };
        return next;
      });
    } else {
      // merge → L=false ทุกตัวใน 2 ช่องนั้น
      const cellGraphs = slot.graphs.filter(Boolean) as CellGraph[];
      const allParamIds = new Set<number>();
      cellGraphs.forEach((cg) => cg.paramIds.forEach((pid) => allParamIds.add(pid)));
      allParamIds.forEach((pid) => handleChange(pid, "LayoutDisplay", false));

      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { mode: "single", graphs: [null] };
        return next;
      });
    }
  };

  const removeGraphFromSlot = (slotIndex: number, subIndex: number | null) => {
    const slot = slots[slotIndex];
    const idx = slot.mode === "single" ? 0 : subIndex ?? 0;
    const cell = slot.graphs[idx];
    if (!cell) return;

    // L=false ให้พารามิเตอร์ทั้งหมดใน cell นี้
    cell.paramIds.forEach((pid) => handleChange(pid, "LayoutDisplay", false));

    setSlots((prev) => {
      const next = [...prev];
      const s = { ...next[slotIndex], graphs: [...next[slotIndex].graphs] };
      s.graphs[idx] = null;
      next[slotIndex] = s;
      return next;
    });
  };

  const removeParamFromCell = (slotIndex: number, subIndex: number | null, paramId: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const idx = subIndex ?? 0;
      const s = { ...next[slotIndex], graphs: [...next[slotIndex].graphs] };
      const cell = s.graphs[idx];
      if (!cell) return prev;
      s.graphs[idx] = { ...cell, paramIds: cell.paramIds.filter((id) => id !== paramId) };
      next[slotIndex] = s;
      return next;
    });

    // ถ้าไม่ได้ใช้ใน cell อื่นเลย → L=false
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
  };

  const clearParamsInCell = (slotIndex: number, subIndex: number | null) => {
    const slot = slots[slotIndex];
    const idx = slot.mode === "single" ? 0 : subIndex ?? 0;
    const cell = slot.graphs[idx];
    if (!cell) return;

    cell.paramIds.forEach((pid) => handleChange(pid, "LayoutDisplay", false));

    setSlots((prev) => {
      const next = [...prev];
      const s = { ...next[slotIndex], graphs: [...next[slotIndex].graphs] };
      s.graphs[idx] = { ...(cell ?? { graphTypeId: null, graphInstanceUid: null, paramIds: [] }), paramIds: [] };
      next[slotIndex] = s;
      return next;
    });
  };

  const deleteSlot = (slotIndex: number) => {
    const slot = slots[slotIndex];
    const cellGraphs = slot.graphs.filter(Boolean) as CellGraph[];
    const allParamIds = new Set<number>();
    cellGraphs.forEach((cg) => cg.paramIds.forEach((pid) => allParamIds.add(pid)));
    allParamIds.forEach((pid) => handleChange(pid, "LayoutDisplay", false));
    setSlots((prev) => prev.filter((_, i) => i !== slotIndex));
  };

  // ---------- Parameters list: ซ่อนตัวที่ถูกใช้ใน layout ----------
  const usedParamIds = useMemo(() => {
    const s = new Set<number>();
    slots.forEach((sl) => sl.graphs.forEach((cg) => cg?.paramIds.forEach((id) => s.add(id))));
    return s;
  }, [slots]);

  const visibleParams = useMemo(
    () => formValues.filter((p) => !usedParamIds.has(p.ID)),
    [formValues, usedParamIds]
  );

  // ---------- GroupDisplay AUTO: มี >=2 พารามิเตอร์ใน cell ใด ๆ ⇒ กลุ่มอัตโนมัติ ----------
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
    // อัปเดตค่า GroupDisplay อัตโนมัติ (true เฉพาะตัวที่อยู่ในกลุ่ม ≥2, นอกนั้น false)
    setFormValues((prev) =>
      prev.map((p) =>
        p.GroupDisplay === grouped.has(p.ID)
          ? p
          : { ...p, GroupDisplay: grouped.has(p.ID) }
      )
    );
  }, [slots]);

  // ---------- save ----------
  // NOTE: L=true เฉพาะที่อยู่ใน split slots
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

        if (
          !old ||
          old.HardwareGraphID !== cur.HardwareGraphID ||
          old.HardwareParameterColorID !== cur.HardwareParameterColorID
        ) {
          updates.push(
            UpdateHardwareParameterByID(cur.ID, {
              hardware_graph_id: cur.HardwareGraphID,
              hardware_parameter_color_id: cur.HardwareParameterColorID,
            })
          );
        }

        if (!old || old.GroupDisplay !== cur.GroupDisplay) {
          updates.push(UpdateGroupDisplay(cur.ID, { group_display: cur.GroupDisplay }));
        }

        const desiredLayout = willLayoutTrue.has(cur.ID);
        if (!old || old.LayoutDisplay !== desiredLayout) {
          updates.push(UpdateLayoutDisplay(cur.ID, { layout_display: desiredLayout }));
        }
      });

      await Promise.all(updates);

      saveLayoutToStorage({ slots, instances });

      setInitialValues(deepClone(formValues));
      message.success("Update Success!");
      if (onSuccess) await onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      message.error("Update Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1960}
      style={{ top: 12, maxWidth: "128vw" }}
      bodyStyle={{
        padding: 0,
        maxHeight: "88vh",
        overflowY: "auto",
        borderRadius: 18,
        background: "#f7f7f8",
      }}
      title=""
      className="paddings"
    >
      <div className="flex justify-center items-center w-full mt-5 mb-6">
        <span className="text-center text-[20px] font-bold bg-emerald-600 text-white py-2 px-8 mt-5 rounded-xl shadow select-none tracking-wide">
          Edit Parameters and Graph
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Spin size="large" />
        </div>
      ) : (
        <div className="px-4 md:px-7 pb-6 pt-0 w-full">
          {/* สองคอลัมน์: ซ้าย(Add Graph + Parameters) : ขวา(Layout) */}
          <div className="grid gap-6" style={{ gridTemplateColumns: "1.35fr 1fr" }}>
            {/* LEFT */}
            <div className="space-y-6">
              {/* Add Graph */}
              <div className="bg-white rounded-xl shadow border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800">Add Graph</span>
                  <Select
                    value={addingTypeId}
                    onChange={setAddingTypeId}
                    style={{ width: 220 }}
                    options={graphTypes.map((g) => ({ label: g.name, value: g.id }))}
                    size="small"
                  />
                  <Button size="small" type="primary" onClick={addGraphInstance}>
                    + Add Graph
                  </Button>
                </div>
                {instances.length === 0 ? (
                  <div className="text-gray-500 text-sm mt-3">
                    ยังไม่มีกราฟ (สร้างด้วยปุ่ม + Add Graph)
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {instances.map((inst) => {
                      const meta = graphMeta(inst.graphTypeId)!;
                      return (
                        <div
                          key={inst.uid}
                          className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                          draggable
                          onDragStart={() => handleGraphInstanceDragStart(inst)}
                          onDragEnd={handleGraphInstanceDragEnd}
                          title="Drag this graph instance into the Layout"
                        >
                          <Image
                            src={meta.img}
                            alt={meta.name}
                            preview={false}
                            style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 10, border: "1px solid #eee" }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-gray-800 truncate">{inst.name}</div>
                            <div className="text-xs text-gray-500 truncate">{meta.name}</div>
                          </div>
                          <Tag className="ml-auto text-[11px]" color="blue">
                            Drag me to Layout
                          </Tag>
                          <Popconfirm
                            title="Remove this graph instance?"
                            okText="Remove"
                            cancelText="Cancel"
                            onConfirm={() => removeGraphInstance(inst.uid)}
                          >
                            <Button size="small" danger>Remove</Button>
                          </Popconfirm>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Parameters (ซ่อนตัวที่ถูกใช้ใน layout แล้ว) */}
              <div className="bg-white rounded-xl shadow border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800">Parameters</span>
                  <Tag className="text-[11px]">{visibleParams.length}</Tag>
                </div>

                {visibleParams.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    ทุกพารามิเตอร์ถูกใช้อยู่ใน Layout แล้ว
                  </div>
                ) : (
                  <div
                    className={`flex flex-col gap-2 ${
                      visibleParams.length > 7 ? "max-h-80 overflow-y-auto pr-1" : ""
                    } scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent`}
                  >
                    {visibleParams.map((rowParam) => (
                      <div
                        key={rowParam.ID}
                        className="inline-flex items-center bg-gray-50 rounded-lg px-3 py-2 cursor-move border border-gray-200 w-full"
                        style={{ minHeight: 44, gap: 10, justifyContent: "space-between" }}
                        draggable
                        onDragStart={() => handleParamDragStart(rowParam.ID)}
                        onDragEnd={handleParamDragEnd}
                        title="Drag parameter into a Layout cell"
                      >
                        <div className="flex items-center gap-2 w-full justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="font-medium text-gray-700"
                              style={{
                                fontSize: 13.5,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 260,
                              }}
                              title={rowParam.Parameter}
                            >
                              {rowParam.Parameter}
                            </span>
                            <Form.Item style={{ marginBottom: 0 }}>
                              <Select
                                value={rowParam.HardwareParameterColorID}
                                onChange={(v) =>
                                  handleChange(rowParam.ID, "HardwareParameterColorID", v)
                                }
                                options={colorOptions}
                                size="small"
                                className="no-arrow-select"
                                style={{ width: 36, minWidth: 32 }}
                                dropdownStyle={{ minWidth: 70, padding: 6 }}
                              />
                            </Form.Item>
                          </div>

                          <div className="hidden 2xl:flex items-center gap-1">
                            <Tag
                              className="rounded-md px-2 py-0.5 text-[11px]"
                              color={rowParam.GroupDisplay ? "green" : "default"}
                            >
                              Group {rowParam.GroupDisplay ? "On" : "Off"}
                            </Tag>
                            <Tag
                              className="rounded-md px-2 py-0.5 text-[11px]"
                              color={rowParam.LayoutDisplay ? "geekblue" : "default"}
                            >
                              Layout {rowParam.LayoutDisplay ? "On" : "Off"}
                            </Tag>
                          </div>

                          <div className="flex items-center gap-3">
                            <Tooltip title="ตั้งอัตโนมัติเมื่อมี ≥ 2 พารามิเตอร์ใน cell เดียวกัน" placement="top">
                              <Switch
                                size="small"
                                checked={rowParam.GroupDisplay}
                                disabled
                                checkedChildren="G"
                                unCheckedChildren="G"
                              />
                            </Tooltip>
                            <Tooltip title="แสดงในเลย์เอาต์ (Single=Off, Split=On)" placement="top">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Layout Area */}
            <div className="space-y-5">
              <div className="bg-white rounded-xl shadow border border-gray-100 px-5 py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] font-semibold text-gray-800">Layout Area</span>
                    <Tag className="rounded-md text-[11px]">
                      Singles: {slots.filter((s) => s.mode === "single").length}/{Math.max(1, formValues.length)}
                    </Tag>
                    {hasUnsavedChanges && (
                      <Tag color="orange" className="rounded-md text-[11px]">Unsaved changes</Tag>
                    )}
                  </div>
                  <Button
                    size="small"
                    onClick={addSingleSlot}
                    disabled={slots.length >= Math.max(1, formValues.length)}
                  >
                    + Add Single Slot
                  </Button>
                </div>

                <div className="mt-3 flex flex-col gap-4">
                  {slots.map((slot, slotIdx) => {
                    const isSplit = slot.mode === "split";
                    const subCount = isSplit ? 2 : 1;
                    return (
                      <div key={slotIdx} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Slot {slotIdx + 1}</span>
                            <Tag color={isSplit ? "blue" : "default"} className="text-[11px]">
                              {isSplit ? "Split (L=ON)" : "Single (L=OFF)"}
                            </Tag>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="small" onClick={() => toggleSplitAt(slotIdx)}>
                              {isSplit ? "Merge to Single" : "Split this Slot"}
                            </Button>
                            <Popconfirm
                              title="Delete this slot?"
                              okText="Delete"
                              cancelText="Cancel"
                              onConfirm={() => deleteSlot(slotIdx)}
                              disabled={slots.length <= 1}
                            >
                              <Button size="small" danger disabled={slots.length <= 1}>
                                Delete Slot
                              </Button>
                            </Popconfirm>
                          </div>
                        </div>

                        <div className={`grid gap-3 ${isSplit ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                          {Array.from({ length: subCount }).map((_, subIdx) => {
                            const cell = slot.graphs[subIdx ?? 0];
                            const meta = graphMeta(cell?.graphTypeId ?? null);

                            return (
                              <div
                                key={subIdx}
                                className={`rounded-lg border border-dashed p-3 ${
                                  dragOverSlot?.slot === slotIdx && dragOverSlot?.sub === (isSplit ? subIdx : null)
                                    ? "border-blue-400 bg-blue-50"
                                    : "border-gray-300 bg-gray-50"
                                }`}
                                onDragOver={(e) => handleDragOverSlot(slotIdx, isSplit ? subIdx : null, e)}
                                onDrop={() => handleDropOnSlot(slotIdx, isSplit ? subIdx : null)}
                                title={isSplit ? "Drop graph/parameter (L = true)" : "Drop graph/parameter (L = false)"}
                              >
                                {/* header */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {cell?.graphTypeId ? (
                                      <>
                                        <Image
                                          src={meta?.img}
                                          alt={meta?.name}
                                          preview={false}
                                          style={{ width: 42, height: 42, objectFit: "contain", borderRadius: 8 }}
                                        />
                                        <div className="text-sm font-semibold truncate">
                                          {meta?.name}
                                          {/* เอา uid ออก: ไม่แสดง "— xxx" อีกต่อไป */}
                                        </div>
                                        <Tag className="ml-1" color="geekblue" style={{ borderRadius: 6 }}>
                                          {cell.paramIds.length} param
                                        </Tag>
                                      </>
                                    ) : (
                                      <div className="text-gray-500 text-sm">Drop a graph instance or parameter</div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {cell?.graphTypeId && (
                                      <>
                                        <Button
                                          size="small"
                                          onClick={() => clearParamsInCell(slotIdx, isSplit ? subIdx : null)}
                                        >
                                          Clear Params
                                        </Button>
                                        <Button
                                          size="small"
                                          danger
                                          onClick={() => removeGraphFromSlot(slotIdx, isSplit ? subIdx : null)}
                                        >
                                          Remove Graph
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* param tags ใน cell */}
                                {cell?.graphTypeId && (
                                  <div className="flex flex-wrap gap-2">
                                    {cell.paramIds.length === 0 ? (
                                      <span className="text-xs text-gray-500">
                                        Drag parameters here…
                                      </span>
                                    ) : (
                                      cell.paramIds.map((pid) => (
                                        <Tag
                                          key={pid}
                                          closable
                                          onClose={(e) => {
                                            e.preventDefault();
                                            removeParamFromCell(slotIdx, isSplit ? subIdx : null, pid);
                                          }}
                                          className="px-2 py-1"
                                        >
                                          {getParamName(pid)}
                                        </Tag>
                                      ))
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

                <div className="flex justify-end gap-2 pt-4">
                  <Button onClick={onClose} size="small" className="rounded-md font-semibold px-4 h-[34px] text-[14px] border">
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || saving}
                    size="small"
                    className="rounded-md font-semibold px-4 h-[34px] text-[14px]"
                  >
                    Save All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditParameterModal;
