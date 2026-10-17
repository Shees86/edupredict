import * as React from "react";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import {
  CartesianGrid,
  Bar,
  BarChart,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { listStudents, predictRisk } from "@/lib/resources";
import { useAsync } from "@/lib/use-async";
import { formatNumber } from "@/lib/format";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { StatCard, StatGrid } from "@/components/stat-card";
import { RiskBadge, ProbabilityMeter } from "@/components/risk-badge";
import { ChartFrame, ChartTooltip, axisTick, gridProps } from "@/components/chart";
import { EmptyState, ErrorState } from "@/components/states";
import { ExportButton, SearchField } from "@/components/data-tools";
import { CsvUpload } from "@/features/dashboard/CsvUpload";
import { PredictorSuite } from "@/features/dashboard/PredictorSuite";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TeacherRoster() {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [selected, setSelected] = React.useState(null);
  const [predicting, setPredicting] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [predictError, setPredictError] = React.useState("");

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const students = useAsync(() => listStudents(debounced), [debounced]);
  const rows = students.data || [];

  async function runPrediction(student) {
    setSelected(student);
    setPredicting(student.student_id);
    setResult(null);
    setPredictError("");
    try {
      const response = await predictRisk(student);
      setResult(response);
      toast.success(`${student.student_id}: ${response.risk_label}`);
    } catch (err) {
      setPredictError(err.message || "Prediction failed.");
    } finally {
      setPredicting(null);
    }
  }

  const highRisk = rows.filter((s) => s.dropout_risk === 1).length;
  const avgAttendance = rows.length
    ? rows.reduce((sum, s) => sum + (Number(s.attendance_rate) || 0), 0) / rows.length
    : 0;
  const avgScore = rows.length
    ? rows.reduce((sum, s) => sum + (Number(s.avg_test_score) || 0), 0) / rows.length
    : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Teaching"
        title="Class roster"
        description="Run the dropout-risk model on any student and see their live metrics side by side."
        actions={<ExportButton data={rows} filename="class-roster.csv" />}
      />

      <StatGrid>
        <StatCard label="Students" value={formatNumber(rows.length)} icon={ClipboardList} hint={debounced ? `Matching “${debounced}”` : "In this cohort"} />
        <StatCard label="Flagged high risk" value={formatNumber(highRisk)} icon={Target} tone={highRisk > 0 ? "risk" : "safe"} hint="From stored records" />
        <StatCard label="Avg attendance" value={`${formatNumber(avgAttendance, 1)}%`} icon={BookOpen} tone={avgAttendance >= 75 ? "safe" : "risk"} />
        <StatCard label="Avg test score" value={formatNumber(avgScore, 1)} icon={GraduationCap} />
      </StatGrid>

      <CsvUpload onUploaded={students.refresh} />

      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeader title="Students" />
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
                title={debounced ? "No matching students" : "No students yet"}
                description={
                  debounced
                    ? `Nothing matched “${debounced}”.`
                    : "Upload a CSV above, or ask students to register their own accounts."
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden sm:table-cell">Attendance</TableHead>
                    <TableHead className="hidden sm:table-cell">Score</TableHead>
                    <TableHead className="hidden md:table-cell">GPA</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((student) => {
                    const isSelected = selected?.student_id === student.student_id;
                    return (
                      <TableRow
                        key={student.student_id}
                        data-selected={isSelected || undefined}
                        className={isSelected ? "bg-accent/50" : undefined}
                      >
                        <TableCell>
                          <div className="font-mono text-[0.8125rem]">{student.student_id}</div>
                          <div className="max-w-[11rem] truncate text-[0.6875rem] text-muted-foreground">
                            {student.full_name || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono tnum text-muted-foreground">
                          {student.attendance_rate != null ? `${formatNumber(student.attendance_rate, 1)}%` : "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono tnum text-muted-foreground">
                          {student.avg_test_score != null ? formatNumber(student.avg_test_score, 1) : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono tnum text-muted-foreground">
                          {student.previous_semester_gpa != null ? formatNumber(student.previous_semester_gpa, 2) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runPrediction(student)}
                            disabled={predicting === student.student_id}
                          >
                            {predicting === student.student_id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="size-3.5" />
                            )}
                            Predict
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <PredictionPanel
          student={selected}
          result={result}
          error={predictError}
          predicting={Boolean(predicting)}
        />
      </div>

      <Card className="mt-2">
        <CardHeader className="pb-2">
          <SectionHeader
            title="Pathway predictors"
            description="Field, university and CGPA-trend models — useful in one-to-one guidance sessions"
          />
        </CardHeader>
        <CardContent className="pt-2">
          <PredictorSuite />
        </CardContent>
      </Card>
    </div>
  );
}

function PredictionPanel({ student, result, error, predicting }) {
  const chartData = result
    ? [
        { label: "Probability", value: Math.round(result.risk_probability * 100), fill: "var(--chart-3)" },
        { label: "Confidence", value: Math.round((1 - result.risk_probability) * 100), fill: "var(--chart-2)" },
      ]
    : [];

  return (
    <Card className="xl:sticky xl:top-20 xl:self-start">
      <CardHeader className="pb-3">
        <SectionHeader
          title="Prediction"
          description={student ? student.student_id : "Nothing selected"}
          actions={
            result ? (
              <Badge variant="outline" className="font-mono tnum">
                {(result.risk_probability * 100).toFixed(1)}%
              </Badge>
            ) : null
          }
        />
      </CardHeader>
      <CardContent className="pt-0">
        {predicting ? (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-[0.8125rem]">Scoring {student?.student_id}…</span>
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : !result ? (
          <EmptyState
            icon={Sparkles}
            title="Pick a student"
            description="Select “Predict” on any row to run the trained dropout-risk model against their current metrics."
            className="py-10"
          />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[1.25rem] leading-none">{result.student_id}</div>
                <div className="mt-1.5 text-[0.75rem] text-muted-foreground">
                  Model verdict
                </div>
              </div>
              <RiskBadge risk={result.risk_label} />
            </div>

            <ProbabilityMeter value={result.risk_probability} />

            <ChartFrame height={168}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} />
                <ChartTooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="value" name="Percent" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.label} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>

            <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-[0.75rem] leading-relaxed text-muted-foreground">
              High-risk verdicts also raise a live alert for admins and analysts, and email anyone
              who has opted in to risk notifications.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TeacherPredictors() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Teaching"
        title="Pathway predictors"
        description="Estimate likely fields, universities and next-semester GPA from a student's current numbers."
      />
      <Card>
        <CardContent className="pt-5">
          <PredictorSuite />
        </CardContent>
      </Card>
    </div>
  );
}
