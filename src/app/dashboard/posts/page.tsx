"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Instagram, Play, Heart, MessageCircle, ExternalLink } from "lucide-react";

export default function PostsPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await fetch("/api/instagram/media");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load posts");
        }
        
        setMedia(data.media || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMedia();
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginBottom: "6px" }}>Posts & Reels</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              View and manage your connected Instagram content.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading your Instagram content...
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--accent-danger)" }}>
            <p>{error}</p>
          </div>
        ) : media.length === 0 ? (
          <div
            className="glass-card gradient-orb-peach"
            style={{
              padding: "60px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <Instagram size={32} color="var(--text-main)" />
            <h3 style={{ fontSize: "1.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>No Posts Found</h3>
            <p style={{ color: "var(--text-body)", maxWidth: "450px", fontSize: "0.9rem" }}>
              We couldn't find any posts or reels on your connected Instagram account.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {media.map((item) => (
              <div
                key={item.id}
                className="glass-card"
                style={{
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Thumbnail Area */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "var(--bg-soft)" }}>
                  {item.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.thumbnail_url} 
                      alt={item.caption || "Instagram media"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                      <Instagram size={32} opacity={0.5} />
                    </div>
                  )}
                  
                  {/* Media Type Icon */}
                  <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.6)", borderRadius: "50%", padding: "6px", color: "#fff", display: "flex" }}>
                    {item.media_type === "VIDEO" ? <Play size={14} fill="currentColor" /> : <Instagram size={14} />}
                  </div>
                </div>

                {/* Details Area */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <p style={{ 
                    fontSize: "0.85rem", 
                    color: "var(--text-body)", 
                    marginBottom: "16px",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1
                  }}>
                    {item.caption || "No caption provided"}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "var(--border-hairline)" }}>
                    <div style={{ display: "flex", gap: "16px", color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: "500" }}>
                        <Heart size={14} /> {item.like_count}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: "500" }}>
                        <MessageCircle size={14} /> {item.comments_count}
                      </span>
                    </div>
                    
                    {item.permalink && (
                      <a 
                        href={item.permalink} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: "500", textDecoration: "none" }}
                      >
                        View <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
