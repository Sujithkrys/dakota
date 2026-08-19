"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Home,
  Zap,
  LayoutTemplate,
  FolderKanban,
  FileText,
  Video,
  Users,
  RotateCcw,
  BarChart3,
  PieChart,
  HelpCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Bot,
  CheckCircle2,
  Instagram,
} from "lucide-react";

interface LinkedAccount {
  id: string;
  username: string;
  profile_pic: string | null;
  ig_account_id: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  username?: string;
  userId?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({ children, username = "your_account", userId }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [contentOpen, setContentOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [activeAccountUsername, setActiveAccountUsername] = useState(username);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    dms_sent: 0,
    active_automations: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data && typeof data.dms_sent === "number") {
        setStats({
          dms_sent: data.dms_sent || 0,
          active_automations: data.active_automations || 0,
        });
      }
    } catch {
      // Fallback
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/account/list");
      if (res.ok) {
        const data = await res.json();
        if (data?.accounts && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    try {
      const res = await fetch("/api/account/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        setAccountDropdownOpen(false);
        // Reload to reflect the new active account across all dashboard data
        window.location.reload();
      }
    } catch {
      // Fallback
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAccounts();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--bg-dark)",
      }}
    >
      {/* Main Container */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, height: "100vh", overflow: "hidden" }}>
        
        {/* Editorial Left Sidebar (~260px fixed width) */}
        <aside
          style={{
            width: "260px",
            minWidth: "260px",
            borderRight: "var(--border-hairline)",
            background: "var(--bg-soft)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "100%",
            overflowY: "auto",
            flexShrink: 0,
            zIndex: 40,
          }}
        >
          {/* Logo & Branding */}
          <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={18} color="#ffffff" />
              </div>
              <span style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400", letterSpacing: "-0.5px" }}>
                Dakota
              </span>
            </Link>
          </div>

          {/* Account Switcher */}
          <div style={{ padding: "0 16px 14px", position: "relative" }} ref={accountDropdownRef}>
            <button
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "var(--radius-button)",
                background: "#ffffff",
                border: "var(--border-hairline)",
                width: "100%",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "var(--text-main)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                }}
              >
                {activeAccountUsername.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{activeAccountUsername}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--accent-verdant)", fontWeight: "600" }}>● Active Account</div>
              </div>
              {accountDropdownOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
            </button>

            {accountDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% - 6px)",
                  left: "16px",
                  right: "16px",
                  background: "#ffffff",
                  border: "var(--border-hairline)",
                  borderRadius: "var(--radius-card)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  maxHeight: "240px",
                  overflowY: "auto",
                }}
              >
                {accounts.length > 0 ? (
                  accounts.map((acct) => (
                    <button
                      key={acct.id}
                      onClick={() => handleSwitchAccount(acct.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        borderBottom: "var(--border-hairline)",
                      }}
                    >
                      {acct.profile_pic ? (
                        <img
                          src={acct.profile_pic}
                          alt={acct.username}
                          style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            color: "#374151",
                          }}
                        >
                          {acct.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: "500", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{acct.username}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={{ padding: "12px", fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
                    No accounts linked yet
                  </div>
                )}

                {/* Connect new account */}
                <a
                  href="/api/auth/instagram?force_oauth=true"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.8rem",
                    fontWeight: "500",
                    color: "#2563eb",
                  }}
                >
                  <Instagram size={16} />
                  + Connect Account
                </a>
              </div>
            )}
          </div>

          {/* New Automation Pill Button */}
          <div style={{ padding: "0 16px 14px" }}>
            <Link
              href="/dashboard/automations/builder"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "10px",
                borderRadius: "var(--radius-button)",
                background: "var(--accent-verdant)",
                color: "#ffffff",
                fontWeight: "500",
                fontSize: "0.88rem",
                boxShadow: "0 2px 10px rgba(14, 159, 110, 0.2)",
                transition: "all 0.2s ease",
              }}
            >
              <Plus size={16} strokeWidth={2} />
              New Automation
            </Link>
          </div>

          {/* Nav Links */}
          <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
            
            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "var(--radius-button)",
                fontSize: "0.85rem",
                fontWeight: pathname === "/dashboard" ? "600" : "400",
                color: pathname === "/dashboard" ? "var(--accent-verdant)" : "var(--text-body)",
                background: pathname === "/dashboard" ? "#ffffff" : "transparent",
                border: pathname === "/dashboard" ? "var(--border-hairline)" : "1px solid transparent",
              }}
            >
              <Home size={17} color="currentColor" />
              Home
            </Link>

            <Link
              href="/dashboard/automations"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "var(--radius-button)",
                fontSize: "0.85rem",
                fontWeight: pathname.startsWith("/dashboard/automations") ? "600" : "400",
                color: pathname.startsWith("/dashboard/automations") ? "var(--accent-verdant)" : "var(--text-body)",
                background: pathname.startsWith("/dashboard/automations") ? "#ffffff" : "transparent",
                border: pathname.startsWith("/dashboard/automations") ? "var(--border-hairline)" : "1px solid transparent",
              }}
            >
              <Zap size={17} color="currentColor" />
              Automations
            </Link>

            <Link
              href="/dashboard/templates"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "var(--radius-button)",
                fontSize: "0.85rem",
                fontWeight: pathname === "/dashboard/templates" ? "600" : "400",
                color: pathname === "/dashboard/templates" ? "var(--accent-verdant)" : "var(--text-body)",
                background: pathname === "/dashboard/templates" ? "#ffffff" : "transparent",
                border: pathname === "/dashboard/templates" ? "var(--border-hairline)" : "1px solid transparent",
              }}
            >
              <LayoutTemplate size={17} color="currentColor" />
              Templates
            </Link>

            <div>
              <button
                onClick={() => setContentOpen(!contentOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-button)",
                  fontSize: "0.85rem",
                  fontWeight: "400",
                  color: "var(--text-body)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FolderKanban size={17} color="currentColor" />
                  My Content
                </div>
                {contentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {contentOpen && (
                <div style={{ paddingLeft: "28px", display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px" }}>
                  <Link
                    href="/dashboard/posts"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 10px",
                      fontSize: "0.82rem",
                      color: pathname.startsWith("/dashboard/posts") ? "var(--text-main)" : "var(--text-body)",
                      fontWeight: pathname.startsWith("/dashboard/posts") ? "600" : "400",
                      background: pathname.startsWith("/dashboard/posts") ? "rgba(12, 10, 9, 0.04)" : "transparent",
                      borderRadius: "6px"
                    }}
                  >
                    <FileText size={14} /> Posts & Reels
                  </Link>
                  <Link
                    href="/dashboard/stories"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 10px",
                      fontSize: "0.82rem",
                      color: pathname.startsWith("/dashboard/stories") ? "var(--text-main)" : "var(--text-body)",
                      fontWeight: pathname.startsWith("/dashboard/stories") ? "600" : "400",
                      background: pathname.startsWith("/dashboard/stories") ? "rgba(12, 10, 9, 0.04)" : "transparent",
                      borderRadius: "6px"
                    }}
                  >
                    <Video size={14} /> Stories
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/contacts"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "var(--radius-button)",
                fontSize: "0.85rem",
                fontWeight: pathname === "/dashboard/contacts" ? "600" : "400",
                color: pathname === "/dashboard/contacts" ? "var(--accent-verdant)" : "var(--text-body)",
                background: pathname === "/dashboard/contacts" ? "#ffffff" : "transparent",
                border: pathname === "/dashboard/contacts" ? "var(--border-hairline)" : "1px solid transparent",
              }}
            >
              <Users size={17} color="currentColor" />
              Contacts
            </Link>

            <Link
              href="/dashboard/rewind"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "var(--radius-button)",
                fontSize: "0.85rem",
                fontWeight: pathname === "/dashboard/rewind" ? "600" : "400",
                color: pathname === "/dashboard/rewind" ? "var(--accent-verdant)" : "var(--text-body)",
                background: pathname === "/dashboard/rewind" ? "#ffffff" : "transparent",
                border: pathname === "/dashboard/rewind" ? "var(--border-hairline)" : "1px solid transparent",
              }}
            >
              <RotateCcw size={17} color="currentColor" />
              Rewind
            </Link>

            <div>
              <button
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-button)",
                  fontSize: "0.85rem",
                  fontWeight: pathname.includes("analytics") || pathname.includes("insights") ? "600" : "400",
                  color: "var(--text-body)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <BarChart3 size={17} color="currentColor" />
                  Analytics
                </div>
                {analyticsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {analyticsOpen && (
                <div style={{ paddingLeft: "28px", display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px" }}>
                  <Link href="/dashboard/analytics" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", fontSize: "0.82rem", color: pathname === "/dashboard/analytics" ? "var(--text-main)" : "var(--text-body)", fontWeight: pathname === "/dashboard/analytics" ? "600" : "400" }}>
                    <BarChart3 size={14} /> Overview
                  </Link>
                  <Link href="/dashboard/insights" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", fontSize: "0.82rem", color: pathname === "/dashboard/insights" ? "var(--text-main)" : "var(--text-body)", fontWeight: pathname === "/dashboard/insights" ? "600" : "400" }}>
                    <PieChart size={14} /> Audience Insights
                  </Link>
                </div>
              )}
            </div>

            <Link href="/docs" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "var(--radius-button)", fontSize: "0.85rem", color: "var(--text-body)" }}>
              <HelpCircle size={17} />
              Support & Docs
            </Link>
          </nav>

          {/* Bottom Free Unlimited Status Indicator (NO PAYWALL / NO PRO LIMITS) */}
          <div
            style={{
              padding: "14px",
              margin: "10px 10px 14px",
              borderRadius: "var(--radius-card)",
              background: "#ffffff",
              border: "var(--border-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "600", color: "var(--accent-verdant)" }}>
              <CheckCircle2 size={15} /> 100% Free Unlimited Plan
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>DMs Sent:</span>
              <span style={{ fontWeight: "600", color: "var(--text-main)" }}>{stats.dms_sent.toLocaleString()} (Unlimited)</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>Active Rules:</span>
              <span style={{ fontWeight: "600", color: "var(--text-main)" }}>{stats.active_automations} Active</span>
            </div>
          </div>

        </aside>

        {/* Independent Main Content Viewport */}
        <main
          style={{
            flex: 1,
            height: "100%",
            maxHeight: "100%",
            overflowY: "auto",
            minWidth: 0,
            backgroundColor: "var(--bg-dark)",
          }}
        >
          {children}
        </main>
      </div>

    </div>
  );
}
