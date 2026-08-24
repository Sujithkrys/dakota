import React, { useState } from "react";
import { 
  X, Search, Bot, Users, ShieldAlert, Database, BookOpen, 
  ExternalLink, LogOut
} from "lucide-react";

interface LinkedAccount {
  id: string;
  username: string;
  profile_pic: string | null;
  ig_account_id: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: LinkedAccount[];
  activeAccountUsername: string;
}

export function SettingsModal({ isOpen, onClose, accounts, activeAccountUsername }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("automation_defaults");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(12, 10, 9, 0.4)", // Dimmed backdrop
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        .settings-modal-input::placeholder {
          color: var(--text-muted);
        }
      `}} />

      {/* Modal Shell */}
      <div style={{
        position: "relative",
        background: "#ffffff",
        borderRadius: "var(--radius-card)",
        width: "65vw",
        maxWidth: "1280px",
        height: "88vh",
        maxHeight: "900px",
        display: "flex",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden"
      }}>
        {/* Close Button Floating Top-Right */}
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "var(--bg-soft)",
            border: "var(--border-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-muted)",
            zIndex: 10
          }}
          title="Close Settings"
        >
          <X size={18} />
        </button>

        {/* Left Sidebar */}
        <div style={{
          width: "240px",
          borderRight: "var(--border-hairline)",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
        }}>
          {/* Search Input */}
          <div style={{ position: "relative", marginBottom: "32px" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text"
              className="settings-modal-input" 
              placeholder="Search settings"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                borderRadius: "var(--radius-button)",
                border: "var(--border-hairline)",
                fontSize: "0.95rem",
                fontFamily: "var(--font-body)",
                color: "var(--text-main)",
                outline: "none",
                background: "var(--bg-soft)",
              }}
            />
          </div>

          <div style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            fontFamily: "var(--font-body)",
            color: "var(--text-muted)",
            letterSpacing: "0.5px",
            marginBottom: "12px",
            paddingLeft: "12px"
          }}>
            SETTINGS
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              { id: "automation_defaults", label: "Automation defaults", icon: Bot },
              { id: "connected_accounts", label: "Connected accounts", icon: Users },
              { id: "safety_alerts", label: "Safety & alerts", icon: ShieldAlert },
              { id: "data_privacy", label: "Data & privacy", icon: Database },
              { id: "support_docs", label: "Support & docs", icon: BookOpen },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-button)",
                    background: isActive ? "#E1F5EE" : "transparent",
                    color: isActive ? "var(--accent-verdant)" : "var(--text-main)",
                    fontWeight: isActive ? "600" : "500",
                    fontFamily: "var(--font-body)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    textAlign: "left"
                  }}
                >
                  <Icon size={18} color={isActive ? "var(--accent-verdant)" : "currentColor"} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Panel */}
        <div style={{
          flex: 1,
          background: "#ffffff",
          padding: "48px 56px",
          overflowY: "auto"
        }}>
          {activeTab === "automation_defaults" && (
            <div style={{ maxWidth: "680px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "600", fontFamily: "var(--font-display)", marginBottom: "32px", color: "var(--text-main)" }}>
                Automation defaults
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ paddingBottom: "24px", borderBottom: "var(--border-hairline)", marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "500", fontFamily: "var(--font-body)", color: "var(--text-main)", marginBottom: "16px" }}>Brand context and tone</label>
                  <textarea 
                    className="settings-modal-input"
                    rows={4} 
                    placeholder="e.g. We are Dakota..."
                    defaultValue="Dakota is a premium Instagram automation platform. Be friendly, energetic, and helpful. Mention our free 14-day trial."
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-button)",
                      border: "var(--border-hairline)",
                      fontSize: "0.95rem",
                      fontFamily: "var(--font-body)",
                      color: "var(--text-main)",
                      outline: "none",
                      resize: "vertical"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: "500", fontFamily: "var(--font-body)", color: "var(--text-main)" }}>Default fallback response</label>
                  <input 
                    type="text" 
                    className="settings-modal-input"
                    defaultValue="Thanks for your message! Our team will get back to you shortly."
                    style={{
                      width: "350px",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-button)",
                      border: "var(--border-hairline)",
                      fontSize: "0.95rem",
                      fontFamily: "var(--font-body)",
                      color: "var(--text-main)",
                      outline: "none"
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "connected_accounts" && (
            <div style={{ maxWidth: "680px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "600", fontFamily: "var(--font-display)", marginBottom: "32px", color: "var(--text-main)" }}>
                Connected accounts
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column" }}>
                {accounts.length > 0 ? accounts.map((acct) => (
                  <div key={acct.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      {acct.profile_pic ? (
                        <img src={acct.profile_pic} alt={acct.username} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--text-main)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "1rem", fontFamily: "var(--font-body)" }}>
                          {acct.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.95rem", fontFamily: "var(--font-body)", color: "var(--text-main)" }}>@{acct.username}</div>
                        <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-body)", color: "var(--accent-verdant)" }}>Connected</div>
                      </div>
                    </div>
                    <button style={{ color: "var(--accent-danger)", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.95rem", fontFamily: "var(--font-body)", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                      <LogOut size={16} /> Disconnect
                    </button>
                  </div>
                )) : (
                  <div style={{ paddingBottom: "24px", borderBottom: "var(--border-hairline)", marginBottom: "24px", color: "var(--text-muted)", fontSize: "0.95rem", fontFamily: "var(--font-body)" }}>
                    No accounts connected yet.
                  </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <a href="/api/auth/instagram?force_oauth=true" style={{ fontSize: "0.95rem", fontFamily: "var(--font-body)", color: "var(--text-main)", fontWeight: "500", textDecoration: "none" }}>
                    + Connect another account
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === "safety_alerts" && (
            <div style={{ maxWidth: "680px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "600", fontFamily: "var(--font-display)", marginBottom: "32px", color: "var(--text-main)" }}>
                Safety & alerts
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)", marginBottom: "24px" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: "500", fontFamily: "var(--font-body)", color: "var(--text-main)" }}>Max DMs per hour</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <input type="range" min="10" max="1000" defaultValue="150" style={{ width: "160px" }} />
                    <span style={{ fontSize: "0.9rem", fontFamily: "var(--font-mono)", fontWeight: "600", color: "var(--text-main)", width: "40px", textAlign: "right" }}>150</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)", marginBottom: "24px" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: "500", fontFamily: "var(--font-body)", color: "var(--text-main)" }}>Pause all automations</label>
                  <div style={{ width: "44px", height: "24px", borderRadius: "12px", background: "var(--border-hairline)", position: "relative", cursor: "pointer" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: "500", fontFamily: "var(--font-body)", color: "var(--text-main)" }}>Alert on delivery failures</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Threshold:</span>
                      <input type="number" className="settings-modal-input" defaultValue="5" style={{ width: "60px", padding: "6px", borderRadius: "6px", border: "var(--border-hairline)", outline: "none", fontFamily: "var(--font-mono)", fontSize: "0.95rem", color: "var(--text-main)" }} />
                    </div>
                    <div style={{ width: "44px", height: "24px", borderRadius: "12px", background: "var(--accent-verdant)", position: "relative", cursor: "pointer" }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", right: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data_privacy" && (
            <div style={{ maxWidth: "680px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "600", fontFamily: "var(--font-display)", marginBottom: "32px", color: "var(--text-main)" }}>
                Data & privacy
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)", marginBottom: "24px" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: "500", fontFamily: "var(--font-body)", color: "var(--text-main)" }}>Export all contact data</label>
                  <button style={{ padding: "8px 16px", borderRadius: "var(--radius-button)", background: "#ffffff", border: "var(--border-hairline)", color: "var(--text-main)", fontSize: "0.95rem", fontFamily: "var(--font-body)", fontWeight: "500", cursor: "pointer" }}>
                    Export CSV
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)", marginBottom: "48px" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: "500", fontFamily: "var(--font-body)", color: "var(--text-main)" }}>Delete a contact&apos;s data</label>
                  <input 
                    type="text" 
                    className="settings-modal-input"
                    placeholder="Search username..."
                    style={{
                      width: "240px",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-button)",
                      border: "var(--border-hairline)",
                      fontSize: "0.95rem",
                      fontFamily: "var(--font-body)",
                      color: "var(--text-main)",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: "600", fontFamily: "var(--font-body)", color: "var(--accent-danger)" }}>Delete all captured data</label>
                  <button style={{ padding: "8px 16px", borderRadius: "var(--radius-button)", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--accent-danger)", fontSize: "0.95rem", fontFamily: "var(--font-body)", fontWeight: "600", cursor: "pointer" }}>
                    Delete All Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "support_docs" && (
            <div style={{ maxWidth: "680px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "600", fontFamily: "var(--font-display)", marginBottom: "32px", color: "var(--text-main)" }}>
                Support & docs
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column" }}>
                <a href="#" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)", marginBottom: "24px", textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)" }}>
                    <BookOpen size={18} color="var(--text-muted)" />
                    <span style={{ fontSize: "0.95rem", fontFamily: "var(--font-body)", fontWeight: "500" }}>Documentation</span>
                  </div>
                  <ExternalLink size={16} color="var(--text-muted)" />
                </a>

                <a href="#" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)", marginBottom: "24px", textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)" }}>
                    <Bot size={18} color="var(--text-muted)" />
                    <span style={{ fontSize: "0.95rem", fontFamily: "var(--font-body)", fontWeight: "500" }}>Contact support</span>
                  </div>
                  <ExternalLink size={16} color="var(--text-muted)" />
                </a>

                <a href="#" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: "var(--border-hairline)", textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)" }}>
                    <Database size={18} color="var(--text-muted)" />
                    <span style={{ fontSize: "0.95rem", fontFamily: "var(--font-body)", fontWeight: "500" }}>Instagram API setup guide</span>
                  </div>
                  <ExternalLink size={16} color="var(--text-muted)" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
