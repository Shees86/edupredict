import * as React from "react";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Loader2,
  Pencil,
  Sparkles,
  Target,
  Trash2,
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
import { deleteStudent, listStudents, predictRisk, saveStudent } from "@/lib/resources";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STUDENT_EDIT_FIELDS = [
  { name: "full_name", label: "Full name" },
  { name: "age", label: "Age", numeric: true },
  { name: "gender", label: "Gender" },
  { name: "attendance_rate", label: "Attendance rate", numeric: true },
  { name: "avg_test_score", label: "Average test score", numeric: true },
  { name: "assignments_submitted_pct", label: "Assignments submitted (%)", numeric: true },
  { name: "family_income_level", label: "Family income level" },
  { name: "parental_education", label: "Parental education" },
  { name: "study_hours_per_week", label: "Study hours per week", numeric: true },
  { name: "extracurricular", label: "Extracurricular" },
  { name: "previous_semester_gpa", label: "Previous semester GPA", numeric: true },
  { name: "lms_login_frequency_per_week", label: "LMS logins per week", numeric: true },
];

export function TeacherRoster() {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState(null);
  const [predicting, setPredicting] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [predictError, setPredictError] = React.useState("");
  const [missingFields, setMissingFields] = React.useState([]);
  const [predictionInputs, setPredictionInputs] = React.useState({ age: "", gender: "" });
  const [editingStudent, setEditingStudent] = React.useState(null);
  const [editForm, setEditForm] = React.useState({});
  const [savingStudent, setSavingStudent] = React.useState(false);
  const [deletingStudent, setDeletingStudent] = React.useState(null);
  const [deletePending, setDeletePending] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const students = useAsync(() => listStudents(debounced), [debounced]);
  const rows = students.data || [];
  const pageSize = 25;
  const pageCount = Math.ceil(rows.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function selectStudentForPrediction(student) {
    setSelected(student);
    setResult(null);
    setPredictError("");
    const missing = ["age", "gender"].filter(
      (field) => student[field] == null || String(student[field]).trim() === ""
    );
    setMissingFields(missing);
    setPredictionInputs({ age: "", gender: "" });
    if (missing.length === 0) {
      runPrediction(student);
    }
  }

  async function runPrediction(student, overrides = {}) {
    setPredicting(student.student_id);
    setResult(null);
    setPredictError("");
    setMissingFields([]);
    try {
      const response = await predictRisk(student, overrides);
      setResult(response);
      toast.success(`${student.student_id}: ${response.risk_label}`);
    } catch (err) {
      setPredictError(err.message || "Prediction failed.");
    } finally {
      setPredicting(null);
    }
  }

  function openStudentEditor(student) {
    setEditingStudent(student);
    setEditForm(Object.fromEntries(
      STUDENT_EDIT_FIELDS.map(({ name }) => [name, student[name] ?? ""])
    ));
  }

  async function submitStudentEdit(event) {
    event.preventDefault();
    const student = { student_id: editingStudent.student_id };
    for (const { name, numeric } of STUDENT_EDIT_FIELDS) {
      const value = editForm[name];
      student[name] = numeric ? (value === "" ? null : Number(value)) : value;
    }
    setSavingStudent(true);
    try {
      await saveStudent(student);
      toast.success(`${student.student_id} saved`);
      setEditingStudent(null);
      await students.refresh();
    } catch (err) {
      toast.error(err.message || "Could not save the student record.");
    } finally {
      setSavingStudent(false);
    }
  }

  async function confirmStudentDelete() {
    setDeletePending(true);
    try {
      await deleteStudent(deletingStudent.student_id);
      toast.success(`${deletingStudent.student_id} deleted`);
      setDeletingStudent(null);
      await students.refresh();
    } catch (err) {
      toast.error(err.message || "Could not delete the student record.");
    } finally {
      setDeletePending(false);
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
            <SearchField
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search ID or name…"
            />
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
                  {pageRows.map((student) => {
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
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectStudentForPrediction(student)}
                              disabled={predicting === student.student_id}
                            >
                              {predicting === student.student_id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="size-3.5" />
                              )}
                              Predict
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openStudentEditor(student)}
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingStudent(student)}
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {!students.loading && students.status !== "error" && rows.length > 0 ? (
              <div className="flex items-center justify-between border-t border-border/50 p-3">
                <span className="text-[0.6875rem] text-muted-foreground">
                  Page {currentPage} of {pageCount} · {rows.length} students
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <PredictionPanel
          student={selected}
          result={result}
          error={predictError}
          predicting={Boolean(predicting)}
          missingFields={missingFields}
          predictionInputs={predictionInputs}
          onInputChange={(field, value) =>
            setPredictionInputs((current) => ({ ...current, [field]: value }))
          }
          onSubmit={() => {
            const overrides = {};
            if (missingFields.includes("age")) overrides.age = Number(predictionInputs.age);
            if (missingFields.includes("gender")) overrides.gender = predictionInputs.gender.trim();
            runPrediction(selected, overrides);
          }}
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

      <Dialog
        open={Boolean(editingStudent)}
        onOpenChange={(open) => {
          if (!open && !savingStudent) setEditingStudent(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit student record</DialogTitle>
            <DialogDescription>
              Update saved details for {editingStudent?.student_id}. Student ID cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitStudentEdit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="student-edit-id">Student ID</Label>
                <Input id="student-edit-id" value={editingStudent?.student_id || ""} readOnly />
              </div>
              {STUDENT_EDIT_FIELDS.map(({ name, label, numeric }) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={`student-edit-${name}`}>{label}</Label>
                  <Input
                    id={`student-edit-${name}`}
                    type={numeric ? "number" : "text"}
                    step={numeric ? "any" : undefined}
                    value={editForm[name] ?? ""}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, [name]: event.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingStudent(null)} disabled={savingStudent}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingStudent}>
                {savingStudent ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingStudent)}
        onOpenChange={(open) => {
          if (!open && !deletePending) setDeletingStudent(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete student record?</DialogTitle>
            <DialogDescription>
              This permanently deletes student {deletingStudent?.student_id} and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingStudent(null)} disabled={deletePending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmStudentDelete} disabled={deletePending}>
              {deletePending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Delete record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PredictionPanel({
  student,
  result,
  error,
  predicting,
  missingFields,
  predictionInputs,
  onInputChange,
  onSubmit,
}) {
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
        ) : missingFields.length > 0 ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <p className="text-[0.75rem] text-muted-foreground">
              Enter the missing details for this prediction. These values won’t be saved to the student record.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {missingFields.map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`prediction-${field}`}>
                    {field === "age" ? "Age" : "Gender"}
                  </Label>
                  <Input
                    id={`prediction-${field}`}
                    type={field === "age" ? "number" : "text"}
                    min={field === "age" ? 1 : undefined}
                    max={field === "age" ? 120 : undefined}
                    step={field === "age" ? 1 : undefined}
                    pattern={field === "gender" ? ".*\\S.*" : undefined}
                    title={field === "gender" ? "Enter a gender value." : undefined}
                    placeholder={field === "gender" ? "e.g. Female" : undefined}
                    value={predictionInputs[field]}
                    onChange={(event) => onInputChange(field, event.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
            <Button type="submit" size="sm" disabled={predicting}>
              <Sparkles className="size-3.5" />
              Run prediction
            </Button>
          </form>
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
