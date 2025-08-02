// 📁 EditParameterModal.tsx
import React, { useEffect, useState } from "react";
import { Modal, Form, Select, Button, message, Spin, Image, Switch } from "antd";
import {
  UpdateHardwareParameterByID,
  ListHardwareParameterByHardwareID,
  ListHardwareColors,
  UpdateGroupDisplay,
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

const graphImages = [
  { id: 1, name: "Default Graph", img: LineChartingImg },
  { id: 2, name: "Area", img: AreaChartingImg },
  { id: 3, name: "Color Mapping", img: MappingImg },
  { id: 4, name: "Stacked", img: StackChartingImg },
];

const graphRows = [
  graphImages.slice(0, 2),
  graphImages.slice(2, 4),
];

const EditParameterModal: React.FC<EditParameterModalProps> = ({
  open,
  onClose,
  hardwareID,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<any[]>([]);
  const [colorOptions, setColorOptions] = useState<any[]>([]);
  const [draggedParamId, setDraggedParamId] = useState<number | null>(null);
  const [dragOverGraphId, setDragOverGraphId] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !hardwareID) return;
    setLoading(true);
    Promise.all([
      ListHardwareParameterByHardwareID(hardwareID),
      ListHardwareColors(),
    ])
      .then(([params, colors]) => {
        if (!params) return;
        setFormValues(
          params.map((p: any) => ({
            ID: p.ID,
            Parameter: p.Parameter,
            GroupDisplay: p.GroupDisplay,
            HardwareGraphID: p.HardwareGraph?.ID,
            HardwareParameterColorID: p.HardwareParameterColor?.ID,
            HardwareParameterColorCode: p.HardwareParameterColor?.Code,
          }))
        );
        if (colors) {
          setColorOptions(
            colors.map((color: any) => ({
              value: color.ID,
              label: (
                <span style={{
                  display: "inline-block",
                  width: 13,
                  height: 13,
                  background: color.Code,
                  borderRadius: 7,
                  border: "1px solid #bbb",
                  verticalAlign: "middle"
                }} title={color.Color} />
              ),
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [open, hardwareID]);

  const handleChange = (id: number, field: string, value: any) => {
    setFormValues((prev) =>
      prev.map((item) =>
        item.ID === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDragStart = (paramId: number) => setDraggedParamId(paramId);
  const handleDragEnd = () => {
    setDraggedParamId(null);
    setDragOverGraphId(null);
  };
  const handleDragOverGraph = (graphId: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverGraphId(graphId);
  };
  const handleDropOnGraph = (graphId: number) => {
    if (draggedParamId) {
      setFormValues((prev) =>
        prev.map((item) =>
          item.ID === draggedParamId
            ? { ...item, HardwareGraphID: graphId }
            : item
        )
      );
    }
    setDraggedParamId(null);
    setDragOverGraphId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        formValues.map((item) =>
          UpdateHardwareParameterByID(item.ID, {
            hardware_graph_id: item.HardwareGraphID,
            hardware_parameter_color_id: item.HardwareParameterColorID,
          })
        )
      );
      message.success("Update Success!");
      if (onSuccess) await onSuccess();
      onClose();
    } catch (e) {
      message.error("Update Failed");
    } finally {
      setSaving(false);
    }
  };

  const getParamsForGraph = (graphID: number) =>
    formValues.filter((p) => p.HardwareGraphID === graphID);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={880}
      style={{ top: 32, maxWidth: "100vw" }}
      bodyStyle={{
        padding: 0,
        minHeight: 460,
        borderRadius: 18,
        background: "#f7f7f8",
      }}
      title=""
      className="paddings"
    >
      <div className="flex justify-center items-center w-full mt-5 mb-6">
        <span className="text-center text-lg font-bold bg-emerald-600 text-white py-1.5 px-7 mt-5 rounded-xl shadow select-none tracking-wide">
          Edit Parameters and Graph
        </span>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-14">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-7 px-3 md:px-8 pb-6 pt-0 w-full">
          {graphRows.map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-5">
              {row.map((g) => (
                <div
                  key={g.id}
                  className={`flex flex-col items-center bg-white rounded-xl shadow border border-gray-100 px-3 pt-3 pb-5
                    ${dragOverGraphId === g.id ? "ring-4 ring-blue-300 ring-opacity-40" : ""}
                  `}
                  onDragOver={(e) => handleDragOverGraph(g.id, e)}
                  onDrop={() => handleDropOnGraph(g.id)}
                >
                  <Image
                    src={g.img}
                    alt={g.name}
                    preview={false}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "contain",
                      borderRadius: 12,
                      border: "1.2px solid #eee",
                      boxShadow: "0 2px 8px #0001",
                      marginBottom: 8,
                      marginTop: 2,
                      opacity: dragOverGraphId === g.id ? 0.85 : 1,
                      transition: "opacity 0.2s",
                    }}
                  />
                  <div className="font-bold text-[17px] text-gray-800 mb-2 mt-0">{g.name}</div>
                  <div className="flex flex-col gap-2 w-full min-h-[26px] items-center">
                    {getParamsForGraph(g.id).length === 0 ? (
                      <span className="text-xs text-gray-400 text-center mt-1">-</span>
                    ) : (
                      <div
                        className={`flex flex-col w-full items-center gap-2 ${
                          getParamsForGraph(g.id).length > 2
                            ? "max-h-28 overflow-y-auto pr-1"
                            : ""
                        } scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent`}
                      >
                        {getParamsForGraph(g.id).map((rowParam) => (
                          <div
                            key={rowParam.ID}
                            className="inline-flex items-center bg-gray-50 rounded-lg px-2 py-0.5 mb-0 cursor-move border border-gray-200"
                            style={{
                              opacity: draggedParamId === rowParam.ID ? 0.5 : 1,
                              minHeight: 25,
                              gap: 8,
                              width: "100%",
                              maxWidth: 220,
                              justifyContent: "space-between",
                            }}
                            draggable
                            onDragStart={() => handleDragStart(rowParam.ID)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="flex items-center gap-2 w-full justify-between">
                              <span
                                className="font-medium text-gray-700"
                                style={{
                                  fontSize: 13,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: 90,
                                }}
                                title={rowParam.Parameter}
                              >
                                {rowParam.Parameter}
                              </span>
                              <Switch
                                size="small"
                                checked={rowParam.GroupDisplay}
                                onChange={async (checked) => {
                                  handleChange(rowParam.ID, "GroupDisplay", checked);
                                  const result = await UpdateGroupDisplay(rowParam.ID, {
                                    group_display: checked,
                                  });
                                  if (!result) {
                                    message.error("Failed to update GroupDisplay");
                                  }
                                }}
                              />
                              <Form.Item style={{ marginBottom: 0 }}>
                                <Select
                                  value={rowParam.HardwareParameterColorID}
                                  onChange={(v) =>
                                    handleChange(rowParam.ID, "HardwareParameterColorID", v)
                                  }
                                  options={colorOptions}
                                  size="small"
                                  className="no-arrow-select"
                                  style={{ width: 30, minWidth: 28 }}
                                  dropdownStyle={{ minWidth: 60, padding: 6 }}
                                />
                              </Form.Item>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="flex justify-end gap-2 mt-3 pb-2">
            <Button
              onClick={onClose}
              size="small"
              className="rounded-md font-semibold px-4 h-[30px] text-[14px] border"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={handleSave}
              disabled={saving}
              size="small"
              className="rounded-md font-semibold px-4 h-[30px] text-[14px]"
            >
              Save All
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditParameterModal;
