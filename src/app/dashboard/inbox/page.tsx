"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Inbox,
  Send,
  MessageSquare,
  User,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Conversation {
  id: string;
  user_id: string;
  follower_id: string;
  follower_username?: string;
  last_message?: string;
  last_message_at?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string;
  direction: "incoming" | "outgoing";
  created_at: string;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/inbox/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !activeConv) {
          setActiveConv(data.conversations[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/inbox/messages?conversation_id=${encodeURIComponent(convId)}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConv) return;

    const textToSend = replyText;
    setReplyText("");
    setSending(true);

    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: activeConv.id,
      sender_id: activeConv.user_id,
      recipient_id: activeConv.follower_id,
      message_text: textToSend,
      direction: "outgoing",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConv.id,
          user_id: activeConv.user_id,
          recipient_id: activeConv.follower_id,
          message_text: textToSend,
        }),
      });

      if (res.ok) {
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.follower_username || c.follower_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flex: 1, height: "100vh", overflow: "hidden" }}>
        
        {/* Left Pane: Conversations List */}
        <div
          style={{
            width: "360px",
            borderRight: "var(--border-hairline)",
            background: "rgba(14, 16, 25, 0.7)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header & Search */}
          <div style={{ padding: "20px", borderBottom: "var(--border-hairline)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "var(--coral-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Inbox size={18} color="#fff" />
                </div>
                <h1 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Manual Inbox</h1>
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: "var(--radius-button)",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "var(--border-hairline)",
                  color: "#fff",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No conversations found.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "var(--border-hairline)",
                      cursor: "pointer",
                      background: isActive ? "var(--coral-gradient-subtle)" : "transparent",
                      borderLeft: isActive ? "3px solid var(--accent-coral)" : "3px solid transparent",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.95rem", color: isActive ? "#ffffff" : "var(--text-main)" }}>
                        @{conv.follower_username || conv.follower_id}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        margin: 0,
                      }}
                    >
                      {conv.last_message || "No messages yet"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Message Thread & Composer */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(9, 10, 15, 0.9)" }}>
          {activeConv ? (
            <>
              {/* Thread Header */}
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "var(--border-hairline)",
                  background: "rgba(18, 20, 29, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "var(--coral-gradient)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                    }}
                  >
                    {(activeConv.follower_username || activeConv.follower_id).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                      @{activeConv.follower_username || activeConv.follower_id}
                    </h2>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Instagram Direct Message Thread
                    </span>
                  </div>
                </div>
              </div>

              {/* Message History List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {messagesLoading ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>Loading message thread...</div>
                ) : (
                  messages.map((msg) => {
                    const isOutgoing = msg.direction === "outgoing";
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isOutgoing ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            padding: "12px 18px",
                            borderRadius: isOutgoing ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                            background: isOutgoing ? "var(--coral-gradient)" : "rgba(255, 255, 255, 0.06)",
                            border: isOutgoing ? "none" : "var(--border-hairline)",
                            color: "#ffffff",
                            fontSize: "0.95rem",
                            lineHeight: 1.5,
                            boxShadow: isOutgoing ? "0 4px 15px rgba(255, 107, 74, 0.3)" : "none",
                          }}
                        >
                          {msg.message_text}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)", marginTop: "4px", paddingInline: "4px" }}>
                          {isOutgoing ? "Sent" : "Received"} • {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Composer */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: "20px 24px",
                  borderTop: "var(--border-hairline)",
                  background: "rgba(18, 20, 29, 0.8)",
                  display: "flex",
                  gap: "12px",
                }}
              >
                <input
                  type="text"
                  placeholder={`Reply to @${activeConv.follower_username || activeConv.follower_id}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: "var(--radius-button)",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "var(--border-hairline)",
                    color: "#fff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="btn-ig-connect"
                  style={{
                    borderRadius: "var(--radius-button)",
                    padding: "14px 24px",
                    fontSize: "0.95rem",
                    opacity: sending || !replyText.trim() ? 0.6 : 1,
                  }}
                >
                  <Send size={18} />
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              Select a conversation from the left to start messaging.
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
