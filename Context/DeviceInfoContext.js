import React, { createContext, useState, useEffect } from 'react';
import * as Device from 'expo-device';

export const DeviceInfoContext = createContext();

export const DeviceInfoProvider = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      try {
        const totalMemoryInGB = (Device.totalMemory / Math.pow(1024, 3)).toFixed(2);
         const info = {
           modelName: Device.modelName,
           brand: Device.brand,
           osName: Device.osName,
           memory: totalMemoryInGB,
           version: Device.osVersion,
           deviceYearClass: Device.deviceYearClass,
         };
        setDeviceInfo(info);
      } catch (error) {
        console.error('Error fetching device info:', error);
      }
    };
    fetchDeviceInfo();
  }, []);

  return (
    <DeviceInfoContext.Provider value={deviceInfo}>
      {children}
    </DeviceInfoContext.Provider>
  );
};
