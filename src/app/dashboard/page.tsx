"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Plus,
  TrendingUp,
  MousePointerClick,
  Mail,
  Users,
  Check,
  AlertTriangle,
  Star,
  Zap,
} from "lucide-react";
import { getStatusColor } from "@/lib/status-colors";

interface ActionCardItem {
  id: string;
  media_type: string;
  thumbnail_url?: string;
  hasAutomation: boolean;
  automationName?: string;
}

interface AutomationSummary {
  id: string;
  name: string;
  trigger_value: string;
  dms_sent: number;
  clicks: number;
  ctr: string;
  is_active: boolean;
  is_ai_enabled?: boolean;
}

interface HomeSummaryData {
  stats: {
    dms_sent_total: number;
    dms_sent_today: number;
    link_clicks_total: number;
    link_clicks_today: number;
    leads_total: number;
    leads_today: number;
  };
  active_automations_count: number;
  failures_last_24h: number;
  recent_activity: Array<{
    type: "sent" | "failed" | "lead";
    label: string;
    automation_name: string | null;
    created_at: string;
  }>;
}

export default function DashboardHomePage() {
  const [username, setUsername] = useState("your_account");
  const [automations, setAutomations] = useState<AutomationSummary[]>([]);
  const [actionCards, setActionCards] = useState<ActionCardItem[]>([]);
  const [homeSummary, setHomeSummary] = useState<HomeSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHomeData = async () => {
    try {
      // Fetch user settings / profile
      const userRes = await fetch("/api/user/settings");
      const userData = await userRes.json();
      if (userData.username) {
        setUsername(userData.username);
      }

      // Fetch home summary
      const summaryRes = await fetch("/api/home-summary");
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setHomeSummary(summaryData);
      }

      // Fetch automations for active list
      const res = await fetch("/api/automations");
      const data = await res.json();
      if (data.automations) {
        const mapped = data.automations.map((rule: any) => ({
          id: rule.id,
          name: rule.name,
          trigger_value: rule.trigger_value || "*",
          dms_sent: rule.dms_sent || 0,
          clicks: rule.clicks || 0,
          ctr: rule.ctr || "0%",
          is_active: rule.is_active,
          is_ai_enabled: rule.is_ai_enabled,
        }));
        setAutomations(mapped);
      }

      // Fetch Instagram media for small thumbnails
      const mediaRes = await fetch("/api/instagram/media");
      const mediaData = await mediaRes.json();
      if (mediaData.media && Array.isArray(mediaData.media)) {
        const cards: ActionCardItem[] = mediaData.media.slice(0, 3).map((item: any) => ({
          id: item.id,
          media_type: item.media_type || "POST",
          thumbnail_url: item.thumbnail_url || item.permalink,
          hasAutomation: false,
        }));
        setActionCards(cards);
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const getRelativeTime = (isoString: string) => {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const diff = new Date().getTime() - new Date(isoString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return rtf.format(-days, "day");
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return rtf.format(-hours, "hour");
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes > 0) return rtf.format(-minutes, "minute");
    return "just now";
  };

  const renderDelta = (today: number) => {
    if (today > 0) {
      return <span style={{ color: "var(--accent-verdant)", fontSize: "0.85rem", fontWeight: "600" }}>↑ {today} today</span>;
    }
    return <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>— today</span>;
  };

  return (
    <DashboardLayout username={username}>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "8px" }}>
              Welcome back, <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: "500" }}>@{username}</span>
            </h1>
            <div style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
              {homeSummary ? (
                <>
                  <span style={{ fontWeight: "500", color: "var(--text-main)" }}>{homeSummary.active_automations_count} automations live</span>
                  {homeSummary.failures_last_24h > 0 && (
                    <>
                      {" · "}
                      <span style={{ color: "var(--accent-danger)", fontWeight: "500" }}>{homeSummary.failures_last_24h} failed in the last 24h</span>
                    </>
                  )}
                </>
              ) : (
                "Loading status..."
              )}
            </div>
          </div>
          <Link href="/dashboard/automations/builder" className="btn-ig-connect" style={{ background: "var(--accent-verdant)" }}>
            <Plus size={18} /> New Automation
          </Link>
        </div>

        {/* Top Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>DMs Sent</span>
              <TrendingUp size={18} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-mono)", fontWeight: "500", color: "var(--text-main)", marginBottom: "8px" }}>
              {homeSummary?.stats.dms_sent_total.toLocaleString() ?? "0"}
            </div>
            {renderDelta(homeSummary?.stats.dms_sent_today ?? 0)}
          </div>

          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>Link Clicks</span>
              <MousePointerClick size={18} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-mono)", fontWeight: "500", color: "var(--text-main)", marginBottom: "8px" }}>
              {homeSummary?.stats.link_clicks_total.toLocaleString() ?? "0"}
            </div>
            {renderDelta(homeSummary?.stats.link_clicks_today ?? 0)}
          </div>

          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>Leads</span>
              <Mail size={18} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-mono)", fontWeight: "500", color: "var(--text-main)", marginBottom: "8px" }}>
              {homeSummary?.stats.leads_total.toLocaleString() ?? "0"}
            </div>
            {renderDelta(homeSummary?.stats.leads_today ?? 0)}
          </div>

          <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>Connected Account</span>
              <Users size={18} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: "1.4rem", fontFamily: "var(--font-mono)", fontWeight: "500", color: "var(--text-main)", wordBreak: "break-all" }}>
              @{username}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
          
          {/* Main Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Active Automations */}
            <section className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Active Automations</h2>
                <Link href="/dashboard/automations" style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "500" }}>
                  View all →
                </Link>
              </div>
              
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "var(--border-hairline)", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: "600" }}>
                    <th style={{ padding: "12px 0" }}>NAME</th>
                    <th style={{ padding: "12px 0" }}>PERFORMANCE</th>
                    <th style={{ padding: "12px 0", textAlign: "right" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {automations.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)" }}>
                        No active automations yet.
                      </td>
                    </tr>
                  ) : (
                    automations.slice(0, 4).map((rule) => (
                      <tr key={rule.id} style={{ borderBottom: "var(--border-hairline)" }}>
                        <td style={{ padding: "16px 0" }}>
                          <div style={{ fontWeight: "500", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                            {rule.name}
                            {rule.is_ai_enabled && (
                              <span style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", background: "var(--bg-soft)", border: "var(--border-hairline)", color: "var(--text-muted)" }}>
                                AI
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
                            {rule.trigger_value}
                          </div>
                        </td>
                        <td style={{ padding: "16px 0" }}>
                          <span style={{ fontWeight: "500" }}>{rule.dms_sent}</span> <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>sent</span>
                        </td>
                        <td style={{ padding: "16px 0", textAlign: "right" }}>
                          <span style={{ 
                            padding: "4px 10px", 
                            borderRadius: "9999px", 
                            fontSize: "0.75rem", 
                            fontWeight: "600", 
                            border: "var(--border-hairline)", 
                            background: "var(--bg-soft)", 
                            color: getStatusColor(rule.is_active ? 'active' : 'inactive') 
                          }}>
                            {rule.is_active ? "Live" : "Paused"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
            
            {/* Posts & Reels Mini */}
            <section className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Posts & Reels</h2>
                <Link href="/dashboard/posts" style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "500" }}>
                  View all in Posts & Reels →
                </Link>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                {actionCards.length === 0 ? (
                  <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: "0.9rem", width: "100%", textAlign: "center" }}>
                    No media found. Connect your account.
                  </div>
                ) : (
                  actionCards.map((card) => (
                    <div key={card.id} style={{ width: "90px", height: "120px", borderRadius: "8px", overflow: "hidden", background: "var(--bg-soft)", border: "var(--border-hairline)", position: "relative" }}>
                      {card.thumbnail_url ? (
                        <img src={card.thumbnail_url} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{card.media_type}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div>
            <section className="glass-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "20px" }}>Recent Activity</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {!homeSummary || homeSummary.recent_activity.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "20px 0" }}>
                    No recent activity yet.
                  </div>
                ) : (
                  homeSummary.recent_activity.map((activity, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: activity.type === "sent" ? "rgba(14, 159, 110, 0.1)" : activity.type === "failed" ? "rgba(220, 38, 38, 0.1)" : "rgba(232, 169, 59, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px"
                      }}>
                        {activity.type === "sent" && <Check size={16} color="var(--accent-verdant)" />}
                        {activity.type === "failed" && <AlertTriangle size={16} color="var(--accent-danger)" />}
                        {activity.type === "lead" && <Star size={16} color="var(--accent-gold)" />}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.95rem", color: "var(--text-main)", fontWeight: "500", lineHeight: "1.4" }}>
                          {activity.label}
                        </div>
                        {activity.automation_name && (
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Via {activity.automation_name}
                          </div>
                        )}
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          {getRelativeTime(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
