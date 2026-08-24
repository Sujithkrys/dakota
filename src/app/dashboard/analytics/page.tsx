"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar, ChevronDown, BarChart3, Download, CheckCircle2, AlertTriangle, Star, Activity, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsOverviewPage() {
  const [activeTab, setActiveTab] = useState("Performance");
  const [range, setRange] = useState("7d");
  const [rangeDropdownOpen, setRangeDropdownOpen] = useState(false);

  // Performance Tab State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingPerf, setLoadingPerf] = useState(true);

  // Activity Log State
  const [activityEvents, setActivityEvents] = useState<any[]>([]);
  const [totalActivityCount, setTotalActivityCount] = useState(0);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityFilter, setActivityFilter] = useState("all");
  const [automationFilter, setAutomationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Account Performance State
  const [accountPerfData, setAccountPerfData] = useState<any>(null);
  const [loadingAccPerf, setLoadingAccPerf] = useState(true);

  // Automations list for dropdown
  const [automations, setAutomations] = useState<any[]>([]);

  useEffect(() => {
    // Fetch automations for filter
    fetch("/api/automations")
      .then(res => res.json())
      .then(data => {
        if (data.automations) setAutomations(data.automations);
      })
      .catch(() => {});
  }, []);

  const fetchAnalytics = async (selectedRange: string) => {
    setLoadingPerf(true);
    try {
      const res = await fetch(`/api/analytics?range=${selectedRange}`);
      const data = await res.json();
      if (data) setAnalyticsData(data);
    } catch {
    } finally {
      setLoadingPerf(false);
    }
  };

  const fetchActivityLog = async () => {
    setLoadingActivity(true);
    try {
      const res = await fetch(`/api/analytics/activity-log?range=${range}&eventType=${activityFilter}&automationId=${automationFilter}&page=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data) {
        setActivityEvents(data.events || []);
        setTotalActivityCount(data.totalCount || 0);
      }
    } catch {
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchAccountPerformance = async () => {
    setLoadingAccPerf(true);
    try {
      const res = await fetch(`/api/analytics/account-performance?range=${range}`);
      const data = await res.json();
      if (data) setAccountPerfData(data);
    } catch {
    } finally {
      setLoadingAccPerf(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Performance") {
      fetchAnalytics(range);
    } else if (activeTab === "Activity Log") {
      fetchActivityLog();
    } else if (activeTab === "Account Performance") {
      fetchAccountPerformance();
    }
  }, [activeTab, range, activityFilter, automationFilter, page]);

  const metrics = analyticsData?.metrics || { dmsSent: 0, linkClicks: 0, ctr: "0%", leadsCaptured: 0 };
  const performanceRows = analyticsData?.performanceList || [];

  const handleExportActivityCSV = () => {
    const headers = ["Date", "Event Type", "Description"];
    const rows = activityEvents.map((e) => [
      new Date(e.created_at).toLocaleString(),
      e.type,
      e.description.replace(/,/g, " - ") // basic escaping for CSV
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dmflow_activity_log_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPerformanceTab = () => (
    <>
      <section style={{ marginBottom: "44px" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "16px" }}>Key metrics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>DMs sent</div>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>{metrics.dmsSent.toLocaleString()}</div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Total automated messages sent</span>
          </div>
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>Link clicks</div>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>{metrics.linkClicks.toLocaleString()}</div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>CTA link clicks tracked</span>
          </div>
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>Click-through rate</div>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>{metrics.ctr}</div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Overall CTR</span>
          </div>
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>Leads captured</div>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>{metrics.leadsCaptured}</div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Email capture enabled</span>
          </div>
        </div>
      </section>

      <section>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.4rem" }}>Automation Performance</h2>
        </div>
        <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
          {loadingPerf ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading performance analytics...</div>
          ) : performanceRows.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <BarChart3 size={32} color="var(--text-muted)" />
              <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>No Automation Performance Data Yet</div>
              <div style={{ fontSize: "0.85rem" }}>Create and activate automations to see live performance analytics here.</div>
            </div>
          ) : (
            performanceRows.map((row: any) => (
              <div key={row.id} style={{ padding: "20px 24px", borderBottom: "var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--bg-soft)" }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>{row.name}</span>
                      <span style={{ padding: "2px 8px", borderRadius: "9999px", background: "rgba(12, 10, 9, 0.06)", fontSize: "0.72rem", fontWeight: "600" }}>{row.links}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>{row.dmsSent} DMs sent</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--accent-verdant)" }}>{row.ctr}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>CTR</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );

  const renderActivityLogTab = () => (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {["all", "sent", "failed", "lead"].map((type) => (
            <button
              key={type}
              onClick={() => { setActivityFilter(type); setPage(1); }}
              style={{
                padding: "6px 16px",
                borderRadius: "9999px",
                border: "var(--border-hairline)",
                background: activityFilter === type ? "var(--text-main)" : "#fff",
                color: activityFilter === type ? "#fff" : "var(--text-main)",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {type === "all" ? "All events" : type === "sent" ? "Sent" : type === "failed" ? "Failed" : "Leads"}
            </button>
          ))}
          <div style={{ width: "1px", height: "24px", background: "var(--border-hairline)", margin: "0 8px" }} />
          <div style={{ position: "relative" }}>
            <select
              value={automationFilter}
              onChange={(e) => { setAutomationFilter(e.target.value); setPage(1); }}
              style={{
                padding: "6px 32px 6px 16px",
                borderRadius: "8px",
                border: "var(--border-hairline)",
                background: "#fff",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                cursor: "pointer",
                appearance: "none",
                outline: "none"
              }}
            >
              <option value="all">All Automations</option>
              {automations.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <Filter size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          </div>
        </div>
        <button onClick={handleExportActivityCSV} className="btn-ig-connect" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
        {loadingActivity ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading activity log...</div>
        ) : activityEvents.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <Activity size={32} color="var(--text-muted)" />
            <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>No Activity Found</div>
            <div style={{ fontSize: "0.85rem" }}>Try adjusting your filters or date range.</div>
          </div>
        ) : (
          activityEvents.map((evt: any) => {
            const date = new Date(evt.created_at);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            const timeStr = isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            
            return (
              <div key={evt.id} style={{ padding: "16px 24px", borderBottom: "var(--border-hairline)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: evt.type === "sent" ? "rgba(16, 185, 129, 0.1)" : evt.type === "failed" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {evt.type === "sent" && <CheckCircle2 size={20} color="var(--accent-verdant)" />}
                  {evt.type === "failed" && <AlertTriangle size={20} color="var(--accent-danger)" />}
                  {evt.type === "lead" && <Star size={20} color="#f59e0b" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "500", fontSize: "0.95rem", color: "var(--text-main)" }}>
                    {evt.description}
                  </div>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {timeStr}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination controls */}
        {!loadingActivity && totalActivityCount > pageSize && (
          <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "var(--border-hairline)" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalActivityCount)} of {totalActivityCount}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "var(--border-hairline)", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= totalActivityCount}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "var(--border-hairline)", background: "#fff", cursor: page * pageSize >= totalActivityCount ? "not-allowed" : "pointer", opacity: page * pageSize >= totalActivityCount ? 0.5 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const renderAccountPerformanceTab = () => {
    if (loadingAccPerf) {
      return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading account performance...</div>;
    }

    const { deliveryTrend = [], funnel = { dmsSent: 0, linkClicks: 0, leads: 0 }, topTriggers = [] } = accountPerfData || {};
    
    const chartData = {
      labels: deliveryTrend.map((d: any) => d.day),
      datasets: [
        {
          fill: true,
          label: 'Delivery Rate (%)',
          data: deliveryTrend.map((d: any) => d.rate),
          borderColor: 'var(--text-main)',
          backgroundColor: 'rgba(28, 25, 23, 0.05)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: 'var(--text-main)'
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#fff',
          titleColor: '#000',
          bodyColor: '#000',
          borderColor: '#e5e5e5',
          borderWidth: 1,
          padding: 12,
          boxPadding: 4,
          usePointStyle: true,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: 'rgba(0,0,0,0.04)' },
          border: { display: false },
          ticks: { callback: (val: any) => val + '%' }
        },
        x: {
          grid: { display: false },
          border: { display: false }
        }
      }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        
        {/* Delivery Rate Chart */}
        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "16px" }}>Delivery Rate Trend</h2>
          <div className="glass-card" style={{ padding: "24px", height: "340px" }}>
            {deliveryTrend.length > 0 ? (
              <Line data={chartData} options={chartOptions as any} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No delivery data in selected range</div>
            )}
          </div>
        </section>

        {/* Funnel Over Time */}
        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "16px" }}>Funnel Over Time</h2>
          <div className="glass-card" style={{ padding: "32px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", alignItems: "center", textAlign: "center" }}>
            
            <div>
              <div style={{ fontSize: "2.8rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>{funnel.dmsSent.toLocaleString()}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", marginTop: "8px" }}>DMs Sent</div>
            </div>
            
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "-24px", width: "48px", height: "2px", background: "var(--border-hairline)", transform: "translateY(-50%)" }} />
              <div style={{ fontSize: "2.8rem", fontFamily: "var(--font-serif)", fontWeight: "300", color: "var(--accent-verdant)" }}>{funnel.linkClicks.toLocaleString()}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", marginTop: "8px" }}>Link Clicks</div>
              <div style={{ position: "absolute", top: "50%", right: "-24px", width: "48px", height: "2px", background: "var(--border-hairline)", transform: "translateY(-50%)" }} />
            </div>
            
            <div>
              <div style={{ fontSize: "2.8rem", fontFamily: "var(--font-serif)", fontWeight: "300", color: "#f59e0b" }}>{funnel.leads.toLocaleString()}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", marginTop: "8px" }}>Leads Captured</div>
            </div>

          </div>
          <div style={{ marginTop: "12px", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "right" }}>
            * Comments Handled is omitted due to insufficient historical tracking data.
          </div>
        </section>

        {/* Best Performing Trigger Type */}
        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "16px" }}>Best Performing Trigger Types</h2>
          <div className="glass-card">
            {topTriggers.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No trigger data available</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ borderBottom: "var(--border-hairline)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600" }}>
                    <th style={{ padding: "16px 24px" }}>TRIGGER TYPE</th>
                    <th style={{ padding: "16px 24px", textAlign: "right" }}>AVERAGE CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {topTriggers.map((t: any, i: number) => (
                    <tr key={t.type} style={{ borderBottom: i === topTriggers.length - 1 ? "none" : "var(--border-hairline)" }}>
                      <td style={{ padding: "16px 24px", fontWeight: "500" }}>{t.type}</td>
                      <td style={{ padding: "16px 24px", textAlign: "right", color: "var(--accent-verdant)", fontWeight: "600" }}>{t.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>
    );
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "6px" }}>Analytics</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              DMs sent, link clicks, top automations, and audience engagement trends.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setRangeDropdownOpen(!rangeDropdownOpen)}
              style={{
                padding: "8px 18px",
                borderRadius: "9999px",
                background: "#ffffff",
                border: "var(--border-hairline)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Calendar size={15} /> {range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "All time"} <ChevronDown size={14} />
            </button>

            {rangeDropdownOpen && (
              <div
                className="glass-card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "44px",
                  width: "160px",
                  padding: "6px",
                  zIndex: 20,
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {[
                  { label: "Last 7 days", val: "7d" },
                  { label: "Last 30 days", val: "30d" },
                  { label: "All time", val: "all" },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => {
                      setRange(item.val);
                      setRangeDropdownOpen(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: range === item.val ? "var(--bg-soft)" : "transparent",
                      border: "none",
                      color: "var(--text-main)",
                      fontSize: "0.85rem",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Row */}
        <div style={{ display: "flex", gap: "24px", borderBottom: "var(--border-hairline)", marginBottom: "36px" }}>
          {["Performance", "Activity Log", "Account Performance"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                style={{
                  padding: "12px 4px",
                  background: "transparent",
                  border: "none",
                  borderBottom: isActive ? "2px solid var(--text-main)" : "2px solid transparent",
                  color: isActive ? "var(--text-main)" : "var(--text-muted)",
                  fontWeight: isActive ? "600" : "400",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === "Performance" && renderPerformanceTab()}
        {activeTab === "Activity Log" && renderActivityLogTab()}
        {activeTab === "Account Performance" && renderAccountPerformanceTab()}

      </div>
    </DashboardLayout>
  );
}
