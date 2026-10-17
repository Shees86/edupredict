import * as React from "react";
import {
  Award,
  CalendarCheck,
  Compass,
  Flame,
  GraduationCap,
  Info,
  Loader2,
  Medal,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { getBadges, getGoal, getStudent, setGoal } from "@/lib/resources";
import { useAsync } from "@/lib/use-async";
import { formatNumber } from "@/lib/format";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { StatCard, StatGrid } from "@/components/stat-card";
import { RiskBadge } from "@/components/risk-badge";
import { ChartFrame, ChartTooltip, axisTick, gridProps } from "@/components/chart";
import { EmptyState, ErrorState, LoadingBlock, LoadingChart } from "@/components/states";
import { PredictorSuite } from "@/features/dashboard/PredictorSuite";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GOAL_META = {
  attendance: { label: "Attendance", unit: "%", max: 100, field: "attendance_rate" },
  gpa: { label: "GPA", unit: "", max: 4, field: "previous_semester_gpa" },
  test_score: { label: "Avg test score", unit: "", max: 100, field: "avg_test_score" },
};

export function StudentOverview({ user }) {
  const record = useAsync(() => getStudent(user.username), [user.username]);

  if (record.status === "error") {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Student portal" title="My academic standing" />
        <ErrorState message={record.error} onRetry={record.refresh} />
      </div>
    );
  }

  if (record.loading || !record.data) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Student portal" title="My academic standing" description="Loading your record…" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-border/70 bg-card" />
          ))}
        </div>
        <LoadingChart height={200} />
      </div>
    );
  }

  const r = record.data;
  const highRisk = r.dropout_risk === 1;
  const metrics = [
    { label: "Attendance", value: r.attendance_rate ?? 0, target: 85, max: 100, unit: "%" },
    { label: "Test score", value: r.avg_test_score ?? 0, target: 70, max: 100, unit: "" },
    { label: "Assignments", value: r.assignments_submitted_pct ?? 0, target: 90, max: 100, unit: "%" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Student portal"
        title={`Hello, ${firstName(r.full_name || user.full_name || user.username)}.`}
        description="Your standing, the metrics driving it, and where the model sees you heading."
        actions={<RiskBadge risk={r.dropout_risk} />}
      />

      <div
        className="flex items-start gap-3 rounded-xl border p-4"
        style={{
          borderColor: highRisk ? "color-mix(in oklch, var(--risk) 30%, transparent)" : "color-mix(in oklch, var(--safe) 30%, transparent)",
          background: highRisk ? "var(--risk-soft)" : "var(--safe-soft)",
        }}
      >
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-background/40">
          {highRisk ? <Flame className="size-4 text-risk" /> : <TrendingUp className="size-4 text-safe" />}
        </div>
        <div>
          <div className="text-[0.8125rem] font-semibold" style={{ color: highRisk ? "var(--risk)" : "var(--safe)" }}>
            {highRisk ? "A few metrics need attention" : "You're tracking well"}
          </div>
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {highRisk
              ? "Your attendance, scores or engagement are below the cohort's healthy band. Look at the metrics below and reach out to your advisor — this is an early-warning signal, not a verdict."
              : "Attendance, test scores and assignment completion are all in a healthy range. Keep the routine that got you here."}
          </p>
        </div>
      </div>

      <StatGrid className="lg:grid-cols-4">
        <StatCard
          label="Attendance"
          value={`${formatNumber(r.attendance_rate ?? 0, 1)}%`}
          tone={(r.attendance_rate ?? 0) >= 85 ? "safe" : "risk"}
          hint="Target 85%"
          icon={CalendarCheck}
        />
        <StatCard
          label="Avg score"
          value={formatNumber(r.avg_test_score ?? 0, 1)}
          tone={(r.avg_test_score ?? 0) >= 70 ? "safe" : "risk"}
          hint="Target 70"
        />
        <StatCard
          label="GPA"
          value={formatNumber(r.previous_semester_gpa ?? 0, 2)}
          hint="Previous semester"
          icon={GraduationCap}
        />
        <StatCard
          label="LMS logins"
          value={`${formatNumber(r.lms_login_frequency_per_week ?? 0, 0)}/wk`}
          hint={`${formatNumber(r.study_hours_per_week ?? 0, 0)} h study per week`}
        />
      </StatGrid>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader title="Key metrics" description="Your values against healthy-cohort targets" />
          </CardHeader>
          <CardContent className="pt-0">
            <ChartFrame height={214}>
              <BarChart
                data={metrics.map((m) => ({ ...m, target: m.target }))}
                margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
              >
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} />
                <ChartTooltip
                  formatter={(value, entry) => `${formatNumber(value, 1)}${entry?.payload?.unit ?? ""}`}
                />
                <Bar dataKey="value" name="You" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {metrics.map((m) => (
                    <Cell key={m.label} fill={m.value >= m.target ? "var(--chart-2)" : "var(--chart-3)"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.6875rem] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-2" /> At or above target
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-3" /> Below target
              </span>
              <span>Extracurricular: {r.extracurricular ?? "No"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <SectionHeader title="How this is calculated" actions={<Info className="size-3.5 text-muted-foreground" />} />
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
              Your estimate comes from attendance rate, recent test scores, assignment
              completion and LMS engagement, compared against patterns across the student
              population. It's a signal for early support — not a fixed outcome.
            </p>
            <div className="space-y-3 rounded-lg border border-border/70 p-3">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="mb-1 flex items-baseline justify-between text-[0.75rem]">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-mono tnum">
                      {formatNumber(m.value, m.unit ? 1 : 0)}
                      {m.unit}
                      <span className="text-muted-foreground"> / {m.target}{m.unit}</span>
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (m.value / m.max) * 100)}
                    indicatorClassName={m.value >= m.target ? "bg-safe" : "bg-risk"}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function StudentGoals({ user }) {
  const goalState = useAsync(() => getGoal(user.username), [user.username]);
  const badgeState = useAsync(() => getBadges(user.username), [user.username]);
  const recordState = useAsync(() => getStudent(user.username), [user.username]);

  const record = recordState.data;
  const [goalType, setGoalType] = React.useState("attendance");
  const [targetValue, setTargetValue] = React.useState("80");
  const [saving, setSaving] = React.useState(false);

  const goal = goalState.data;
  const goalMeta = goal ? GOAL_META[goal.goal_type] : GOAL_META[goalType];
  const current = goal ? record?.[goalMeta.field] : null;
  const progress = goal && Number(goal.target_value) > 0
    ? Math.min(100, ((Number(current) || 0) / Number(goal.target_value)) * 100)
    : 0;

  async function save() {
    setSaving(true);
    try {
      await setGoal(goalType, targetValue);
      toast.success("Goal updated");
      goalState.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const badges = badgeState.data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Student portal"
        title="Goals & achievements"
        description="Set a target for the term, then let your metrics — and the badges they unlock — do the tracking."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title="My goal"
              description="One target at a time — pick the metric that matters most"
              actions={<Target className="size-3.5 text-muted-foreground" />}
            />
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {goalState.loading ? <LoadingBlock label="Loading goal…" /> : null}
            {goal ? (
              <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.75rem] text-muted-foreground">{GOAL_META[goal.goal_type]?.label}</span>
                  <Badge variant="accent" className="font-mono tnum">
                    {Math.round(progress)}%
                  </Badge>
                </div>
                <div className="mt-1.5 font-mono text-[1.5rem] leading-none tnum">
                  {formatNumber(current ?? 0, 1)}
                  <span className="text-[0.8125rem] text-muted-foreground">
                    {" "}/ {formatNumber(goal.target_value, 0)} target
                  </span>
                </div>
                <Progress value={progress} className="mt-3" indicatorClassName={progress >= 100 ? "bg-safe" : "bg-primary"} />
              </div>
            ) : (
              <p className="text-[0.8125rem] text-muted-foreground">
                No goal set yet — choose a metric and target below.
              </p>
            )}

            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-36 flex-1 space-y-1.5">
                <span className="text-[0.75rem] text-muted-foreground">Metric</span>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendance">Attendance %</SelectItem>
                    <SelectItem value="gpa">GPA</SelectItem>
                    <SelectItem value="test_score">Avg test score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24 space-y-1.5">
                <span className="text-[0.75rem] text-muted-foreground">Target</span>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  step={goalType === "gpa" ? 0.1 : 1}
                  min={0}
                  max={GOAL_META[goalType].max}
                  className="font-mono"
                />
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Set goal
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title="Achievements"
              description="Earned automatically from your record"
              actions={<Award className="size-3.5 text-muted-foreground" />}
            />
          </CardHeader>
          <CardContent className="pt-0">
            {badgeState.loading ? <LoadingBlock label="Loading badges…" /> : null}
            {!badgeState.loading && badges.length === 0 ? (
              <EmptyState
                icon={Medal}
                title="No badges yet"
                description="Attend consistently, keep assignments current and lift your scores — badges unlock as your record improves."
                className="py-8"
              />
            ) : null}
            {badges.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {badges.map((badge) => (
                  <li key={badge.id} className="flex items-start gap-2.5 rounded-lg border border-border/70 p-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12">
                      <Medal className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.8125rem] font-medium">{badge.name}</div>
                      <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
                        {badge.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function StudentPredictors() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Student portal"
        title="Pathway tools"
        description="Explore where your marks point — field, college tier, university tier and next-semester GPA."
        actions={<Compass className="size-4 text-muted-foreground" />}
      />
      <Card>
        <CardContent className="pt-5">
          <PredictorSuite />
        </CardContent>
      </Card>
    </div>
  );
}

function firstName(value) {
  return String(value || "").trim().split(/\s+/)[0] || "there";
}
