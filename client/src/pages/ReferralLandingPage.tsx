import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";

export default function ReferralLandingPage() {
  const { hash } = useParams<{ hash: string }>();
  const [, setLocation] = useLocation();
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (!hash || tracked) return;

    fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralHash: hash, platform: "thevoid" }),
    })
      .then(() => setTracked(true))
      .catch(() => setTracked(true))
      .finally(() => {
        setTimeout(() => setLocation("/"), 1500);
      });
  }, [hash, tracked, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Redirecting to THE VOID...</p>
      </div>
    </div>
  );
}
