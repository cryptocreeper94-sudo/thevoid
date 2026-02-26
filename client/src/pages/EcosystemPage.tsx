import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Shield, Globe, Fingerprint, Code2, Zap } from "lucide-react";

export default function EcosystemPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '<div id="dw-ecosystem-directory"></div>';

    const existingScript = document.querySelector(
      'script[src="https://dwsc.io/api/ecosystem/directory.js"]'
    );
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.src = "https://dwsc.io/api/ecosystem/directory.js";
    script.setAttribute("data-theme", "dark");
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      const s = document.querySelector(
        'script[src="https://dwsc.io/api/ecosystem/directory.js"]'
      );
      if (s) s.remove();
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background, #0a0a0a)" }}>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(6,182,212,0.05), transparent, transparent)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 600, height: 300,
            background: "rgba(6,182,212,0.05)",
            borderRadius: "50%", filter: "blur(120px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem", position: "relative", zIndex: 10 }}>

          <div style={{ marginBottom: "2.5rem" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "#888", marginBottom: 24, textDecoration: "none" }} data-testid="link-back-ecosystem">
              <ArrowLeft style={{ width: 16, height: 16 }} />
              Back to THE VOID
            </Link>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))",
                border: "1px solid rgba(6,182,212,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 8px 24px rgba(6,182,212,0.1)",
              }}>
                <Shield style={{ width: 28, height: 28, color: "#22d3ee" }} />
              </div>
              <div>
                <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 1.875rem)", fontWeight: 700, letterSpacing: "-0.025em" }}>
                  <span style={{ background: "linear-gradient(to right, #22d3ee, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Trust Layer
                  </span>{" "}
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>Ecosystem</span>
                </h1>
                <p style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)", color: "#888", marginTop: 4 }}>
                  Powered by DarkWave Studios
                </p>
              </div>
            </div>

            <p style={{ fontSize: "clamp(0.875rem, 2.5vw, 1rem)", color: "#888", maxWidth: 640, lineHeight: 1.6 }}>
              THE VOID is part of the Trust Layer ecosystem — a network of apps built on
              verified identity, shared credentials, and blockchain-backed trust. Your single
              login works across every connected platform.
            </p>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(6,182,212,0.15)",
            borderRadius: 12, padding: "clamp(1rem, 3vw, 1.5rem)",
            marginBottom: "2.5rem",
            boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <Globe style={{ width: 16, height: 16, color: "#22d3ee" }} />
              <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", color: "#22d3ee", letterSpacing: "0.05em" }} data-testid="text-connected-apps">
                Connected Apps
              </h2>
            </div>
            <div ref={containerRef} style={{ minHeight: 200 }} data-testid="container-ecosystem-directory" />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "clamp(0.75rem, 2vw, 1rem)",
            marginBottom: "2.5rem",
          }}>
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 12, padding: "clamp(1rem, 3vw, 1.25rem)",
            }} data-testid="card-feature-sso">
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
              }}>
                <Fingerprint style={{ width: 16, height: 16, color: "#22d3ee" }} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Single Sign-On</h3>
              <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                One set of credentials across all DarkWave apps. No redirects — each app
                has its own login, synced behind the scenes.
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 12, padding: "clamp(1rem, 3vw, 1.25rem)",
            }} data-testid="card-feature-blockchain">
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
              }}>
                <Zap style={{ width: 16, height: 16, color: "#a78bfa" }} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Blockchain Verified</h3>
              <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                Identity and credentials anchored on Solana. Tamper-proof verification
                for users, organizations, and digital assets.
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 12, padding: "clamp(1rem, 3vw, 1.25rem)",
            }} data-testid="card-feature-api">
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
              }}>
                <Code2 style={{ width: 16, height: 16, color: "#34d399" }} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Open API</h3>
              <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                Ecosystem API lets connected apps share data and alerts securely
                via JWT-authenticated endpoints.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", paddingBottom: 16 }}>
            <a href="https://dwsc.io" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} data-testid="link-dwsc">
              dwsc.io
            </a>
            <span style={{ margin: "0 8px" }}>&bull;</span>
            <a href="https://tlid.io" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} data-testid="link-tlid">
              tlid.io
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
