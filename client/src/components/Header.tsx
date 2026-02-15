import { Mic, History } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Header() {
  const [location] = useLocation();

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href} className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary font-medium shadow-glow-sm" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      )}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight leading-none group-hover:text-primary transition-colors">
              VENT<span className="text-primary">.ai</span>
            </h1>
            <span className="text-xs text-muted-foreground font-mono">SCREAM INTO THE VOID</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2 bg-secondary/30 backdrop-blur-md p-1.5 rounded-full border border-white/5">
          <NavItem href="/" icon={Mic} label="Record" />
          <NavItem href="/history" icon={History} label="History" />
        </nav>
      </div>
    </header>
  );
}
