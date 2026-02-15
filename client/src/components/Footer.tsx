import { Link } from "wouter";
import { Shield, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-background/80 backdrop-blur-xl py-6 px-4">
      <div className="max-w-5xl mx-auto">
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
            <Link href="/developer" data-testid="link-developer">
              <span className="hover:text-foreground transition-colors cursor-pointer">
                Developer
              </span>
            </Link>
          </nav>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            THE VOID is a safe space to blow off steam without hurting anyone or anything. It is not a substitute for professional mental health care.
            Our AI will never encourage harm to yourself, others, or any living being. If you are in crisis, please call 988 (Suicide &amp; Crisis Lifeline).
          </p>
        </div>
      </div>
    </footer>
  );
}
