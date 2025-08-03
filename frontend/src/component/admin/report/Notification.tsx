import React, { useState } from "react";
import { Tabs } from "antd";
import { MdOutlineCancel } from "react-icons/md";
import { useStateContext } from "../../../contexts/ContextProvider";
import NotificationHardware from "./hardware";
import NotificationSoftware from "./software";

const { TabPane } = Tabs;

const Notification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"hardware" | "software">("hardware");
  const [hardwareCount, setHardwareCount] = useState<number>(0);
  const [softwareCount, setSoftwareCount] = useState<number>(0);
  const { handleClick } = useStateContext();

  const currentCount = activeTab === "hardware" ? hardwareCount : softwareCount;

  return (
    <div className="z-50 nav-item absolute right-1 md:right-40 top-16 bg-white rounded-lg w-96 shadow paddings">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">Report Notifications</span>
          <span className="inline-flex items-center justify-center h-6 text-white text-xs rounded-full px-3 py-1 font-semibold bg-gradient-to-r from-teal-500 to-cyan-400 shadow-sm">
            {currentCount} message
          </span>
        </div>
        <button
          type="button"
          className="text-gray-400 hover:bg-gray-100 rounded-full p-2 transition"
          onClick={() => handleClick("notification")}
          aria-label="Close"
        >
          <MdOutlineCancel size={24} />
        </button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "hardware" | "software")}
        size="small"
        centered
        className="font-semibold"
      >
        <TabPane tab="Hardware" key="hardware">
          <NotificationHardware onCountChange={setHardwareCount} />
        </TabPane>
        <TabPane tab="Software" key="software">
          <NotificationSoftware onCountChange={setSoftwareCount} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Notification;
