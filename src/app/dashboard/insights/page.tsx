"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PieChart, MessageCircle, Plus, Trophy, Layers } from "lucide-react";

interface CommenterLeader {
  rank: number;
  username: string;
  commentsCount: number;
  automationsTriggered: number;
  lastActive: string;
}

export default function AudienceInsightsPage() {
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [leaderboard, setLeaderboard] = useState<CommenterLeader[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [uniqueCommenters, setUniqueCommenters] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      if (data) {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.totalComments) setTotalComments(data.totalComments);
        if (data.uniqueCommenters) setUniqueCommenters(data.uniqueCommenters);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "6px" }}>Audience Insights & Top Commenters</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Identify your most engaged Instagram followers and top comment automation triggers.
          </p>
        </div>

        {/* Two Panel Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "28px" }}>
          
          {/* Left Panel */}
          <div style={{ background: "#ffffff", border: "var(--border-hairline)", borderRadius: "var(--radius-card)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
            <h2 style={{ fontSize: "1.1rem" }}>View Stats For</h2>

            <button
              onClick={() => alert("Custom Rule Group created!")}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "9999px",
                background: "#ffffff",
                border: "var(--border-hairline)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Plus size={16} /> Create Custom Group
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
              <div
                onClick={() => setSelectedGroup("all")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-button)",
                  background: selectedGroup === "all" ? "rgba(14, 159, 110, 0.1)" : "transparent",
                  border: selectedGroup === "all" ? "1px solid rgba(14, 159, 110, 0.2)" : "1px solid transparent",
                  color: selectedGroup === "all" ? "var(--accent-verdant)" : "var(--text-main)",
                  fontWeight: selectedGroup === "all" ? "600" : "400",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Layers size={16} /> All Automations
              </div>
              
              <div
                onClick={() => setSelectedGroup("reels")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-button)",
                  background: selectedGroup === "reels" ? "rgba(14, 159, 110, 0.1)" : "transparent",
                  border: selectedGroup === "reels" ? "1px solid rgba(14, 159, 110, 0.2)" : "1px solid transparent",
                  color: selectedGroup === "reels" ? "var(--accent-verdant)" : "var(--text-main)",
                  fontWeight: selectedGroup === "reels" ? "600" : "400",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <MessageCircle size={16} /> Reel Comments
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Stat Boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ background: "#ffffff", border: "var(--border-hairline)", borderRadius: "var(--radius-card)", padding: "24px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>TOTAL COMMENTS PROCESSED</div>
                <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-mono)", fontWeight: "300", marginTop: "4px" }}>{totalComments.toLocaleString()}</div>
              </div>

              <div style={{ background: "#ffffff", border: "var(--border-hairline)", borderRadius: "var(--radius-card)", padding: "24px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>UNIQUE COMMENTERS</div>
                <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-mono)", fontWeight: "300", marginTop: "4px" }}>{uniqueCommenters.toLocaleString()}</div>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div style={{ background: "#ffffff", border: "var(--border-hairline)", borderRadius: "var(--radius-card)", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <Trophy size={18} color="var(--accent-gold)" />
                <h2 style={{ fontSize: "1.3rem" }}>Top Commenters Ranked Leaderboard</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Header Row */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "60px 2fr 90px 130px 100px",
                  gap: "16px",
                  padding: "0 16px",
                  marginBottom: "4px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  <div>Rank</div>
                  <div>Follower</div>
                  <div style={{ textAlign: "right" }}>Comments</div>
                  <div style={{ textAlign: "right" }}>Rules Triggered</div>
                  <div style={{ textAlign: "right" }}>Last Active</div>
                </div>

                {loading ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading insights...</div>
                ) : leaderboard.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>No audience comment data yet — top commenters will appear here as automations trigger.</div>
                ) : (
                  leaderboard.map((item) => (
                    <div key={item.rank} style={{
                      display: "grid",
                      gridTemplateColumns: "60px 2fr 90px 130px 100px",
                      gap: "16px",
                      alignItems: "center",
                      padding: "0 16px",
                      height: "54px",
                      borderBottom: "var(--border-hairline)",
                      fontSize: "0.88rem"
                    }}>
                      <div style={{ fontWeight: "600", color: item.rank === 1 ? "var(--accent-gold)" : "var(--text-main)" }}>
                        #{item.rank}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--text-main)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "0.75rem", flexShrink: 0 }}>
                          {item.username.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{item.username}</span>
                      </div>
                      <div style={{ fontWeight: "600", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                        {item.commentsCount}
                      </div>
                      <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "9999px", background: "rgba(12, 10, 9, 0.06)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.75rem", fontFamily: "var(--font-sans)" }}>
                          <span style={{ fontFamily: "var(--font-mono)" }}>{item.automationsTriggered}</span> rules
                        </span>
                      </div>
                      <div style={{ color: "var(--accent-verdant)", fontWeight: "600", textAlign: "right" }}>
                        {item.lastActive}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
