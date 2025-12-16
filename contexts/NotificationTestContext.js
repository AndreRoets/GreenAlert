import React, { createContext, useState, useContext } from 'react';

const NotificationTestContext = createContext();

export const useNotificationTest = () => useContext(NotificationTestContext);

export const NotificationTestProvider = ({ children }) => {
  const [testNotification, setTestNotification] = useState(null);

  const triggerTestNotification = (notification) => {
    setTestNotification({ ...notification, id: Date.now() });
  };

  return (
    <NotificationTestContext.Provider value={{ testNotification, triggerTestNotification }}>
      {children}
    </NotificationTestContext.Provider>
  );
};