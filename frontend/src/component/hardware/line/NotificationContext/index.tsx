import React, { createContext, useContext, useState } from "react";

interface NotificationContextType {
  reloadKey: number;
  triggerReload: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [reloadKey, setReloadKey] = useState(0);

  const triggerReload = () => setReloadKey((prev) => prev + 1);

  return (
    <NotificationContext.Provider value={{ reloadKey, triggerReload }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
};
