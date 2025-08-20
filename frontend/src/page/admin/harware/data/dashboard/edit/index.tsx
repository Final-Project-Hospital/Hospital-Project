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

// โครงสร้างของ cell ใน layout
type CellGraph = {
  graphTypeId: number | null;       // 1..4
  graphInstanceUid?: string | null; // uid ของ instance
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

// ประเภทกราฟ
const graphTypes = [
  { id: 1, name: "กราฟเส้น (ค่าเริ่มต้น)", img: LineChartingImg },
  { id: 2, name: "กราฟพื้นที่ (Area)", img: AreaChartingImg },
  { id: 3, name: "กราฟ Color Mapping", img: MappingImg },
  { id: 4, name: "กราฟ Stacked", img: StackChartingImg },
];

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const STORAGE_KEY = (hardwareID: number) => `hw-layout-v2-${hardwareID}`;

// instance ของกราฟ
type GraphInstance = {
  uid: string;
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
  // ใช้ตรวจว่ามีการแก้ layout/instances เพื่อเปิดปุ่ม "บันทึกทั้งหมด"
  const [layoutDirty, setLayoutDirty] = useState(false);

  // ---- Graph Instances
  const [instances, setInstances] = useState<GraphInstance[]>([]);
  const [addingTypeId, setAddingTypeId] = useState<number>(1);

  // ---------- helpers ----------
  const graphMeta = (typeId: number | null | undefined) =>
    graphTypes.find((g) => g.id === (typeId ?? 0));

  const getInstanceByUid = (u?: string | null) =>
    instances.find((it) => it.uid === u);

  const handleChange = (id: number, field: keyof ParamRow, value: any) => {
    setFormValues((prev) => prev.map((it) => (it.ID === id ? { ...it, [field]: value } : it)));
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

      const cleanedInstances = (Array.isArray(parsed.instances) ? parsed.instances : [])
        .filter((it) => it && typeof it.uid === "string" && [1,2,3,4].includes(it.graphTypeId));

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

        const fromStore = loadLayoutFromStorage(rows);
        if (fromStore?.slots?.length) {
          setSlots(fromStore.slots);
          setInstances(fromStore.instances ?? []);
        } else {
          setSlots(buildInitialSlots());
          setInstances([]);
        }

        setLayoutDirty(false); // reset สถานะ dirty หลังโหลด

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
        old.HardwareParameterColorID !== cur.HardwareParameterColorID
      ) {
        return true;
      }
    }
    return false;
  }, [initialValues, formValues]);

  const canSave = useMemo(() => hasUnsavedChanges || layoutDirty, [hasUnsavedChanges, layoutDirty]);

  // ---------- Graph Instances ----------
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
  const removeParamFromCell = (slotIndex: number, subIndex: number | null, paramId: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const idx = subIndex ?? 0;
      const s = { ...next[slotIndex], graphs: [...next[slotIndex].graphs] };
      const cell = s.graphs[idx];
      if (!cell) return prev;

      const newParamIds = cell.paramIds.filter((id) => id !== paramId);
      s.graphs[idx] =
        newParamIds.length === 0
          ? null
          : { ...cell, paramIds: newParamIds };

      next[slotIndex] = s;
      return next;
    });

    // อัปเดต LayoutDisplay ถ้า parameter ไม่ถูกใช้ที่อื่น
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

  // ---------- รายการพารามิเตอร์: ซ่อนตัวที่ถูกใช้ใน layout ----------
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
      prev.map((p) =>
        p.GroupDisplay === grouped.has(p.ID)
          ? p
          : { ...p, GroupDisplay: grouped.has(p.ID) }
      )
    );
  }, [slots]);

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
          <div className="grid gap-6 xl:[grid-template-columns:1.35fr_1fr]">
            {/* ซ้าย: รายการกราฟ + พารามิเตอร์ */}
            <div className="order-2 xl:order-1 space-y-6">
              {/* เพิ่มกราฟ */}
              <div className="bg-white rounded-xl shadow border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800">เพิ่มกราฟ</span>
                  <Select
                    value={addingTypeId}
                    onChange={setAddingTypeId}
                    style={{ width: 240, maxWidth: "100%" }}
                    options={graphTypes.map((g) => ({ label: g.name, value: g.id }))}
                    size="small"
                  />
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
                          title="ลากกล่องกราฟนี้ไปวางในเลย์เอาต์"
                        >
                          <Image
                            src={meta.img}
                            alt={meta.name}
                            preview={false}
                            style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 10, border: "1px solid #eee" }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-gray-800 truncate max-w-[140px] sm:max-w-[180px]">
                              {inst.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[140px] sm:max-w-[180px]">
                              {meta.name}
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
                  <div className="text-gray-500 text-sm">
                    ทุกพารามิเตอร์ถูกใช้อยู่ในเลย์เอาต์แล้ว
                  </div>
                ) : (
                  <div
                    className={`flex flex-col gap-2 ${
                      visibleParams.length > 7 ? "max-h-[60vh] overflow-y-auto pr-1" : ""
                    }`}
                  >
                    {visibleParams.map((rowParam) => (
                      <div
                        key={rowParam.ID}
                        className="inline-flex items-center bg-gray-50 rounded-lg px-3 py-2 cursor-mmove border border-gray-200 w-full hover:bg-gray-100 transition"
                        style={{ minHeight: 44, gap: 10, justifyContent: "space-between" }}
                        draggable
                        onDragStart={() => handleParamDragStart(rowParam.ID)}
                        onDragEnd={handleParamDragEnd}
                        title="ลากพารามิเตอร์ไปวางในเลย์เอาต์"
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

                          <Tooltip title="ตั้งค่าเป็น 'รวมกลุ่ม' อัตโนมัติเมื่อมี ≥ 2 พารามิเตอร์ในช่องเดียวกัน" placement="top">
                            <Switch
                              size="small"
                              checked={rowParam.GroupDisplay}
                              disabled
                              checkedChildren="G"
                              unCheckedChildren="G"
                            />
                          </Tooltip>
                          <Tooltip title="การแสดงในเลย์เอาต์ (เดี่ยว=ปิด, แบ่งสอง=เปิด)" placement="top">
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

            {/* ขวา: พื้นที่เลย์เอาต์ */}
            <div className="order-1 xl:order-2 space-y-5">
              <div className="bg-white rounded-xl shadow border border-gray-100 px-4 sm:px-5 py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] md:text-[17px] font-semibold text-gray-800">พื้นที่เลย์เอาต์</span>
                    <Tag className="rounded-md text-[11px]">
                      แถวเดี่ยว: {slots.filter((s) => s.mode === "single").length}/{Math.max(1, formValues.length)}
                    </Tag>
                    {canSave && (
                      <Tag color="orange" className="rounded-md text-[11px]">มีการเปลี่ยนแปลง</Tag>
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
                                className={`relative rounded-xl border p-3 min-h-[140px] transition ${
                                  isOver
                                    ? "border-teal-400 bg-teal-50"
                                    : "border-gray-300 bg-gray-50"
                                }`}
                                onDragOver={(e) => handleDragOverSlot(slotIdx, isSplit ? subIdx : null, e)}
                                onDrop={() => handleDropOnSlot(slotIdx, isSplit ? subIdx : null)}
                                title={isSplit ? (subIdx === 0 ? "ช่องซ้าย" : "ช่องขวา") : "ช่องเดี่ยว"}
                              >
                                {/* ส่วนหัวของ cell */}
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
                                      <div className="text-gray-500 text-sm">ลากกราฟหรือพารามิเตอร์มาวางที่นี่</div>
                                    )}
                                  </div>
                                </div>

                                {/* รายการพารามิเตอร์ใน cell */}
                                {cell?.graphTypeId && (
                                  <div className="flex flex-wrap gap-2">
                                    {cell.paramIds.length === 0 ? (
                                      <span className="text-xs text-gray-500">
                                        ลากพารามิเตอร์มาวางที่นี่…
                                      </span>
                                    ) : (
                                      cell.paramIds.map((pid) => {
                                        const color = getParamColorCode(pid);
                                        return (
                                          <Tag
                                            key={pid}
                                            closable
                                            onClose={(e) => {
                                              e.preventDefault();
                                              removeParamFromCell(slotIdx, isSplit ? subIdx : null, pid);
                                            }}
                                            className="px-2 py-1"
                                          >
                                            <span
                                              style={{
                                                display: "inline-block",
                                                width: 8,
                                                height: 8,
                                                borderRadius: 999,
                                                background: color || "#8b8b8b",
                                                marginRight: 6,
                                                border: "1px solid #d1d5db",
                                                verticalAlign: "middle",
                                              }}
                                            />
                                            {getParamName(pid)}
                                          </Tag>
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

      {/* สไตล์เสริมเฉพาะคอมโพเนนต์นี้ */}
      <style>{`
        /* มือถือ: ขยับโมดัลลงมาอีกหน่อย และคง padding ด้านข้าง */
        @media (max-width: 640px) {
          .ant-modal-root .ant-modal { 
            padding: 0 8px; 
            top: 56px !important; /* ดันลงมาจากขอบบน */
          }
        }
      `}</style>
    </Modal>
  );
};

export default EditParameterModal;
