import { Link } from "wouter";
import { Shield, ExternalLink, Smartphone } from "lucide-react";
import { SiGoogleplay, SiApple } from "react-icons/si";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-background/80 backdrop-blur-xl py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-5">
          <Smartphone className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Get the App</span>
        </div>
        <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-white/[0.04] border border-white/10 backdrop-blur-md"
            data-testid="badge-google-play"
          >
            <SiGoogleplay className="w-5 h-5 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground leading-none">Google Play</span>
              <span className="text-xs font-semibold text-foreground leading-tight">Coming Soon</span>
            </div>
          </div>
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-white/[0.04] border border-white/10 backdrop-blur-md"
            data-testid="badge-app-store"
          >
            <SiApple className="w-5 h-5 text-white/80" />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground leading-none">App Store</span>
              <span className="text-xs font-semibold text-foreground leading-tight">Coming Soon</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-xs text-muted-foreground">
              <a
                href="https://DarkwaveStudios.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors inline-flex items-center gap-0.5"
                data-testid="link-darkwave"
              >
                DarkwaveStudios.io
                <ExternalLink className="w-2.5 h-2.5" />
              </a>{" "}
              Copyright 2026
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Protected by{" "}
                <a
                  href="https://TrustShield.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors inline-flex items-center gap-0.5"
                  data-testid="link-trustshield"
                >
                  TrustShield.tech
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by Trust Layer &ndash;{" "}
              <a
                href="https://dwtl.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors inline-flex items-center gap-0.5"
                data-testid="link-dwtl"
              >
                dwtl.io
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" data-testid="link-privacy">
              <span className="hover:text-foreground transition-colors cursor-pointer">
                Privacy Policy
              </span>
            </Link>
            <Link href="/terms" data-testid="link-terms">
              <span className="hover:text-foreground transition-colors cursor-pointer">
                Terms of Service
              </span>
            </Link>
            <Link href="/contact" data-testid="link-contact">
              <span className="hover:text-foreground transition-colors cursor-pointer">
                Contact
              </span>
            </Link>
            <Link href="/developer" data-testid="link-developer">
              <span className="hover:text-foreground transition-colors cursor-pointer">
                Developer
              </span>
            </Link>
            <Link href="/signal" data-testid="link-signal-chat">
              <span className="text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                Signal Chat
              </span>
            </Link>
          </nav>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            THE VOID is a safe space to blow off steam without hurting anyone or anything. It is not a substitute for professional mental health care.
            Our AI will never encourage harm to yourself, others, or any living being. If you need support, visit <a href="/signal" className="text-red-400 underline underline-offset-2">Signal Chat</a> or call 988 (Suicide &amp; Crisis Lifeline).
          </p>
        </div>
      </div>
    </footer>
  );
}
