import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Ban,
  Check,
  Download,
  FileClock,
  ServerCog,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  decidePendingUser,
  getSystemStats,
  getSummary,
  listAuditLog,
  listPendingUsers,
  listStudents,
} from "@/lib/resources";
import { useAsync } from "@/lib/use-async";
import { formatDateTime, formatNumber } from "@/lib/format";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { StatCard, StatGrid } from "@/components/stat-card";
import { RiskBadge } from "@/components/risk-badge";
import { ChartCard, ChartFrame, ChartTooltip, axisTick, gridProps } from "@/components/chart";
import { EmptyState, ErrorState, LoadingBlock, LoadingCards, LoadingChart } from "@/components/states";
import { ExportButton, SearchField } from "@/components/data-tools";
import { CsvUpload } from "@/features/dashboard/CsvUpload";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

export function AdminOverview({ onNavigate }) {
  const summary = useAsync(getSummary);
  const students = useAsync(() => listStudents());

  if (summary.status === "error") {
    return (
      <div className="space-y-6">
        <Header />
        <ErrorState message={summary.error} onRetry={summary.refresh} />
      </div>
    );
  }

  if (summary.loading || !summary.data) {
    return (
      <div className="space-y-6">
        <Header />
        <LoadingCards />
        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
          <LoadingChart />
          <LoadingChart />
        </div>
      </div>
    );
  }

  const s = summary.data;
  const riskShare = s.total_students ? s.high_risk_count / s.total_students : 0;
  const donut = [
    { name: "On track", value: s.safe_count, fill: "var(--chart-2)" },
    { name: "High risk", value: s.high_risk_count, fill: "var(--chart-3)" },
  ];
  const attendanceBuckets = buildAttendanceBuckets(students.data || []);

  return (
    <div className="space-y-6">
      <Header />

      <StatGrid>
        <StatCard
          label="Total students"
          value={formatNumber(s.total_students)}
          icon={Users}
          hint="In the register"
        />
        <StatCard
          label="High risk"
          value={formatNumber(s.high_risk_count)}
          icon={AlertTriangle}
          tone="risk"
          trend={{ direction: riskShare > 0.25 ? "up" : "flat", label: `${Math.round(riskShare * 100)}% of cohort` }}
        />
        <StatCard
          label="Avg attendance"
          value={`${formatNumber(s.avg_attendance, 1)}%`}
          icon={Activity}
          hint={s.avg_attendance >= 75 ? "Above 75% threshold" : "Below 75% threshold"}
          tone={s.avg_attendance >= 75 ? "safe" : "risk"}
        />
        <StatCard
          label="Avg test score"
          value={formatNumber(s.avg_score, 1)}
          icon={ShieldCheck}
          hint="Across all records"
        />
      </StatGrid>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.25fr]">
        <ChartCard title="Risk distribution" description="Share of the register flagged high risk">
          {s.total_students > 0 ? (
            <div className="relative">
              <ChartFrame height={228}>
                <PieChart>
                  <Pie
                    data={donut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={64}
                    outerRadius={92}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {donut.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ChartFrame>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[1.5rem] leading-none font-medium tnum">
                  {Math.round(riskShare * 100)}%
                </span>
                <span className="mt-1 text-[0.6875rem] text-muted-foreground">high risk</span>
              </div>
            </div>
          ) : (
            <EmptyState title="No student records yet" description="Upload a roster to see the distribution." />
          )}
          <div className="mt-3 flex items-center justify-center gap-4 text-[0.75rem]">
            {donut.map((entry) => (
              <span key={entry.name} className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full" style={{ background: entry.fill }} />
                {entry.name}
                <span className="font-mono tnum text-foreground">{formatNumber(entry.value)}</span>
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Attendance distribution" description="Students grouped by attendance band">
          {attendanceBuckets.some((b) => b.count > 0) ? (
            <ChartFrame height={228}>
              <BarChart data={attendanceBuckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="bucket" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <ChartTooltip formatter={(value) => `${value} students`} />
                <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                  {attendanceBuckets.map((bucket, i) => (
                    <Cell key={bucket.bucket} fill={i === 0 ? "var(--chart-3)" : "var(--chart-1)"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          ) : (
            <EmptyState title="Nothing to chart yet" description="Attendance bands appear once students are ingested." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title="Recent students"
              description="Latest rows in the register"
              actions={
                <Button variant="ghost" size="sm" onClick={() => onNavigate?.("students")}>
                  Open register
                  <ArrowUpRight className="size-3.5" />
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="pt-0">
            {students.loading ? (
              <LoadingBlock label="Loading students…" />
            ) : (
              <ul className="divide-y divide-border/50">
                {(students.data || []).slice(0, 6).map((student) => (
                  <li key={student.student_id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="font-mono text-[0.8125rem]">{student.student_id}</div>
                      <div className="truncate text-[0.6875rem] text-muted-foreground">
                        {student.full_name || "No name on file"}
                      </div>
                    </div>
                    <RiskBadge risk={student.dropout_risk} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <SystemHealth compact />
      </div>
    </div>
  );
}

function Header() {
  return (
    <PageHeader
      eyebrow="Administration"
      title="System overview"
      description="Cohort health, risk distribution and platform activity at a glance."
    />
  );
}

/* ------------------------------------------------------------------ */
/* Student register                                                    */
/* ------------------------------------------------------------------ */

export function AdminRegister() {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(25);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const students = useAsync(() => listStudents(debounced), [debounced]);

  const rows = students.data || [];
  const visible = rows.slice(0, visibleCount);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Student register"
        description="Search, export or ingest the records that feed every model in the platform."
        actions={<ExportButton data={rows} filename="students.csv" />}
      />

      <CsvUpload onUploaded={students.refresh} />

      <Card className="overflow-hidden">
        <CardHeader className="gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SectionHeader title="Records" />
            {students.data ? (
              <Badge variant="outline" className="font-mono tnum">
                {formatNumber(rows.length)}
              </Badge>
            ) : null}
          </div>
          <SearchField value={search} onChange={setSearch} placeholder="Search ID or name…" />
        </CardHeader>
        <CardContent className="p-0">
          {students.status === "error" ? (
            <div className="p-4">
              <ErrorState message={students.error} onRetry={students.refresh} />
            </div>
          ) : students.loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title={debounced ? "No matching students" : "No students registered yet"}
              description={
                debounced
                  ? `Nothing matched “${debounced}”. Try a different ID or name.`
                  : "Upload a CSV or JSON file above to seed the register."
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Avg score</TableHead>
                    <TableHead className="hidden sm:table-cell">Assignments</TableHead>
                    <TableHead className="hidden md:table-cell">GPA</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell>
                        <div className="font-mono text-[0.8125rem]">{student.student_id}</div>
                        <div className="max-w-[12rem] truncate text-[0.6875rem] text-muted-foreground">
                          {student.full_name || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <MetricCell value={student.attendance_rate} suffix="%" threshold={75} max={100} />
                      </TableCell>
                      <TableCell>
                        <MetricCell value={student.avg_test_score} threshold={70} max={100} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono tnum text-muted-foreground">
                        {student.assignments_submitted_pct != null
                          ? `${formatNumber(student.assignments_submitted_pct, 0)}%`
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono tnum text-muted-foreground">
                        {student.previous_semester_gpa != null
                          ? formatNumber(student.previous_semester_gpa, 2)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={student.dropout_risk} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {rows.length > visible.length ? (
                <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
                  <span className="text-[0.75rem] text-muted-foreground">
                    Showing {visible.length} of {formatNumber(rows.length)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setVisibleCount((n) => n + 25)}>
                    Show more
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCell({ value, suffix = "", threshold, max = 100 }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const below = value < threshold;
  return (
    <div className="w-24">
      <div className="mb-1 font-mono text-[0.75rem] tnum" style={{ color: below ? "var(--risk)" : undefined }}>
        {formatNumber(value, 1)}
        {suffix}
      </div>
      <Progress
        value={Math.min(100, (value / max) * 100)}
        className="h-1"
        indicatorClassName={below ? "bg-risk" : "bg-safe"}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Governance: approvals, audit log, system health                     */
/* ------------------------------------------------------------------ */

export function AdminGovernance() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Governance"
        description="Approve pending accounts, review the audit trail and watch platform health."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <PendingApprovals />
        <AuditLog />
      </div>
      <SystemHealth />
    </div>
  );
}

function PendingApprovals() {
  const pending = useAsync(listPendingUsers);
  const [busy, setBusy] = React.useState(null);
  const [assignments, setAssignments] = React.useState({});

  function updateAssignment(username, field, value) {
    setAssignments((current) => ({
      ...current,
      [username]: { ...current[username], [field]: value },
    }));
  }

  async function decide(user, approve) {
    const assignment = assignments[user.username] || {};
    if (approve && user.role === "teacher" && (!assignment.school_id?.trim() || !assignment.class_id?.trim())) {
      toast.error("Assign the teacher to a school and class before approval.");
      return;
    }
    if (approve && user.role === "analyst" && !assignment.school_id?.trim()) {
      toast.error("Assign the analyst to a school before approval.");
      return;
    }

    const username = user.username;
    setBusy(username);
    try {
      await decidePendingUser(
        username,
        approve,
        user.role === "teacher" || user.role === "analyst" ? assignment : {}
      );
      toast.success(
        user.needs_scope_assignment
          ? `${username} scope assigned`
          : approve ? `${username} approved` : `${username} rejected`
      );
      pending.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  const rows = pending.data || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeader
          title="Pending approvals"
          description="Review signups and assign scopes to existing staff"
          actions={
            rows.length > 0 ? (
              <Badge variant="warn" className="font-mono tnum">
                {rows.length}
              </Badge>
            ) : null
          }
        />
      </CardHeader>
      <CardContent className="pt-0">
        {pending.loading ? <LoadingBlock label="Loading pending accounts…" /> : null}
        {pending.status === "error" ? <ErrorState message={pending.error} onRetry={pending.refresh} /> : null}
        {!pending.loading && pending.status !== "error" && rows.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No accounts waiting"
            description="New signups will appear here for review."
            className="py-8"
          />
        ) : null}
        {rows.length > 0 ? (
          <ul className="divide-y divide-border/50">
            {rows.map((user) => (
              <li key={user.username} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate font-mono text-[0.8125rem]">{user.username}</div>
                  <div className="truncate text-[0.6875rem] capitalize text-muted-foreground">
                    {user.role} · {user.full_name || "No name given"}
                    {user.needs_scope_assignment ? " · scope required" : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {user.role === "teacher" || user.role === "analyst" ? (
                    <Input
                      className="h-8 w-32 text-xs"
                      aria-label={`School ID for ${user.username}`}
                      placeholder="School ID"
                      value={assignments[user.username]?.school_id ?? user.school_id ?? ""}
                      onChange={(event) => updateAssignment(user.username, "school_id", event.target.value)}
                    />
                  ) : null}
                  {user.role === "teacher" ? (
                    <Input
                      className="h-8 w-32 text-xs"
                      aria-label={`Class ID for ${user.username}`}
                      placeholder="Class ID"
                      value={assignments[user.username]?.class_id ?? user.class_id ?? ""}
                      onChange={(event) => updateAssignment(user.username, "class_id", event.target.value)}
                    />
                  ) : null}
                  <div className="ml-auto flex shrink-0 gap-1.5">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="border-safe/40 text-safe hover:bg-safe/10 hover:text-safe"
                      onClick={() => decide(user, true)}
                      disabled={busy === user.username}
                      aria-label={`Approve ${user.username}`}
                    >
                      <Check className="size-3.5" />
                    </Button>
                    {!user.needs_scope_assignment ? (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="border-risk/40 text-risk hover:bg-risk/10 hover:text-risk"
                        onClick={() => decide(user, false)}
                        disabled={busy === user.username}
                        aria-label={`Reject ${user.username}`}
                      >
                        <X className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AuditLog() {
  const log = useAsync(listAuditLog);
  const rows = (log.data || []).slice(0, 12);

  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeader
          title="Audit log"
          description="Who did what, most recent first"
          actions={<FileClock className="size-3.5 text-muted-foreground" />}
        />
      </CardHeader>
      <CardContent className="max-h-[17.1rem] overflow-y-auto pt-0">
        {log.loading ? <LoadingBlock label="Loading audit log…" /> : null}
        {log.status === "error" ? <ErrorState message={log.error} onRetry={log.refresh} /> : null}
        {!log.loading && log.status !== "error" && rows.length === 0 ? (
          <EmptyState icon={FileClock} title="No activity recorded yet" className="py-8" />
        ) : null}
        {rows.length > 0 ? (
          <ul className="divide-y divide-border/50">
            {rows.map((entry, i) => (
              <li key={i} className="flex flex-col gap-0.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.6875rem] text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </span>
                  <span className="truncate text-[0.75rem]">
                    <span className="font-medium">{entry.actor_username}</span>
                    <span className="text-muted-foreground"> ({entry.actor_role})</span>
                  </span>
                </div>
                <div className="text-[0.75rem] text-muted-foreground">
                  {entry.action}
                  {entry.target ? ` → ${entry.target}` : ""}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SystemHealth({ compact = false }) {
  const stats = useAsync(getSystemStats);

  if (stats.status === "error" || (stats.loading && !stats.data)) {
    if (compact) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader title="System health" description="Live API telemetry" actions={<ServerCog className="size-3.5 text-muted-foreground" />} />
          </CardHeader>
          <CardContent className="pt-0">
            {stats.loading ? <LoadingBlock label="Loading telemetry…" /> : <ErrorState message={stats.error} onRetry={stats.refresh} />}
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="p-4">
        <ErrorState message={stats.error || "Telemetry unavailable."} onRetry={stats.refresh} />
      </Card>
    );
  }

  if (!stats.data) {
    return <LoadingCards />;
  }

  const s = stats.data;
  const uptime =
    s.uptime_seconds > 3600
      ? `${(s.uptime_seconds / 3600).toFixed(1)}h`
      : `${Math.round(s.uptime_seconds / 60)}m`;

  const items = [
    { label: "Uptime", value: uptime, icon: Activity },
    { label: "Requests", value: formatNumber(s.request_count), icon: ArrowUpRight },
    { label: "Avg response", value: `${formatNumber(s.avg_response_ms, 0)}ms`, icon: ServerCog },
    { label: "Errors", value: formatNumber(s.error_count), icon: Ban, tone: s.error_count > 0 ? "risk" : "safe" },
  ];

  const body = (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">{item.label}</div>
              <div
                className="font-mono text-[0.875rem] tnum"
                style={item.tone === "risk" ? { color: "var(--risk)" } : item.tone === "safe" ? { color: "var(--safe)" } : undefined}
              >
                {item.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            title="System health"
            description={s.unresolved_alerts != null ? `${s.unresolved_alerts} unresolved alerts · ${s.user_count ?? "—"} accounts` : "Live API telemetry"}
            actions={<ServerCog className="size-3.5 text-muted-foreground" />}
          />
        </CardHeader>
        <CardContent className="pt-0">{body}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeader title="System health" description="Rolling telemetry since the last restart" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0 sm:flex-row sm:items-center sm:justify-between">
        {body}
        <div className="flex gap-2 text-[0.75rem] text-muted-foreground sm:flex-col sm:text-right">
          <span>{formatNumber(s.student_count ?? 0)} students</span>
          <span>{formatNumber(s.user_count ?? 0)} accounts</span>
          <span>{formatNumber(s.unresolved_alerts ?? 0)} open alerts</span>
        </div>
      </CardContent>
    </Card>
  );
}

function buildAttendanceBuckets(students) {
  const buckets = [
    { bucket: "<40%", count: 0, min: -Infinity, max: 40 },
    { bucket: "40–60%", count: 0, min: 40, max: 60 },
    { bucket: "60–80%", count: 0, min: 60, max: 80 },
    { bucket: "80–100%", count: 0, min: 80, max: Infinity },
  ];
  students.forEach((student) => {
    const value = Number(student.attendance_rate);
    if (Number.isNaN(value)) return;
    const bucket = buckets.find((b) => value >= b.min && value < b.max);
    if (bucket) bucket.count += 1;
  });
  return buckets.map(({ bucket, count }) => ({ bucket, count }));
}

export { Download };
