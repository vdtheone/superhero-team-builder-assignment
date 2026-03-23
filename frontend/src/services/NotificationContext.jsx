import { createContext, useState, useContext, useCallback } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = "info") => {
    setNotification({ message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  let bgColor;
  switch (notification?.type) {
    case "success":
      bgColor = "bg-green-500";
      break;
    case "error":
      bgColor = "bg-red-500";
      break;
    default:
      bgColor = "bg-blue-500";
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <div className={`fixed top-5 right-5 px-6 py-3 rounded shadow-lg text-white z-50 transition-all duration-300 ${bgColor}`}>
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);