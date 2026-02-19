import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Home, Settings, Code, Download, Share, Smartphone, Mail, MessageSquare, Sun, Moon, Heart, Sparkles, Trophy, BookOpen, Wind, PenLine, BarChart3, Library, Quote, ShieldAlert, Flame, CloudMoon, Mic, Fingerprint, Palette, Timer, Crosshair, Gamepad2 } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAppMode } from "@/hooks/use-app-mode";
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

interface NavCategory {
  label: string;
  items: { href: string; icon: any; label: string }[];
}

const navCategories: NavCategory[] = [
  {
    label: "Vent",
    items: [
      { href: "/home", icon: Home, label: "Command Center" },
      { href: "/conversations", icon: MessageSquare, label: "Conversations" },
      { href: "/vent-library", icon: Library, label: "Vent Library" },
      { href: "/voice-fingerprint", icon: Fingerprint, label: "Voice Fingerprint" },
    ],
  },
  {
    label: "Reflect",
    items: [
      { href: "/journal", icon: PenLine, label: "Written Journal" },
      { href: "/voice-journal", icon: Mic, label: "Voice Journal" },
      { href: "/mood-analytics", icon: BarChart3, label: "Mood Analytics" },
      { href: "/mood-portrait", icon: Palette, label: "Mood Portrait" },
      { href: "/affirmations", icon: Quote, label: "Affirmations" },
      { href: "/progress", icon: Trophy, label: "Progress" },
    ],
  },
  {
    label: "Relax",
    items: [
      { href: "/zen", icon: Wind, label: "Zen Zone" },
      { href: "/sleep-sounds", icon: CloudMoon, label: "Sleep Sounds" },
      { href: "/rage-room", icon: Flame, label: "Rage Room" },
    ],
  },
  {
    label: "Connect",
    items: [
      { href: "/void-echo", icon: Timer, label: "Void Echo" },
      { href: "/signal", icon: Heart, label: "Signal Chat" },
    ],
  },
  {
    label: "Safety",
    items: [
      { href: "/crisis", icon: ShieldAlert, label: "Crisis Toolkit" },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/blog", icon: BookOpen, label: "Blog" },
      { href: "/mission", icon: Sparkles, label: "From the Void" },
      { href: "/settings", icon: Settings, label: "Settings" },
      { href: "/contact", icon: Mail, label: "Contact" },
      { href: "/developer", icon: Code, label: "Developer" },
    ],
  },
];

export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const { canInstall, isInstalled, showIosInstructions, install } = usePwaInstall();
  const { theme, toggle: toggleTheme } = useTheme();
  const { mode, toggle: toggleMode, isPlayMode } = useAppMode();

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
        <Link href="/home" data-testid="link-home">
          <span className="text-sm font-bold tracking-tight font-display text-foreground">
            THE VOID
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMode}
            className={`toggle-elevate ${isPlayMode ? "toggle-elevated" : ""}`}
            data-testid="button-mode-toggle"
            title={isPlayMode ? "Play Mode — data not tracked" : "Focus Mode — tracking active"}
          >
            {isPlayMode ? <Gamepad2 className="w-4 h-4 text-amber-400" /> : <Crosshair className="w-4 h-4 text-cyan-400" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
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
          <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-xl border-white/5 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left text-foreground">
                THE VOID
              </SheetTitle>
              <p className="text-xs text-muted-foreground text-left">
                by DarkWave Studios
              </p>
            </SheetHeader>

            {isPlayMode && (
              <div className="mt-3 mx-1 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Play Mode Active</span>
                </div>
                <p className="text-[10px] text-amber-400/60 mt-0.5">Sessions won't affect your analytics</p>
              </div>
            )}

            <nav className="flex flex-col gap-0.5 mt-4">
              {navCategories.map((category, catIdx) => (
                <div key={category.label}>
                  {catIdx > 0 && <Separator className="my-2 bg-white/5" />}
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] px-3 mb-1 font-medium">
                    {category.label}
                  </p>
                  {category.items.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                        <div
                          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover-elevate"
                          }`}
                          data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
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
      </div>
    </header>
  );
}
