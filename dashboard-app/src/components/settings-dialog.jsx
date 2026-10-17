import * as React from "react";
import { KeyRound, Loader2, Mail, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsDialog({ open, onOpenChange }) {
  const [prefs, setPrefs] = React.useState(null);
  const [me, setMe] = React.useState(null);
  const [savingPrefs, setSavingPrefs] = React.useState(false);
  const [totpSetup, setTotpSetup] = React.useState(null);
  const [totpCode, setTotpCode] = React.useState("");
  const [totpBusy, setTotpBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    apiGet("/notifications/preferences")
      .then((d) => setPrefs(d.preferences))
      .catch(() => setPrefs({ email_alerts: true, in_app_alerts: true }));
    apiGet("/auth/me")
      .then((d) => setMe(d.user))
      .catch(() => setMe(null));
  }, [open]);

  async function savePrefs(next) {
    setPrefs(next);
    setSavingPrefs(true);
    try {
      await apiPost("/notifications/preferences", next);
      toast.success("Preferences saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPrefs(false);
    }
  }

  async function startTotp() {
    setTotpBusy(true);
    try {
      const res = await apiPost("/auth/2fa/setup", {});
      setTotpSetup(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTotpBusy(false);
    }
  }

  async function confirmTotp() {
    setTotpBusy(true);
    try {
      await apiPost("/auth/2fa/confirm", { code: totpCode });
      toast.success("Two-factor authentication enabled");
      setMe((m) => ({ ...m, totp_enabled: true }));
      setTotpSetup(null);
      setTotpCode("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTotpBusy(false);
    }
  }

  async function disableTotp() {
    setTotpBusy(true);
    try {
      await apiPost("/auth/2fa/disable", {});
      toast.success("Two-factor authentication disabled");
      setMe((m) => ({ ...m, totp_enabled: false }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTotpBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Notifications and account security for this session.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="notifications">
          <TabsList className="w-full">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            {!prefs ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <SettingRow
                  icon={Mail}
                  title="Email alerts"
                  description="Get an email when a student is flagged high risk."
                >
                  <Switch
                    checked={prefs.email_alerts}
                    disabled={savingPrefs}
                    onCheckedChange={(v) => savePrefs({ ...prefs, email_alerts: v })}
                    aria-label="Email alerts"
                  />
                </SettingRow>
                <Separator />
                <SettingRow
                  icon={Smartphone}
                  title="In-app alert banner"
                  description="Show the live banner the moment a risk alert fires."
                >
                  <Switch
                    checked={prefs.in_app_alerts}
                    disabled={savingPrefs}
                    onCheckedChange={(v) => savePrefs({ ...prefs, in_app_alerts: v })}
                    aria-label="In-app alerts"
                  />
                </SettingRow>
              </>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                {me?.totp_enabled ? (
                  <ShieldCheck className="size-4 text-safe" />
                ) : (
                  <ShieldOff className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.8125rem] font-medium">Two-factor authentication</div>
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-muted-foreground">
                  {me?.totp_enabled
                    ? "Enabled — a 6-digit authenticator code is required at sign-in."
                    : "Add a second factor from Google Authenticator, Authy, or any TOTP app."}
                </p>
              </div>
            </div>

            {me?.totp_enabled ? (
              <Button variant="outline" size="sm" onClick={disableTotp} disabled={totpBusy} className="border-risk/30 text-risk hover:bg-risk/10 hover:text-risk">
                {totpBusy ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
                Disable 2FA
              </Button>
            ) : totpSetup ? (
              <div className="space-y-3 rounded-lg border border-border/70 p-3">
                <p className="text-[0.75rem] leading-relaxed text-muted-foreground">
                  Add this setup key to your authenticator as a manual entry, then confirm
                  with the 6-digit code it produces.
                </p>
                <div className="rounded-md bg-muted px-3 py-2 font-mono text-[0.75rem] break-all">
                  {totpSetup.secret}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    confirmTotp();
                  }}
                >
                  <Input
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="font-mono tracking-[0.25em]"
                    aria-label="Authentication code"
                  />
                  <Button type="submit" size="sm" disabled={totpBusy || totpCode.length < 6} className="shrink-0">
                    {totpBusy ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Confirm
                  </Button>
                </form>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={startTotp} disabled={totpBusy}>
                {totpBusy ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
                Enable 2FA
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-start gap-3 py-1">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[0.8125rem] font-medium">{title}</div>
        <p className="mt-0.5 text-[0.75rem] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="pt-1">{children}</div>
    </div>
  );
}

export { Label };
