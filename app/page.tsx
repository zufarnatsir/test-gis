// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import dynamic from "next/dynamic"; // Impor untuk dynamic import

// Lakukan dynamic import untuk komponen peta dengan menonaktifkan SSR
const TripMap = dynamic(() => import("../components/TripMap"), {
  ssr: false,
  loading: () => <p>Memuat Peta...</p>,
});

interface LocationData {
  tripId: string;
  latitude: number;
  longitude: number;
}

export default function MonitoringPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tripId, setTripId] = useState<string>("");
  const [monitoredTripId, setMonitoredTripId] = useState<string>("");

  // State untuk menyimpan data lokasi
  const [lastLocation, setLastLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [locationHistory, setLocationHistory] = useState<
    { lat: number; lon: number }[]
  >([]);

  const [connectionStatus, setConnectionStatus] =
    useState<string>("Disconnected");

  const BFF_URL = "https://backend-inhan-mobile-production.up.railway.app";

  useEffect(() => {
    // Inisialisasi koneksi socket
    const newSocket = io(BFF_URL, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () =>
      setConnectionStatus(`Connected (ID: ${newSocket.id})`)
    );
    newSocket.on("disconnect", () => setConnectionStatus("Disconnected"));

    // Listener untuk event 'locationUpdated'
    newSocket.on("locationUpdated", (data: LocationData) => {
      const newPosition = { lat: data.latitude, lon: data.longitude };
      setLastLocation(newPosition);
      setLocationHistory((prevHistory) => [...prevHistory, newPosition]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoinRoom = () => {
    if (socket && tripId) {
      // Saat join room baru, reset history dan posisi terakhir
      setLastLocation(null);
      setLocationHistory([]);
      socket.emit("joinTripRoom", tripId);
      setMonitoredTripId(tripId);
    }
  };

  const handleLeaveRoom = () => {
    if (socket && monitoredTripId) {
      socket.emit("leaveTripRoom", monitoredTripId);
      setMonitoredTripId("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <header
        style={{
          padding: "10px",
          borderBottom: "1px solid #ccc",
          background: "#eee",
        }}
      >
        <h1>BFF Real-time Trip Monitor</h1>
        <p>
          <strong>Status Koneksi:</strong>
          <span
            style={{
              color: connectionStatus.startsWith("Connected") ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {connectionStatus}
          </span>
        </p>
        <div>
          <input
            type="text"
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            placeholder="Masukkan Trip ID di sini"
            style={{ padding: "8px", marginRight: "10px", width: "300px" }}
          />
          <button
            onClick={handleJoinRoom}
            style={{ padding: "8px 12px", marginRight: "5px" }}
          >
            Pantau Trip
          </button>
          <button onClick={handleLeaveRoom} style={{ padding: "8px 12px" }}>
            Berhenti Pantau
          </button>
        </div>
        {monitoredTripId && (
          <p>
            <strong>Memantau Trip ID:</strong> {monitoredTripId}
          </p>
        )}
      </header>

      <main style={{ flexGrow: 1 }}>
        <TripMap
          lastLocation={lastLocation}
          locationHistory={locationHistory}
        />
      </main>
    </div>
  );
}
