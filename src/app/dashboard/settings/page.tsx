"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Settings,
  Key,
  Bot,
  Save,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (data) {
        setAiApiKey(data.ai_api_key || "");
        setAiContext(data.ai_context || "");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_api_key: aiApiKey,
          ai_context: aiContext,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "40px 32px 80px", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Settings size={24} color="var(--accent-coral)" />
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800" }}>Account & AI Settings</h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Manage your AI API credentials and customize your brand context for AI-powered auto-replies.
          </p>
        </div>

        {savedSuccess && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "var(--radius-button)",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
              fontWeight: "600",
            }}
          >
            <CheckCircle2 size={18} />
            Settings saved successfully!
          </div>
        )}

        {/* Settings Form */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading settings...</div>
        ) : (
          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* AI API Key Section */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Key size={20} color="var(--accent-coral)" />
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>AI API Key (Gemini Supported)</h2>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--accent-cyan)",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Get free Gemini Key <ExternalLink size={14} />
                </a>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px", lineHeight: 1.5 }}>
                Dakota uses Gemini&apos;s lightning-fast <code>gemini-1.5-flash</code> model for instant DM replies.
              </p>

              <div style={{ position: "relative" }}>
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="AI API Key..."
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 48px 12px 16px",
                    borderRadius: "var(--radius-button)",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "var(--border-hairline)",
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* AI Brand Context & Tone Section */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Bot size={20} color="var(--accent-amber)" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>AI Brand Context & Tone Guidelines</h2>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px", lineHeight: 1.5 }}>
                Write a concise description of your business, product details, promo codes, and tone instructions. The AI will consult this context before responding to incoming DMs.
              </p>

              <textarea
                rows={5}
                placeholder="e.g. We are Dakota — a premium Instagram automation platform. Be friendly, energetic, and helpful. Mention our free 14-day trial link (https://dakota.app/trial) and answer pricing questions ($29/mo)."
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-button)",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "var(--border-hairline)",
                  color: "#fff",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={saving}
                className="btn-ig-connect"
                style={{ borderRadius: "var(--radius-button)", padding: "12px 28px", fontSize: "0.95rem" }}
              >
                <Save size={18} />
                {saving ? "Saving Settings..." : "Save Settings"}
              </button>
            </div>

          </form>
        )}

      </div>
    </DashboardLayout>
  );
}
