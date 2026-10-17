import {
  ArrowRight,
  BellRing,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/brand";
import { ThemeToggleButton } from "@/components/theme-toggle";
import Hero3D from "@/components/Hero3D";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Dropout-risk detection",
    body: "A trained classifier scores every student from attendance, test performance, assignment completion and LMS engagement — then keeps scoring as new data lands.",
  },
  {
    icon: Waypoints,
    title: "Pathway predictors",
    body: "Matric and intermediate percentages become actionable recommendations: likely field, college tier, university tier and next-semester GPA trend.",
  },
  {
    icon: BellRing,
    title: "Live risk alerts",
    body: "Server-sent events push a banner to admins, teachers and analysts the moment a student is flagged — no refresh, no polling loop in the browser.",
  },
  {
    icon: LineChart,
    title: "Cohort analytics",
    body: "Correlations against dropout risk, feature-importance rankings and side-by-side cohort comparisons for decisions that hold up to scrutiny.",
  },
];

const STATS = [
  { value: "4", label: "ML models in production" },
  { value: "12", label: "Dropout-risk features" },
  { value: "4", label: "Role-based workspaces" },
  { value: "5 MB", label: "Max upload per request" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export function LandingPage({ onLogin, onSignup }) {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : "hidden";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[0.95rem] font-semibold tracking-tight">
              Edu<span className="text-primary">Predict</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggleButton />
            <Button variant="ghost" size="sm" onClick={onLogin}>
              Log in
            </Button>
            <Button size="sm" onClick={onSignup}>
              Get started
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4]" />
          <div
            className="pointer-events-none absolute top-[-20rem] left-1/2 size-[40rem] -translate-x-1/2 rounded-full opacity-[0.10] blur-[120px]"
            style={{ background: "var(--primary)" }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20 lg:pb-24">
            <motion.div variants={stagger} initial={initial} animate="show">
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="gap-1.5 border-border/80 bg-card/60 py-1 pr-3 pl-1.5 text-muted-foreground">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary/15">
                    <Sparkles className="size-2.5 text-primary" />
                  </span>
                  Academic analytics portal
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="mt-5 max-w-2xl text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.02em] text-balance sm:text-[3.25rem] lg:text-[3.75rem]"
              >
                Spot at-risk students
                <br />
                <span className="font-serif font-normal italic text-primary">before it's too late.</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground"
              >
                EduPredict pairs Hadoop-scale data processing with machine learning to predict
                dropout risk, recommend academic pathways and give every stakeholder — admin,
                teacher, student, analyst — the view they actually need.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={onSignup}>
                  Get started
                  <ArrowRight className="size-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={onLogin}>
                  I already have an account
                </Button>
              </motion.div>
              <motion.p variants={fadeUp} className="mt-5 text-[0.75rem] text-muted-foreground">
                Built on Hadoop/HDFS, PySpark, Flask, MongoDB and React.
              </motion.p>
            </motion.div>

            <motion.div
              className="relative mx-auto aspect-square w-full max-w-[28rem]"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
            >
              <div className="absolute inset-0 rounded-full border border-border/50" />
              <div className="absolute inset-[12%] rounded-full border border-border/30" />
              <Hero3D className="absolute inset-0" />
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 text-[0.6875rem] text-muted-foreground backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-safe opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-safe" />
                </span>
                Risk model online · scoring continuously
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-y border-border/60 bg-card/30">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border/60 px-5 sm:px-8 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-2 py-6 first:pl-0 sm:px-6">
                <div className="font-mono text-[1.5rem] leading-none font-medium tracking-tight tnum">
                  {stat.value}
                </div>
                <div className="mt-1.5 text-[0.75rem] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="max-w-xl">
            <div className="text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              What it does
            </div>
            <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-balance sm:text-[2rem]">
              One platform, four roles, a single source of truth.
            </h2>
          </div>

          <motion.div
            variants={stagger}
            initial={initial}
            animate="show"
            className="mt-9 grid gap-3 sm:grid-cols-2"
          >
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  variants={fadeUp}
                  className="group rounded-xl border border-border/70 bg-card p-5 transition-colors hover:border-border"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <Icon className="size-4 text-primary" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 text-[0.9375rem] font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>
        </section>

        {/* Roles */}
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <div className="text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Role-based workspaces
                </div>
                <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-balance">
                  Everyone sees exactly what their job needs.
                </h2>
                <p className="mt-3 text-[0.875rem] leading-relaxed text-muted-foreground">
                  Permissions are enforced server-side on every route. Signing up as a teacher,
                  student or analyst creates a pending account that an administrator reviews before
                  first sign-in.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { role: "Admin", desc: "System overview, student register, approvals, audit log and system health." },
                  { role: "Teacher", desc: "Class roster, one-click risk prediction and CSV ingestion for the whole class." },
                  { role: "Student", desc: "Personal standing, metric targets, goals, badges and pathway predictors." },
                  { role: "Analyst", desc: "Model quality metrics, feature importance, correlations and cohort comparison." },
                ].map((item) => (
                  <div key={item.role} className="rounded-lg border border-border/70 bg-card/50 p-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="size-3.5 text-primary" />
                      <span className="text-[0.8125rem] font-semibold">{item.role}</span>
                    </div>
                    <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card px-6 py-10 sm:px-10">
            <div
              className="pointer-events-none absolute -top-24 right-0 size-[24rem] rounded-full opacity-[0.12] blur-[80px]"
              style={{ background: "var(--primary)" }}
            />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-[1.5rem] font-semibold tracking-tight text-balance">
                  Start with a single class roster.
                </h2>
                <p className="mt-1.5 max-w-md text-[0.8125rem] leading-relaxed text-muted-foreground">
                  Upload a CSV or JSON export, and the risk model scores every student on the next
                  pass. No model training required — the classifiers ship with the API.
                </p>
              </div>
              <Button size="lg" onClick={onSignup} className="shrink-0">
                Create an account
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-[0.75rem] text-muted-foreground sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <LogoMark className="size-5" />
            <span>EduPredict · Student risk &amp; academic analytics</span>
          </div>
          <span>Hadoop · PySpark · Flask · MongoDB · React</span>
        </div>
      </footer>
    </div>
  );
}
