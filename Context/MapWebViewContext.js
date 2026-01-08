import React, { createContext, useContext, useMemo } from "react";
import { useDeviceLocation } from "./DeviceLoc";

const MapWebViewContext = createContext(null);

export const MapWebViewProvider = ({ latitude, longitude, children }) => {
  const { location, address, errorMsg } = useDeviceLocation();
  const mapHtml = useMemo(() => {
    const latitude = location?.coords?.latitude ?? location?.latitude ?? null;
    const longitude = location?.coords?.longitude ?? location?.longitude ?? null;
    const hasLocation = typeof latitude === 'number' && typeof longitude === 'number';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>

        <script>
          const lat = ${latitude};
          const lng = ${longitude};

          const map = L.map('map').setView([lat, lng], 17);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          L.marker([lat, lng]).addTo(map)
            .bindPopup("You are here")
            .openPopup();

          L.circle([lat, lng], {
            radius: 200,
            color: '#4c72d9',
            fillColor: '#4c72d9',
            fillOpacity: 0.2
          }).addTo(map);
        </script>
      </body>
      </html>
    `;
  }, [latitude, longitude]);

  return (
    <MapWebViewContext.Provider value={{ mapHtml }}>
      {children}
    </MapWebViewContext.Provider>
  );
};

export const useMapWebView = () => {
  return useContext(MapWebViewContext);
};
