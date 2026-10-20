import * as React from "react";
import {
  BookOpen,
  ClipboardList,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme";
import { roleLabel } from "@/lib/format";

export const ROLE_NAV = {
  admin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "students", label: "Student register", icon: Users },
    { id: "feedback", label: "Feedback queue", icon: MessageSquare },
    { id: "trend", label: "Risk trend", icon: LineChart },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "governance", label: "Governance", icon: Shield },
  ],
  teacher: [
    { id: "roster", label: "Class roster", icon: ClipboardList },
    { id: "predictors", label: "Predictors", icon: Sparkles },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ],
  student: [
    { id: "overview", label: "My standing", icon: GraduationCap },
    { id: "goal", label: "Goals & badges", icon: Compass },
    { id: "predictors", label: "Pathway tools", icon: LineChart },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ],
  analyst: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "model", label: "Model lab", icon: BookOpen },
    { id: "cohorts", label: "Cohorts", icon: Users },
    { id: "trend", label: "Risk trend", icon: LineChart },
  ],
};

const ROLE_WORKSPACE = {
  admin: "Administration",
  teacher: "Teaching",
  student: "Student portal",
  analyst: "Analysis",
};

export function AppShell({
  user,
  section,
  onSectionChange,
  onLogout,
  onOpenSettings,
  alertSlot,
  children,
}) {
  const nav = ROLE_NAV[user.role] || [];
  const [mobileOpen, setMobileOpen] = React.useState(false);

  function navigate(id) {
    onSectionChange(id);
    setMobileOpen(false);
  }

  const sidebar = (
    <SidebarContent
      user={user}
      nav={nav}
      section={section}
      onNavigate={navigate}
      onOpenSettings={() => {
        setMobileOpen(false);
        onOpenSettings();
      }}
      onLogout={onLogout}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[15.5rem] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {sidebar}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[15.5rem]">
        <TopBar
          user={user}
          section={section}
          nav={nav}
          onMenu={() => setMobileOpen(true)}
        />
        {alertSlot ? <div className="px-4 pt-4 sm:px-6 lg:px-8">{alertSlot}</div> : null}
        <main className="mx-auto w-full max-w-[84rem] px-4 pt-6 pb-16 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ user, nav, section, onNavigate, onOpenSettings, onLogout }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-5">
        <Wordmark sub="Academic intelligence" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-3" aria-label="Primary">
        <div>
          <div className="mb-1.5 px-2 text-[0.625rem] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
            Workspace
          </div>
          <ul className="space-y-0.5">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[0.8125rem] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/75 hover:bg-accent/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-1.5 px-2 text-[0.625rem] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
            Account
          </div>
          <ul className="space-y-0.5">
            <li>
              <SidebarAction icon={Settings} label="Settings & security" onClick={onOpenSettings} />
            </li>
            <li>
              <SidebarAction
                icon={LifeBuoy}
                label="Feedback & support"
                onClick={() => window.dispatchEvent(new CustomEvent("ep:open-feedback"))}
              />
            </li>
          </ul>
        </div>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-accent/40 px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[0.6875rem] font-semibold text-primary uppercase">
            {(user.full_name || user.username || "?").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.8125rem] font-medium">
              {user.full_name || user.username}
            </div>
            <div className="truncate text-[0.6875rem] text-muted-foreground">
              {roleLabel(user.role)} · {user.username}
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onLogout}
                className="shrink-0 text-muted-foreground hover:bg-risk/10 hover:text-risk"
                aria-label="Sign out"
              >
                <LogIn className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

function SidebarAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[0.8125rem] font-medium text-sidebar-foreground/75 transition-colors outline-none hover:bg-accent/60 hover:text-sidebar-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30"
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function TopBar({ user, section, nav, onMenu }) {
  const current = nav.find((item) => item.id === section);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>

        <div className="flex min-w-0 items-center gap-2 text-[0.8125rem]">
          <span className="hidden truncate text-muted-foreground sm:inline">
            {ROLE_WORKSPACE[user.role] || "Workspace"}
          </span>
          <span className="hidden text-muted-foreground/40 sm:inline">/</span>
          <span className="truncate font-medium">{current?.label || "Workspace"}</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 hidden items-center gap-1.5 rounded-full border border-border/70 px-2 py-1 text-[0.6875rem] text-muted-foreground sm:inline-flex">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-safe opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-safe" />
            </span>
            Live monitoring
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 pl-1.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 font-mono text-[0.625rem] font-semibold text-primary uppercase">
                  {(user.full_name || user.username || "?").slice(0, 2)}
                </span>
                <span className="hidden max-w-[9rem] truncate text-[0.8125rem] font-medium sm:inline">
                  {user.full_name || user.username}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="truncate text-foreground">{user.full_name || user.username}</div>
                <div className="truncate text-[0.6875rem] font-normal capitalize">
                  {roleLabel(user.role)}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => window.dispatchEvent(new CustomEvent("ep:open-settings"))}>
                <Settings />
                Settings &amp; security
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => window.dispatchEvent(new CustomEvent("ep:sign-out"))}
                className="text-risk focus:bg-risk/10 focus:text-risk"
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
