import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Home, Settings, Code, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/developer", icon: Code, label: "Developer" },
];

export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-1">
        <Link href="/" data-testid="link-home">
          <span className="text-sm font-bold tracking-tight font-display text-foreground">
            THE VOID
          </span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
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
