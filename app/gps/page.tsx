// app/gps/page.tsx
"use client"; // PENTING: Menandakan ini adalah Client Component karena menggunakan state dan API browser

import { useState, useRef, useEffect } from "react";

export default function GpsSenderPage() {
  const [apiKey, setApiKey] = useState("");
  const [tripId, setTripId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusText, setStatusText] = useState("Menunggu untuk dimulai...");
  const [logs, setLogs] = useState<string[]>([]);

  // useRef digunakan untuk menyimpan ID dari watchPosition tanpa memicu re-render
  const watchIdRef = useRef<number | null>(null);

  const BFF_URL = "https://backend-inhan-mobile-production.up.railway.app"; // URL BFF Anda di Railway

  // Fungsi untuk menambahkan log baru ke tampilan
  const addLog = (message: string, isError: boolean = false) => {
    const now = new Date().toLocaleTimeString();
    const logMessage = `${now}: ${message}`;
    // Menambahkan log baru di paling atas array
    setLogs((prevLogs) => [logMessage, ...prevLogs]);
  };

  // Fungsi untuk mengirim data ke server BFF
  const sendDataToServer = async (latitude: number, longitude: number) => {
    if (!apiKey || !tripId) return;

    const locationUrl = `${BFF_URL}/api/v1/devices/location`;
    const payload = { tripId, latitude, longitude };

    try {
      addLog(
        `Mengirim: Lat=${latitude.toFixed(6)}, Lon=${longitude.toFixed(6)}`
      );
      const response = await fetch(locationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      addLog(
        `Respons Server: ${response.status} ${response.statusText}`,
        !response.ok
      );
      if (!response.ok) {
        const errorData = await response.json();
        addLog(`Detail Error: ${JSON.stringify(errorData)}`, true);
      }
    } catch (error: any) {
      addLog(`Gagal mengirim: ${error.message}`, true);
    }
  };

  const onLocationUpdate = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    setStatusText(
      `Lat: ${latitude.toFixed(6)}\nLon: ${longitude.toFixed(
        6
      )}\nAkurasi: ${accuracy.toFixed(1)} meter`
    );
    sendDataToServer(latitude, longitude);
  };

  const onLocationError = (error: GeolocationPositionError) => {
    setStatusText(`ERROR GPS (${error.code}): ${error.message}`);
    addLog(`Error GPS: ${error.message}`, true);
    stopSending();
  };

  const startSending = () => {
    if (!apiKey || !tripId) {
      alert("Harap isi API Key dan Trip ID!");
      return;
    }

    if ("geolocation" in navigator) {
      addLog("Memulai pelacakan GPS...");
      setIsSending(true);

      watchIdRef.current = navigator.geolocation.watchPosition(
        onLocationUpdate,
        onLocationError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation tidak didukung di browser ini.");
    }
  };

  const stopSending = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      addLog("Pelacakan GPS dihentikan.");
      setIsSending(false);
      setStatusText("Dihentikan.");
    }
  };

  // Efek untuk membersihkan watchPosition jika komponen di-unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Menggunakan gaya inline untuk kesederhanaan, bisa dipindah ke file CSS terpisah
  const styles = {
    main: {
      maxWidth: "600px",
      margin: "20px auto",
      fontFamily: "sans-serif",
      background: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    },
    inputGroup: { marginBottom: "15px" },
    label: {
      display: "block",
      marginBottom: "5px",
      fontWeight: "bold" as "bold",
    },
    input: {
      width: "calc(100% - 22px)",
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "1em",
    },
    buttons: { display: "flex", gap: "10px" },
    button: {
      flexGrow: 1,
      padding: "12px",
      fontSize: "1.1em",
      border: "none",
      borderRadius: "4px",
      color: "white",
      cursor: "pointer",
    },
    logBox: {
      marginTop: "20px",
      background: "#222",
      color: "#0f0",
      padding: "15px",
      borderRadius: "4px",
      fontFamily: "Courier New, monospace",
      height: "200px",
      overflowY: "auto" as "auto",
      whiteSpace: "pre-wrap" as "pre-wrap",
      wordWrap: "break-word" as "break-word",
    },
  };

  return (
    <main style={styles.main}>
      <h1 style={{ textAlign: "center" }}>GPS Sender (Next.js)</h1>

      <div style={styles.inputGroup}>
        <label htmlFor="apiKey" style={styles.label}>
          API Key Perangkat
        </label>
        <input
          type="text"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Masukkan API Key dari seeder..."
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <label htmlFor="tripId" style={styles.label}>
          Trip ID
        </label>
        <input
          type="text"
          id="tripId"
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
          placeholder="Masukkan Trip ID yang aktif..."
          style={styles.input}
        />
      </div>

      <div style={styles.buttons}>
        <button
          onClick={startSending}
          disabled={isSending}
          style={{
            ...styles.button,
            backgroundColor: isSending ? "#aaa" : "#28a745",
          }}
        >
          Mulai Mengirim
        </button>
        <button
          onClick={stopSending}
          disabled={!isSending}
          style={{
            ...styles.button,
            backgroundColor: !isSending ? "#aaa" : "#dc3545",
          }}
        >
          Berhenti
        </button>
      </div>

      <h2 style={{ marginTop: "30px" }}>Status & Info</h2>
      <div id="status" style={styles.logBox}>
        {statusText}
      </div>

      <h2>Log Pengiriman</h2>
      <div id="logs" style={styles.logBox}>
        {logs.map((log, index) => (
          <p key={index} style={{ margin: 0, borderBottom: "1px solid #444" }}>
            {log}
          </p>
        ))}
      </div>
    </main>
  );
}
