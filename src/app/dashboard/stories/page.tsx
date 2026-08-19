"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Instagram, Play, Sparkles } from "lucide-react";

export default function StoriesPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "6px" }}>Stories</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              View and manage your active Instagram stories.
            </p>
          </div>
        </div>

        {/* Content */}
        <div
          className="glass-card gradient-orb-peach"
          style={{
            padding: "80px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <div style={{ position: "absolute", top: "-10px", right: "-10px", color: "var(--accent-orange)", animation: "pulse 2s infinite" }}>
              <Sparkles size={20} />
            </div>
            <div style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "50%", 
              background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3px"
            }}>
              <div style={{ width: "100%", height: "100%", background: "var(--bg-main)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Instagram size={28} color="var(--text-main)" />
              </div>
            </div>
          </div>
          
          <h3 style={{ fontSize: "1.6rem" }}>Stories Integration Coming Soon</h3>
          <p style={{ color: "var(--text-body)", maxWidth: "450px", fontSize: "0.95rem", lineHeight: "1.5" }}>
            We're currently building out the media library for live Instagram Stories. 
            Soon, you'll be able to view all your active stories directly from this dashboard.
          </p>
          
          <div style={{ marginTop: "16px", padding: "12px 24px", background: "rgba(12, 10, 9, 0.04)", borderRadius: "999px", fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Play size={14} /> Stay tuned for updates
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
