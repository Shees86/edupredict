import * as React from "react";
import {
  Activity,
  BarChart3,
  FlaskConical,
  GitCompareArrows,
  LineChart as LineIcon,
  Target,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  compareCohorts,
  getCorrelations,
  getModelMetrics,
  getSummary,
  listStudents,
} from "@/lib/resources";
import { useAsync } from "@/lib/use-async";
import { formatNumber, formatPercent, prettifyFeature } from "@/lib/format";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { StatCard, StatGrid } from "@/components/stat-card";
import { ChartCard, ChartFrame, ChartTooltip, axisTick, gridProps } from "@/components/chart";
import { AlertsPanel } from "@/features/dashboard/AlertsPanel";
import { EmptyState, ErrorState, LoadingBlock, LoadingCards, LoadingChart } from "@/components/states";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------------------------------------------------------ */
/* Analyst overview                                                    */
/* ------------------------------------------------------------------ */

export function AnalystOverview({ onNavigate }) {
  const summary = useAsync(getSummary);
  const correlations = useAsync(getCorrelations);

  const loading = summary.loading || correlations.loading;

  if (summary.status === "error") {
    return (
      <div className="space-y-5">
        <AnalystHeader />
        <ErrorState message={summary.error} onRetry={summary.refresh} />
      </div>
    );
  }

  const s = summary.data;
  const correlationRows = Object.entries(correlations.data || {})
    .map(([feature, value]) => ({ feature: prettifyFeature(feature), value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div className="space-y-5">
      <AnalystHeader />

      {loading || !s ? (
        <LoadingCards />
      ) : (
        <StatGrid>
          <StatCard label="Cohort size" value={formatNumber(s.total_students)} icon={Users} hint="Records under analysis" />
          <StatCard
            label="High-risk rate"
            value={formatPercent(s.total_students ? s.high_risk_count / s.total_students : 0, 1)}
            tone={s.high_risk_count / Math.max(s.total_students, 1) > 0.25 ? "risk" : "safe"}
            icon={Target}
          />
          <StatCard label="Avg attendance" value={`${formatNumber(s.avg_attendance, 1)}%`} icon={Activity} />
          <StatCard label="Avg test score" value={formatNumber(s.avg_score, 1)} icon={BarChart3} />
        </StatGrid>
      )}

      <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <ChartCard
          title="Feature correlation with dropout risk"
          description="Pearson correlation across the live cohort"
          actions={
            <Button variant="ghost" size="sm" onClick={() => onNavigate?.("model")}>
              Model lab
            </Button>
          }
        >
          {correlations.loading ? (
            <LoadingChart height={270} />
          ) : correlationRows.length > 0 ? (
            <ChartFrame height={272}>
              <BarChart data={correlationRows} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" horizontal={false} />
                <XAxis type="number" domain={[-1, 1]} tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={132}
                  tick={{ ...axisTick, fontSize: 10.5, fontFamily: "var(--font-sans)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip formatter={(value) => formatNumber(value, 3)} />
                <Bar dataKey="value" name="Correlation" radius={[0, 3, 3, 0]} maxBarSize={16}>
                  {correlationRows.map((entry) => (
                    <Cell key={entry.feature} fill={entry.value < 0 ? "var(--chart-2)" : "var(--chart-3)"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          ) : (
            <EmptyState
              title="Not enough live data"
              description="Correlations appear once at least two student records are present."
              className="py-10"
            />
          )}
          <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-foreground">
            Negative values mean higher values of that feature are associated with lower dropout
            risk. Attendance and test score dominate, consistent with the anomalies flagged in the
            Spark pipeline.
          </p>
        </ChartCard>

        <AlertsPanel />
      </div>

      <CohortSummary summary={s} onOpen={() => onNavigate?.("cohorts")} />
    </div>
  );
}

function AnalystHeader() {
  return (
    <PageHeader
      eyebrow="Analysis"
      title="Cohort intelligence"
      description="Correlation structure, risk mix and the live alert stream — the analyst's daily read."
    />
  );
}

function CohortSummary({ summary, onOpen }) {
  const buckets = [
    { bucket: "<40", count: summary.attendance_under_40, fill: "var(--chart-3)" },
    { bucket: "40–60", count: summary.attendance_40_60, fill: "var(--chart-5)" },
    { bucket: "60–80", count: summary.attendance_60_80, fill: "var(--chart-1)" },
    { bucket: "80–100", count: summary.attendance_80_plus, fill: "var(--chart-2)" },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Attendance bands" description="Students by attendance percentage" actions={<Button variant="ghost" size="sm" onClick={onOpen}>Compare cohorts</Button>}>
        {summary.total_students > 0 ? (
          <ChartFrame height={210}>
            <BarChart data={buckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="bucket" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <ChartTooltip formatter={(value) => `${value} students`} />
              <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {buckets.map((b) => (
                  <Cell key={b.bucket} fill={b.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        ) : (
          <EmptyState title="No attendance data yet" className="py-10" />
        )}
      </ChartCard>

      <Card>
        <CardHeader className="pb-3">
          <SectionHeader title="Risk mix" description="Share of the live cohort by stored flag" actions={<LineIcon className="size-3.5 text-muted-foreground" />} />
        </CardHeader>
        <CardContent className="pt-0">
          <RiskMix safeCount={summary.safe_count} highRiskCount={summary.high_risk_count} />
        </CardContent>
      </Card>
    </div>
  );
}

function RiskMix({ safeCount, highRiskCount }) {
  const total = safeCount + highRiskCount;
  if (total === 0) {
    return <EmptyState title="No students to summarize" className="py-10" />;
  }
  const data = [
    { name: "On track", value: safeCount, fill: "var(--chart-2)" },
    { name: "High risk", value: highRiskCount, fill: "var(--chart-3)" },
  ];
  return (
    <div className="flex items-center gap-6">
      <ChartFrame height={160} className="max-w-[160px]">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={44} outerRadius={66} paddingAngle={2} strokeWidth={0}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip />
        </PieChart>
      </ChartFrame>
      <div className="space-y-3">
        {data.map((entry) => (
          <div key={entry.name}>
            <div className="flex items-center gap-2 text-[0.75rem] text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: entry.fill }} />
              {entry.name}
            </div>
            <div className="mt-0.5 font-mono text-[1.125rem] tnum">
              {formatNumber(entry.value)}
              <span className="ml-1 text-[0.75rem] text-muted-foreground">
                ({formatPercent(entry.value / total, 0)})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Model lab                                                           */
/* ------------------------------------------------------------------ */

export function AnalystModel() {
  const metrics = useAsync(getModelMetrics);
  const students = useAsync(() => listStudents());

  if (metrics.status === "error") {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Analysis" title="Model lab" description="Quality metrics, feature importance and cohort characteristics." />
        <ErrorState message={metrics.error} onRetry={metrics.refresh} />
      </div>
    );
  }

  if (metrics.loading || !metrics.data) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Analysis" title="Model lab" />
        <LoadingCards />
        <LoadingChart height={280} />
      </div>
    );
  }

  const m = metrics.data;
  const importance = Object.entries(m.feature_importance || {})
    .map(([feature, value]) => ({ feature: prettifyFeature(feature), value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analysis"
        title="Model lab"
        description={`Dropout classifier${m.model_type ? ` · ${m.model_type}` : ""}${m.trained_at ? ` · trained ${m.trained_at}` : ""}`}
        actions={
          <Badge variant="safe" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-safe" />
            Production
          </Badge>
        }
      />

      <StatGrid>
        <StatCard label="Accuracy" value={formatPercent(m.accuracy, 1)} icon={Target} hint="All predictions" />
        <StatCard label="Precision" value={formatPercent(m.precision, 1)} icon={FlaskConical} hint="Of flagged, how many were right" />
        <StatCard label="Recall" value={formatPercent(m.recall, 1)} icon={Activity} hint="Of at-risk, how many were caught" />
        <StatCard label="F1 score" value={formatPercent(m.f1_score, 1)} icon={BarChart3} hint="Precision / recall balance" />
      </StatGrid>

      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <ChartCard title="Feature importance" description="Relative contribution to the model's decisions">
          {importance.length > 0 ? (
            <ChartFrame height={300}>
              <BarChart data={importance} layout="vertical" margin={{ top: 4, right: 40, left: 24, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={132}
                  tick={{ ...axisTick, fontSize: 10.5, fontFamily: "var(--font-sans)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip formatter={(value) => formatNumber(value, 3)} />
                <Bar dataKey="value" name="Importance" fill="var(--chart-1)" radius={[0, 3, 3, 0]} maxBarSize={16}>
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(value) => formatNumber(value, 2)}
                    style={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  />
                </Bar>
              </BarChart>
            </ChartFrame>
          ) : (
            <EmptyState title="No feature-importance data" className="py-10" />
          )}
        </ChartCard>

        <Card>
          <CardHeader className="pb-3">
            <SectionHeader title="Metric detail" description="Full evaluation output from the training run" />
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="divide-y divide-border/50">
              {[
                ["Accuracy", formatPercent(m.accuracy, 2)],
                ["Precision", formatPercent(m.precision, 2)],
                ["Recall", formatPercent(m.recall, 2)],
                ["F1 score", formatPercent(m.f1_score, 2)],
                ["ROC AUC", m.roc_auc != null ? formatPercent(m.roc_auc, 2) : "—"],
                ["Training samples", m.train_size != null ? formatNumber(m.train_size) : "—"],
                ["Test samples", m.test_size != null ? formatNumber(m.test_size) : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-2.5 text-[0.8125rem]">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono tnum">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[0.75rem] leading-relaxed text-muted-foreground">
              Recall is prioritized: missing an at-risk student is costlier than a false alarm,
              since every flag routes to a human review.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <SectionHeader title="Cohort snapshot" description="What the model is scoring" actions={<Users className="size-3.5 text-muted-foreground" />} />
        </CardHeader>
        <CardContent className="p-0">
          <CohortTable students={students.data || []} />
        </CardContent>
      </Card>
    </div>
  );
}

function CohortTable({ students }) {
  if (students.length === 0) {
    return <EmptyState title="No records" description="Ingest student data to populate this table." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Feature</TableHead>
          <TableHead className="text-right">Mean</TableHead>
          <TableHead className="text-right">Min</TableHead>
          <TableHead className="text-right">Max</TableHead>
          <TableHead className="hidden sm:table-cell text-right">Std. deviation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          "attendance_rate",
          "avg_test_score",
          "assignments_submitted_pct",
          "study_hours_per_week",
          "previous_semester_gpa",
          "lms_login_frequency_per_week",
        ].map((feature) => {
          const values = students
            .map((s) => Number(s[feature]))
            .filter((v) => !Number.isNaN(v));
          if (values.length === 0) return null;
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
          return (
            <TableRow key={feature}>
              <TableCell className="font-medium">{prettifyFeature(feature)}</TableCell>
              <TableCell className="text-right font-mono tnum">{formatNumber(mean, 2)}</TableCell>
              <TableCell className="text-right font-mono tnum text-muted-foreground">{formatNumber(Math.min(...values), 2)}</TableCell>
              <TableCell className="text-right font-mono tnum text-muted-foreground">{formatNumber(Math.max(...values), 2)}</TableCell>
              <TableCell className="hidden sm:table-cell text-right font-mono tnum text-muted-foreground">
                {formatNumber(Math.sqrt(variance), 2)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/* ------------------------------------------------------------------ */
/* Cohort comparison                                                   */
/* ------------------------------------------------------------------ */

export function AnalystCohorts() {
  const [groupA, setGroupA] = React.useState("high");
  const [groupB, setGroupB] = React.useState("safe");
  const [comparison, setComparison] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const run = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await compareCohorts({ groupARisk: groupA, groupBRisk: groupB });
      setComparison(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupA, groupB]);

  React.useEffect(() => {
    run();
  }, [run]);

  const rows = comparison
    ? [
        { label: "Students", key: "count", format: (v) => formatNumber(v) },
        { label: "Avg attendance", key: "avg_attendance", format: (v) => `${formatNumber(v, 1)}%` },
        { label: "Avg test score", key: "avg_score", format: (v) => formatNumber(v, 1) },
        { label: "Avg GPA", key: "avg_gpa", format: (v) => formatNumber(v, 2) },
        { label: "High-risk share", key: "high_risk_pct", format: (v) => `${formatNumber(v, 1)}%` },
      ]
    : [];

  const chartData = comparison
    ? [
        {
          metric: "Attendance",
          A: Number(comparison.group_a.avg_attendance) || 0,
          B: Number(comparison.group_b.avg_attendance) || 0,
        },
        {
          metric: "Test score",
          A: Number(comparison.group_a.avg_score) || 0,
          B: Number(comparison.group_b.avg_score) || 0,
        },
        {
          metric: "High-risk %",
          A: Number(comparison.group_a.high_risk_pct) || 0,
          B: Number(comparison.group_b.high_risk_pct) || 0,
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analysis"
        title="Cohort comparison"
        description="Hold two risk groups side by side and see where their distributions actually diverge."
      />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-end">
          <GroupSelect label="Group A" value={groupA} onChange={setGroupA} />
          <GroupSelect label="Group B" value={groupB} onChange={setGroupB} />
          <Button onClick={run} disabled={loading} className="sm:ml-auto">
            {loading ? "Comparing…" : "Compare"}
          </Button>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} onRetry={run} /> : null}

      {comparison ? (
        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <SectionHeader title="Group statistics" description="Aggregated live figures for each cohort" />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-chart-3" />
                        Group A
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-chart-2" />
                        Group B
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="text-muted-foreground">{row.label}</TableCell>
                      <TableCell className="text-right font-mono tnum">
                        {comparison.group_a[row.key] != null ? row.format(comparison.group_a[row.key]) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono tnum">
                        {comparison.group_b[row.key] != null ? row.format(comparison.group_b[row.key]) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <ChartCard title="Side by side" description="Attendance, score and high-risk share">
            <ChartFrame height={250}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="metric" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <ChartTooltip formatter={(value) => formatNumber(value, 1)} />
                <Bar dataKey="A" name="Group A" fill="var(--chart-3)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="B" name="Group B" fill="var(--chart-2)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ChartFrame>
            <div className="mt-2 flex items-center gap-4 text-[0.6875rem] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-3" />Group A</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2" />Group B</span>
            </div>
          </ChartCard>
        </div>
      ) : (
        <Card className="p-4">
          {loading ? <LoadingBlock label="Building comparison…" /> : null}
        </Card>
      )}
    </div>
  );
}

function GroupSelect({ label, value, onChange }) {
  return (
    <div className="space-y-1.5 sm:w-52">
      <span className="text-[0.75rem] font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="high">High-risk students</SelectItem>
          <SelectItem value="safe">On-track students</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export { GitCompareArrows };
