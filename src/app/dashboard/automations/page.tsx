"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Plus,
  MoreVertical,
  Play,
  Pause,
  Edit2,
  Copy,
  Trash2,
  Search,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Bot,
  Zap,
  Instagram,
  MessageCircle,
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  is_active: boolean;
  trigger_source: string;
  trigger_type: string;
  trigger_value: string;
  response_content?: { text: string };
  public_response_content?: { text: string };
  reply_mode?: string;
  specific_media_id?: string;
  is_ai_enabled?: boolean;
  ai_model?: string;
  fallback_response_text?: string;
  dms_sent: number;
  clicks: number;
  ctr: string;
  failed_24h: number;
}

function AutomationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterType = searchParams.get("filter");

  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // New state
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "paused">("all");

  const fetchAutomations = async () => {
    try {
      const res = await fetch("/api/automations");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data && Array.isArray(data.automations)) {
        setAutomations(data.automations);
      }
    } catch (err) {
      console.error("Error fetching automations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
    const savedView = localStorage.getItem("automationsViewMode") as "list" | "board";
    if (savedView === "list" || savedView === "board") {
      setViewMode(savedView);
    }
  }, []);

  const handleToggleView = (mode: "list" | "board") => {
    setViewMode(mode);
    localStorage.setItem("automationsViewMode", mode);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setActiveMenuId(null);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });
      if (res.ok) {
        setAutomations((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_active: !currentActive } : item))
        );
      }
    } catch (err) {
      console.error("Error toggling state:", err);
    }
  };

  const handleDuplicate = async (rule: AutomationRule) => {
    setActiveMenuId(null);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${rule.name} (Copy)`,
          trigger_source: rule.trigger_source,
          trigger_type: rule.trigger_type,
          trigger_value: rule.trigger_value,
          response_text: rule.response_content?.text,
          public_response_text: rule.public_response_content?.text,
          reply_mode: rule.reply_mode,
          specific_media_id: rule.specific_media_id,
          is_ai_enabled: rule.is_ai_enabled,
          fallback_response_text: rule.fallback_response_text,
          is_active: true,
        }),
      });

      if (res.ok) {
        fetchAutomations();
      }
    } catch (err) {
      console.error("Error duplicating rule:", err);
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    setActiveMenuId(null);
    if (!confirm("Are you sure you want to delete this automation rule?")) return;

    try {
      const res = await fetch(`/api/automations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAutomations((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error deleting automation:", err);
    }
  };

  // Filter logic
  const filteredAutomations = useMemo(() => {
    let filtered = automations;

    // URL parameter filter
    if (filterType === "posts") {
      filtered = filtered.filter((r) => ["post", "reel", "post_comment"].includes(r.trigger_source || ""));
    } else if (filterType === "stories") {
      filtered = filtered.filter((r) => ["story", "story_mention"].includes(r.trigger_source || ""));
    }

    // Status filter
    if (statusFilter === "live") {
      filtered = filtered.filter((r) => r.is_active);
    } else if (statusFilter === "paused") {
      filtered = filtered.filter((r) => !r.is_active);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => 
        r.name.toLowerCase().includes(q) || 
        (r.trigger_value && r.trigger_value.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [automations, filterType, statusFilter, searchQuery]);

  const maxClicks = useMemo(() => {
    return Math.max(0, ...filteredAutomations.map(a => a.clicks || 0));
  }, [filteredAutomations]);

  // Board view buckets
  const boardBuckets = useMemo(() => {
    const needsAttention: AutomationRule[] = [];
    const live: AutomationRule[] = [];
    const paused: AutomationRule[] = [];

    filteredAutomations.forEach(a => {
      if ((a.failed_24h || 0) > 0) {
        needsAttention.push(a);
      } else if (a.is_active) {
        live.push(a);
      } else {
        paused.push(a);
      }
    });

    return { needsAttention, live, paused };
  }, [filteredAutomations]);

  const navigateToBuilder = (id: string) => {
    router.push(`/dashboard/automations/builder?id=${id}`);
  };

  const renderKebabMenu = (rule: AutomationRule) => (
    <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setActiveMenuId(activeMenuId === rule.id ? null : rule.id)}
        style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: "8px", cursor: "pointer" }}
      >
        <MoreVertical size={18} />
      </button>
      {activeMenuId === rule.id && (
        <div
          className="glass-card"
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            width: "160px",
            padding: "6px",
            zIndex: 100,
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <button
            onClick={() => handleToggleActive(rule.id, rule.is_active)}
            style={{ padding: "8px 12px", borderRadius: "6px", background: "transparent", border: "none", color: "var(--text-main)", fontSize: "0.85rem", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            className="hover-bg-soft"
          >
            {rule.is_active ? <Pause size={14} /> : <Play size={14} />}
            {rule.is_active ? "Pause" : "Resume"}
          </button>
          <button
            onClick={() => { setActiveMenuId(null); navigateToBuilder(rule.id); }}
            style={{ padding: "8px 12px", borderRadius: "6px", background: "transparent", border: "none", color: "var(--text-main)", fontSize: "0.85rem", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            className="hover-bg-soft"
          >
            <Edit2 size={14} /> Edit Rule
          </button>
          <button
            onClick={() => handleDuplicate(rule)}
            style={{ padding: "8px 12px", borderRadius: "6px", background: "transparent", border: "none", color: "var(--text-main)", fontSize: "0.85rem", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            className="hover-bg-soft"
          >
            <Copy size={14} /> Duplicate
          </button>
          <div style={{ height: "1px", background: "var(--border-hairline)", margin: "4px 0" }}></div>
          <button
            onClick={() => handleDeleteAutomation(rule.id)}
            style={{ padding: "8px 12px", borderRadius: "6px", background: "transparent", border: "none", color: "var(--accent-danger)", fontSize: "0.85rem", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            className="hover-bg-soft"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "2.2rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "12px" }}>
              Automations <span style={{ fontSize: "1.2rem", color: "var(--text-muted)", fontWeight: "400" }}>· {filteredAutomations.length}</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Manage active comment-to-DM, story mention, and Gemini AI auto-reply rules.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* View Toggles */}
            <div style={{ display: "flex", background: "rgba(12, 10, 9, 0.04)", borderRadius: "var(--radius-button)", padding: "4px" }}>
              <button
                onClick={() => handleToggleView("list")}
                title="List View"
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "list" ? "#ffffff" : "transparent",
                  color: viewMode === "list" ? "var(--text-main)" : "var(--text-muted)",
                  boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                }}
              >
                <LayoutList size={18} />
              </button>
              <button
                onClick={() => handleToggleView("board")}
                title="Board View"
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "board" ? "#ffffff" : "transparent",
                  color: viewMode === "board" ? "var(--text-main)" : "var(--text-muted)",
                  boxShadow: viewMode === "board" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                }}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <Link href="/dashboard/automations/builder" className="btn-ig-connect" style={{ height: "36px", padding: "0 16px" }}>
              <Plus size={16} /> New Automation
            </Link>
          </div>
        </div>

        {/* Filters Row */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "32px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search automations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "var(--radius-button)",
                border: "var(--border-hairline)",
                fontSize: "0.85rem",
                background: "#ffffff",
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {(["all", "live", "paused"] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: "500",
                  textTransform: "capitalize",
                  border: "var(--border-hairline)",
                  background: statusFilter === status ? "var(--accent-verdant)" : "#ffffff",
                  color: statusFilter === status ? "#ffffff" : "var(--text-body)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading automations...</div>
        ) : filteredAutomations.length === 0 ? (
          <div className="glass-card gradient-orb-peach" style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <Zap size={32} color="var(--text-main)" />
            <h3 style={{ fontSize: "1.4rem" }}>No Automations Found</h3>
            <p style={{ color: "var(--text-body)", maxWidth: "450px", fontSize: "0.9rem" }}>Try adjusting your filters or create a new automation.</p>
          </div>
        ) : viewMode === "list" ? (
          /* LIST VIEW */
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Header Row */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "32px 2.2fr 64px 64px 76px 64px",
              gap: "16px",
              padding: "0 16px",
              marginBottom: "4px",
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              <div></div>
              <div>Automation</div>
              <div style={{ textAlign: "right" }}>Sent</div>
              <div style={{ textAlign: "right" }}>CTR</div>
              <div style={{ textAlign: "center" }}>Status</div>
              <div></div>
            </div>

            {/* Data Rows */}
            {filteredAutomations.map(rule => (
              <div
                key={rule.id}
                className="glass-card hover-lift"
                onClick={() => navigateToBuilder(rule.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 2.2fr 64px 64px 76px 64px",
                  gap: "16px",
                  alignItems: "center",
                  padding: "0 16px",
                  height: "54px",
                  cursor: "pointer",
                }}
              >
                {/* 1. Icon column */}
                <div style={{ 
                  width: "32px", height: "32px", 
                  borderRadius: "var(--radius-button)", 
                  background: "var(--bg-dark)", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-body)"
                }}>
                  {rule.is_ai_enabled ? <Bot size={16} /> : 
                   ["story", "story_mention"].includes(rule.trigger_source) ? <Instagram size={16} /> : 
                   <MessageCircle size={16} />}
                </div>

                {/* 2. Name & Keywords */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: "600", 
                    color: "var(--text-main)", 
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis" 
                  }}>
                    {rule.name}
                  </div>
                  {rule.trigger_value && (
                    <span style={{ 
                      fontSize: "0.75rem", 
                      fontFamily: "var(--font-mono)", 
                      background: "rgba(12, 10, 9, 0.05)", 
                      padding: "2px 8px", 
                      borderRadius: "4px", 
                      color: "var(--text-body)",
                      flexShrink: 0
                    }}>
                      {rule.trigger_value}
                    </span>
                  )}
                  {rule.is_ai_enabled && (
                    <span style={{ 
                      fontSize: "0.7rem", 
                      fontWeight: "600", 
                      color: "var(--accent-verdant)", 
                      display: "flex", alignItems: "center", gap: "3px",
                      flexShrink: 0
                    }}>
                      <Bot size={12} /> AI
                    </span>
                  )}
                </div>

                {/* 3. Sent */}
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--text-main)", fontWeight: "500" }}>
                  {rule.dms_sent.toLocaleString()}
                </div>

                {/* 4. CTR */}
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: rule.ctr === "—" || rule.ctr === "0%" ? "var(--text-muted)" : "var(--text-main)", fontWeight: "500" }}>
                  {rule.ctr}
                </div>

                {/* 5. Status */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <span style={{ 
                    fontSize: "0.75rem", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", 
                    background: rule.is_active ? "rgba(14, 159, 110, 0.1)" : "rgba(12, 10, 9, 0.06)", 
                    color: rule.is_active ? "var(--accent-verdant)" : "var(--text-muted)" 
                  }}>
                    {rule.is_active ? "Live" : "Paused"}
                  </span>
                </div>

                {/* 6. Actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(rule.id, rule.is_active);
                    }}
                    style={{
                      background: "transparent", border: "none", color: "var(--text-muted)", 
                      padding: "6px", borderRadius: "6px", cursor: "pointer"
                    }}
                    className="hover-bg-soft"
                    title={rule.is_active ? "Pause" : "Resume"}
                  >
                    {rule.is_active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  {renderKebabMenu(rule)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* BOARD VIEW */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", alignItems: "flex-start" }}>
            
            {/* Needs Attention Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(12,10,9,0.02)", padding: "16px", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)", marginBottom: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-danger)" }}></span>
                Needs attention <span style={{ color: "var(--text-muted)", fontWeight: "400", fontSize: "0.85rem" }}>{boardBuckets.needsAttention.length}</span>
              </h3>
              {boardBuckets.needsAttention.map(rule => (
                <div key={rule.id} onClick={() => navigateToBuilder(rule.id)} className="glass-card hover-lift" style={{ padding: "16px", cursor: "pointer", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-main)", lineHeight: 1.3, paddingRight: "20px" }}>{rule.name}</div>
                    <div style={{ position: "absolute", top: "12px", right: "8px" }}>{renderKebabMenu(rule)}</div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--accent-danger)", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                    {rule.failed_24h} failed in the last 24h
                  </div>
                </div>
              ))}
            </div>

            {/* Live Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(12,10,9,0.02)", padding: "16px", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)", marginBottom: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-verdant)" }}></span>
                Live <span style={{ color: "var(--text-muted)", fontWeight: "400", fontSize: "0.85rem" }}>{boardBuckets.live.length}</span>
              </h3>
              {boardBuckets.live.map(rule => (
                <div key={rule.id} onClick={() => navigateToBuilder(rule.id)} className="glass-card hover-lift" style={{ padding: "16px", cursor: "pointer", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-main)", lineHeight: 1.3, paddingRight: "20px" }}>{rule.name}</div>
                    <div style={{ position: "absolute", top: "12px", right: "8px" }}>{renderKebabMenu(rule)}</div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><strong style={{ color: "var(--text-main)" }}>{rule.dms_sent.toLocaleString()}</strong> sent</span>
                    <span style={{ color: "var(--accent-verdant)", fontWeight: "500" }}>{rule.ctr} CTR</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Paused Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(12,10,9,0.02)", padding: "16px", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)", marginBottom: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--text-muted)" }}></span>
                Paused <span style={{ color: "var(--text-muted)", fontWeight: "400", fontSize: "0.85rem" }}>{boardBuckets.paused.length}</span>
              </h3>
              {boardBuckets.paused.map(rule => (
                <div key={rule.id} onClick={() => navigateToBuilder(rule.id)} className="glass-card hover-lift" style={{ padding: "16px", cursor: "pointer", position: "relative", opacity: 0.8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-main)", lineHeight: 1.3, paddingRight: "20px" }}>{rule.name}</div>
                    <div style={{ position: "absolute", top: "12px", right: "8px" }}>{renderKebabMenu(rule)}</div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><strong>{rule.dms_sent.toLocaleString()}</strong> sent</span>
                    <span>{rule.ctr} CTR</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-soft:hover {
          background-color: var(--bg-soft) !important;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          border-color: rgba(12, 10, 9, 0.1);
        }
      `}} />
    </DashboardLayout>
  );
}

export default function AutomationsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading automations...</div>}>
      <AutomationsContent />
    </Suspense>
  );
}
