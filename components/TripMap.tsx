// components/TripMap.tsx
"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

// --- PERBAIKAN DI SINI ---
// Hapus workaround lama dan ganti dengan yang ini.
// Impor gambar secara langsung sebagai modul.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Hapus 'delete L.Icon.Default.prototype._getIconUrl;' yang mungkin ada
// delete (L.Icon.Default.prototype as any)._getIconUrl;

// Atur ulang L.Icon.Default dengan path gambar yang sudah diimpor
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});
// --- AKHIR PERBAIKAN ---

// Komponen helper untuk memusatkan peta secara dinamis
function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]); // Tambahkan dependensi map
  return null;
}

// Props untuk komponen peta kita
interface TripMapProps {
  lastLocation: { lat: number; lon: number } | null;
  locationHistory: { lat: number; lon: number }[];
}

export default function TripMap({
  lastLocation,
  locationHistory,
}: TripMapProps) {
  const defaultPosition: [number, number] = [-6.9175, 107.6191]; // Posisi default di Bandung
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultPosition);

  useEffect(() => {
    // Setiap kali ada lokasi baru, update pusat peta
    if (lastLocation) {
      setMapCenter([lastLocation.lat, lastLocation.lon]);
    }
  }, [lastLocation]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <ChangeView center={mapCenter} zoom={16} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Menampilkan jejak (rute yang sudah ditempuh) */}
      {locationHistory.length > 0 && (
        <Polyline
          pathOptions={{ color: "blue" }}
          positions={locationHistory.map((p) => [p.lat, p.lon])}
        />
      )}

      {/* Menampilkan marker di lokasi terakhir */}
      {lastLocation && (
        <Marker position={[lastLocation.lat, lastLocation.lon]}>
          <Popup>
            Posisi Terkini Aset <br />
            Lat: {lastLocation.lat.toFixed(6)}, Lon:{" "}
            {lastLocation.lon.toFixed(6)}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
