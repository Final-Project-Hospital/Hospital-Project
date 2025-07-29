import React from "react";

interface NotificationItemProps {
  title: string;
  description: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ title, description }) => {
  return (
    <div className="flex gap-5 border-b p-3 items-start">
      <div className="flex flex-col w-full">
        <div
          className="font-semibold text-xs rounded-full px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-400 text-white w-fit shadow-sm"
          style={{
            backgroundImage: "linear-gradient(to right, #14b8a6, #22d3ee)",
          }}
        >
          {title}
        </div>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
};

export default NotificationItem;
