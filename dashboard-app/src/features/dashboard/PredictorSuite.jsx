import * as React from "react";
import {
  BookOpen,
  GraduationCap,
  LineChart as LineIcon,
  Loader2,
  Sparkles,
  TrendingDown,
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
import { predictCgpa, predictField, predictUniversity } from "@/lib/resources";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChartFrame, ChartTooltip, axisTick, gridProps } from "@/components/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CITY_TIERS = ["Metro", "Urban", "Rural"];
const FIELDS = ["Pre-Medical", "Pre-Engineering", "Computer Science", "Commerce", "Arts/Humanities"];

export function PredictorSuite({ defaultTab = "field" }) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="grid h-9 w-full grid-cols-3 sm:w-auto sm:inline-grid">
        <TabsTrigger value="field">
          <GraduationCap />
          Field &amp; college
        </TabsTrigger>
        <TabsTrigger value="university">
          <BookOpen />
          University
        </TabsTrigger>
        <TabsTrigger value="cgpa">
          <LineIcon />
          CGPA trend
        </TabsTrigger>
      </TabsList>

      <TabsContent value="field">
        <FieldPredictor />
      </TabsContent>
      <TabsContent value="university">
        <UniversityPredictor />
      </TabsContent>
      <TabsContent value="cgpa">
        <CgpaPredictor />
      </TabsContent>
    </Tabs>
  );
}

function PredictorLayout({ title, description, controls, onSubmit, loading, error, children, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-4 sm:p-5">
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <h3 className="text-[0.875rem] font-semibold tracking-tight">{title}</h3>
          <p className="mt-0.5 max-w-xl text-[0.75rem] leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {controls}
        <Button type="submit" disabled={loading} className="sm:ml-auto">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Predicting…" : "Predict"}
        </Button>
      </form>

      {error ? (
        <p className="mt-3 rounded-md border border-risk/30 bg-risk-soft/60 px-3 py-2 text-[0.75rem] text-risk">
          {error}
        </p>
      ) : null}

      {children ? <Separator className="my-4" /> : null}
      {children}
    </div>
  );
}

function FieldPredictor() {
  const [matric, setMatric] = React.useState(75);
  const [city, setCity] = React.useState("Urban");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);

  async function run() {
    setLoading(true);
    setError("");
    try {
      setResult(await predictField(matric, city));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PredictorLayout
      icon={GraduationCap}
      title="Field & college admission predictor"
      description="Estimate a likely intermediate field and college tier from a matric percentage. Guidance only — based on typical merit patterns."
      loading={loading}
      error={error}
      onSubmit={run}
      controls={
        <>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="matric">Matric percentage</Label>
              <span className="font-mono text-[0.75rem] tnum text-primary">{matric}%</span>
            </div>
            <input
              id="matric"
              type="range"
              min={33}
              max={100}
              value={matric}
              onChange={(e) => setMatric(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </div>
          <div className="space-y-1.5 sm:w-36">
            <Label>City type</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITY_TIERS.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
    >
      {result ? (
        <ResultPair
          left={{ label: "Recommended field", value: result.recommended_field?.label, confidence: result.recommended_field?.confidence }}
          right={{ label: "Likely college tier", value: result.college_tier?.label, confidence: result.college_tier?.confidence }}
        />
      ) : null}
    </PredictorLayout>
  );
}

function UniversityPredictor() {
  const [intermediate, setIntermediate] = React.useState(70);
  const [field, setField] = React.useState("Computer Science");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);

  async function run() {
    setLoading(true);
    setError("");
    try {
      setResult(await predictUniversity(intermediate, field));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PredictorLayout
      icon={BookOpen}
      title="University admission predictor"
      description="Estimate a likely program and university tier from an intermediate percentage and completed field."
      loading={loading}
      error={error}
      onSubmit={run}
      controls={
        <>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="intermediate">Intermediate percentage</Label>
              <span className="font-mono text-[0.75rem] tnum text-primary">{intermediate}%</span>
            </div>
            <input
              id="intermediate"
              type="range"
              min={33}
              max={100}
              value={intermediate}
              onChange={(e) => setIntermediate(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </div>
          <div className="space-y-1.5 sm:w-48">
            <Label>Field completed</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELDS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
    >
      {result ? (
        <ResultPair
          left={{ label: "Suggested program", value: result.suggested_program?.label, confidence: result.suggested_program?.confidence }}
          right={{ label: "Likely university tier", value: result.university_tier?.label, confidence: result.university_tier?.confidence }}
        />
      ) : null}
    </PredictorLayout>
  );
}

function CgpaPredictor() {
  const [inputs, setInputs] = React.useState({
    attendance_rate: 75,
    avg_test_score: 70,
    assignments_submitted_pct: 75,
    study_hours_per_week: 10,
    previous_semester_gpa: 3.0,
    lms_login_frequency_per_week: 5,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);

  const fields = [
    ["attendance_rate", "Attendance %", 100],
    ["avg_test_score", "Avg test score", 100],
    ["assignments_submitted_pct", "Assignments %", 100],
    ["study_hours_per_week", "Study hrs / week", 60],
    ["previous_semester_gpa", "Current GPA", 4],
    ["lms_login_frequency_per_week", "LMS logins / week", 50],
  ];

  async function run() {
    setLoading(true);
    setError("");
    try {
      setResult(await predictCgpa(inputs));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const trend = result?.trend;
  const trendTone = trend === "improving" ? "safe" : trend === "declining" ? "risk" : "outline";
  const chartData = result
    ? [
        { label: "Previous", gpa: result.current_gpa, fill: "var(--chart-4)" },
        { label: "Predicted", gpa: result.predicted_next_gpa, fill: trend === "declining" ? "var(--chart-3)" : "var(--chart-2)" },
      ]
    : [];

  return (
    <PredictorLayout
      icon={LineIcon}
      title="CGPA trend predictor"
      description="Predict next semester's likely GPA from current attendance, scores and study habits."
      loading={loading}
      error={error}
      onSubmit={run}
      controls={
        <div className="grid w-full gap-3 sm:grid-cols-3">
          {fields.map(([key, label, max]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`cgpa-${key}`}>{label}</Label>
              <Input
                id={`cgpa-${key}`}
                type="number"
                step={key === "previous_semester_gpa" ? 0.1 : 1}
                max={max}
                min={0}
                value={inputs[key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="font-mono"
              />
            </div>
          ))}
        </div>
      }
    >
      {result ? (
        <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr] sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[2rem] leading-none tnum">
                {result.predicted_next_gpa.toFixed(2)}
              </span>
              <span className="text-[0.8125rem] text-muted-foreground">/ 4.00</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={trendTone} className="capitalize">
                {trend === "improving" ? <TrendingUp /> : trend === "declining" ? <TrendingDown /> : null}
                {trend}
              </Badge>
              <span className="text-[0.75rem] text-muted-foreground">
                from {result.current_gpa.toFixed(2)}
              </span>
            </div>
          </div>
          <ChartFrame height={150}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 4]} tick={axisTick} axisLine={false} tickLine={false} />
              <ChartTooltip formatter={(value) => value.toFixed(2)} />
              <Bar dataKey="gpa" name="GPA" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </div>
      ) : null}
    </PredictorLayout>
  );
}

function ResultPair({ left, right }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[left, right].map((item) => (
        <div key={item.label} className={cn("rounded-lg border border-border/70 bg-card p-3.5")}>
          <div className="text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
            {item.label}
          </div>
          <div className="mt-1 text-[1.0625rem] font-semibold tracking-tight">
            {item.value ?? "—"}
          </div>
          {item.confidence != null ? (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(item.confidence * 100)}%` }}
                />
              </div>
              <span className="font-mono text-[0.6875rem] tnum text-muted-foreground">
                {formatNumber(item.confidence * 100, 0)}%
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
