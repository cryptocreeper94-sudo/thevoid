import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Home, Settings, Code, Download, Share, Smartphone } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/developer", icon: Code, label: "Developer" },
];

export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const { canInstall, isInstalled, showIosInstructions, install } = usePwaInstall();

  const handleInstallClick = async () => {
    if (canInstall) {
      await install();
      setOpen(false);
    } else if (showIosInstructions) {
      setShowIosGuide(true);
    }
  };

  const showInstallOption = (canInstall || showIosInstructions) && !isInstalled;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-1">
        <Link href="/" data-testid="link-home">
          <span className="text-sm font-bold tracking-tight font-display text-foreground">
            THE VOID
          </span>
        </Link>

        <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowIosGuide(false); }}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-menu"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-xl border-white/5">
            <SheetHeader>
              <SheetTitle className="text-left text-foreground">
                THE VOID
              </SheetTitle>
              <p className="text-xs text-muted-foreground text-left">
                by DarkWave Studios
              </p>
            </SheetHeader>
            <nav className="flex flex-col gap-1 mt-6">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover-elevate"
                      }`}
                      data-testid={`link-nav-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {showInstallOption && (
              <>
                <Separator className="my-4 bg-white/5" />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-cyan-400 hover-elevate w-full text-left"
                    data-testid="button-install-app"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                  </button>
                </div>
              </>
            )}

            {showIosGuide && (
              <div className="mt-3 mx-2 p-3 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <p className="text-xs font-medium text-foreground">Add to Home Screen</p>
                </div>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li className="flex items-start gap-1.5">
                    <span>1.</span>
                    <span>Tap the <Share className="w-3 h-3 inline text-cyan-400 mx-0.5" /> Share button in Safari</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>2.</span>
                    <span>Scroll down and tap "Add to Home Screen"</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>3.</span>
                    <span>Tap "Add" to confirm</span>
                  </li>
                </ol>
                <p className="text-[10px] text-muted-foreground/60 mt-2">
                  THE VOID will appear on your home screen as a standalone app
                </p>
              </div>
            )}

            {isInstalled && (
              <>
                <Separator className="my-4 bg-white/5" />
                <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-emerald-400/60">
                  <Smartphone className="w-4 h-4" />
                  <span>App Installed</span>
                </div>
              </>
            )}

            <div className="mt-auto pt-6 border-t border-white/5 absolute bottom-6 left-6 right-6">
              <p className="text-xs text-muted-foreground">
                DarkwaveStudios.io &copy; 2026
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
