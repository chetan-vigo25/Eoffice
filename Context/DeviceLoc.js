import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Location from 'expo-location';

// Create a context
const DeviceLocationContext = createContext();

// Create a provider component
export const DeviceLocationProvider = ({ children }) => {

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setAddress(address);
    })();
  }, []);

  let fullAddress = 'Waiting...';
  if (errorMsg) {
    fullAddress = errorMsg;
  } else if (address) {
    fullAddress = address.length > 0 ? `${address[0].formattedAddress}` : 'No address found';
  } else if (location) {
    fullAddress = JSON.stringify(location);
  }

  return (
    <DeviceLocationContext.Provider value={{ location, address, errorMsg, }}>
      {children}
    </DeviceLocationContext.Provider>
  );
};

export const useDeviceLocation = () => useContext(DeviceLocationContext);