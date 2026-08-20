"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  PanelLeftClose,
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
  const [contentOpen, setContentOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [activeAccountUsername, setActiveAccountUsername] = useState(username);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    dms_sent: 0,
    active_automations: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

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
        window.location.reload();
      }
    } catch {
      // Fallback
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
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
      <div style={{ display: "flex", flex: 1, minHeight: 0, height: "100vh", overflow: "hidden" }}>
        
        <aside
          style={{
            width: isCollapsed ? "72px" : "260px",
            minWidth: isCollapsed ? "72px" : "260px",
            borderRight: "var(--border-hairline)",
            background: "var(--bg-soft)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "100%",
            overflowY: "auto",
            flexShrink: 0,
            zIndex: 40,
            transition: "width 0.2s ease, min-width 0.2s ease",
          }}
        >
          {/* Logo & Branding */}
          <div style={{ padding: "20px 16px 14px", display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
            <div 
              onClick={isCollapsed ? toggleCollapse : undefined}
              style={{ display: "flex", alignItems: "center", gap: "10px", cursor: isCollapsed ? "pointer" : "default" }}
              title={isCollapsed ? "Expand Sidebar" : undefined}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img src="/logo.png" alt="Dakota Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              {!isCollapsed && (
                <span style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400", letterSpacing: "-0.5px" }}>
                  Dakota
                </span>
              )}
            </div>
            {!isCollapsed && (
              <button 
                onClick={toggleCollapse} 
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>

          {/* New Automation Pill Button */}
          <div style={{ padding: "0 16px 14px", display: "flex", justifyContent: "center" }}>
            <Link
              href="/dashboard/automations/builder"
              title="New Automation"
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
              {!isCollapsed && "New Automation"}
            </Link>
          </div>

          {/* Nav Links */}
          <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
            
            <Link
              href="/dashboard"
              title="Home"
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
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
            >
              <Home size={17} color="currentColor" />
              {!isCollapsed && "Home"}
            </Link>

            <Link
              href="/dashboard/automations"
              title="Automations"
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
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
            >
              <Zap size={17} color="currentColor" />
              {!isCollapsed && "Automations"}
            </Link>
            <Link
              href="/dashboard/templates"
              title="Templates"
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
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
            >
              <LayoutTemplate size={17} color="currentColor" />
              {!isCollapsed && "Templates"}
            </Link>

            <Link
              href="/dashboard/contacts"
              title="Contacts"
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
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
            >
              <Users size={17} color="currentColor" />
              {!isCollapsed && "Contacts"}
            </Link>

            <Link
              href="/dashboard/rewind"
              title="Rewind"
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
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
            >
              <RotateCcw size={17} color="currentColor" />
              {!isCollapsed && "Rewind"}
            </Link>

            <div>
              <button
                onClick={() => {
                  if (isCollapsed) toggleCollapse();
                  setContentOpen(!contentOpen);
                }}
                title="My Content"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "space-between",
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
                  {!isCollapsed && "My Content"}
                </div>
                {!isCollapsed && (contentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </button>

              {!isCollapsed && contentOpen && (
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

            <div>
              <button
                onClick={() => {
                  if (isCollapsed) toggleCollapse();
                  setAnalyticsOpen(!analyticsOpen);
                }}
                title="Analytics"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "space-between",
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
                  {!isCollapsed && "Analytics"}
                </div>
                {!isCollapsed && (analyticsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </button>

              {!isCollapsed && analyticsOpen && (
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

            <Link
              href="/dashboard/settings"
              title="Settings"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "var(--radius-button)",
                fontSize: "0.85rem",
                fontWeight: pathname.startsWith("/dashboard/settings") ? "600" : "400",
                color: pathname.startsWith("/dashboard/settings") ? "var(--accent-verdant)" : "var(--text-body)",
                background: pathname.startsWith("/dashboard/settings") ? "#ffffff" : "transparent",
                border: pathname.startsWith("/dashboard/settings") ? "var(--border-hairline)" : "1px solid transparent",
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
            >
              <Settings size={17} color="currentColor" />
              {!isCollapsed && "Settings"}
            </Link>
          </nav>

          {/* Footer Block */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px", padding: isCollapsed ? "12px 0" : "12px 12px 24px" }}>
            
            {/* Plan Card */}
            {!isCollapsed && (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "var(--radius-card)",
                  background: "#ffffff",
                  border: "var(--border-hairline)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                  <CheckCircle2 size={15} color="var(--accent-verdant)" /> Free plan
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", alignItems: "center" }}>
                  <span>DMs sent</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>{stats.dms_sent.toLocaleString()}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", alignItems: "center" }}>
                  <span>Active rules</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>{stats.active_automations}</span>
                </div>
              </div>
            )}

            {/* Account Switcher */}
            <div style={{ position: "relative", padding: isCollapsed ? "0 12px" : "0" }} ref={accountDropdownRef}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                title={isCollapsed ? `Account: @${activeAccountUsername}` : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "space-between",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-button)",
                  background: "transparent",
                  border: "none",
                  width: "100%",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "var(--text-main)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      flexShrink: 0,
                    }}
                  >
                    {activeAccountUsername.charAt(0).toUpperCase()}
                  </div>
                  {!isCollapsed && (
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{activeAccountUsername}</div>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  accountDropdownOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />
                )}
              </button>

              {accountDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: isCollapsed ? "12px" : "0",
                    width: isCollapsed ? "220px" : "100%",
                    background: "#ffffff",
                    border: "var(--border-hairline)",
                    borderRadius: "var(--radius-card)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    zIndex: 100,
                    maxHeight: "320px",
                    overflowY: "auto",
                    padding: "6px 0",
                  }}
                >
                  <div style={{ padding: "8px 12px", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Switch Account
                  </div>
                  {accounts.length > 0 ? (
                    accounts.map((acct) => (
                      <button
                        key={acct.id}
                        onClick={() => handleSwitchAccount(acct.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 16px",
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        className="dropdown-item-hover"
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
                          <div style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{acct.username}</div>
                        </div>
                        {acct.username === activeAccountUsername && (
                          <CheckCircle2 size={16} color="var(--accent-verdant)" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: "12px", fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
                      No accounts linked yet
                    </div>
                  )}

                  <div style={{ height: "1px", background: "var(--border-hairline)", margin: "6px 0" }}></div>

                  {/* Connect new account */}
                  <a
                    href="/api/auth/instagram?force_oauth=true"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      color: "var(--text-main)",
                      textDecoration: "none",
                    }}
                    className="dropdown-item-hover"
                  >
                    <Plus size={16} color="var(--text-muted)" />
                    Connect account
                  </a>

                  <div style={{ height: "1px", background: "var(--border-hairline)", margin: "6px 0" }}></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      color: "var(--accent-danger)",
                    }}
                    className="dropdown-item-hover"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

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
      <style dangerouslySetInnerHTML={{__html: `
        .dropdown-item-hover:hover {
          background-color: var(--bg-soft) !important;
        }
      `}} />
    </div>
  );
}
