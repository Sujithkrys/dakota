"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, Bot } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });

      if (res.ok) {
        // Success -> redirect to dashboard
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid passphrase or rate limit exceeded.");
      }
    } catch (err: unknown) {
      setError("A network error occurred while trying to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--bg-dark)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Glow Elements */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(circle, rgba(14, 159, 110, 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="glass-card" style={{
        padding: "48px 40px",
        width: "100%",
        maxWidth: "440px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: 10,
        border: "var(--border-hairline)",
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          overflow: "hidden",
        }}>
          <img src="/logo.png" alt="Dakota Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

        <h1 style={{
          fontSize: "1.75rem",
          fontWeight: "800",
          letterSpacing: "-0.5px",
          marginBottom: "8px",
          color: "var(--text-main)"
        }}>
          Owner Login
        </h1>
        <p style={{
          color: "var(--text-muted)",
          fontSize: "0.95rem",
          marginBottom: "32px",
          textAlign: "center"
        }}>
          Enter your passphrase to access the dashboard.
        </p>

        {error && (
          <div style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "var(--radius-button)",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--accent-coral)",
            marginBottom: "24px",
            fontSize: "0.9rem",
            fontWeight: "500",
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: "16px", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Enter passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 16px 14px 44px",
                borderRadius: "var(--radius-button)",
                background: "rgba(255, 255, 255, 0.04)",
                border: "var(--border-hairline)",
                color: "#fff",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.2s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent-verdant)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-color, rgba(255, 255, 255, 0.08))"}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !passphrase.trim()}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "var(--radius-button)",
              background: "var(--accent-verdant)",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: "600",
              border: "none",
              cursor: (loading || !passphrase.trim()) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "opacity 0.2s ease",
              opacity: (loading || !passphrase.trim()) ? 0.7 : 1,
            }}
          >
            {loading ? "Authenticating..." : "Continue"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
