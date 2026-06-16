"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  BookOpen,
  Video,
  CalendarClock,
  BarChart3,
  ShieldCheck,
  PlayCircle,
  GraduationCap,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Video,
    title: "Live classes",
    desc: "Launch Zoom sessions in a click — students join from the app they already have.",
  },
  {
    icon: PlayCircle,
    title: "Recordings library",
    desc: "Every class is captured and lands in the course automatically, ready to replay.",
  },
  {
    icon: BookOpen,
    title: "Courses & content",
    desc: "Organise modules, lessons, slides and PDFs in a clean, structured space.",
  },
  {
    icon: CalendarClock,
    title: "Auto attendance",
    desc: "Join and leave times are tracked for you — no more manual roll-calls.",
  },
  {
    icon: BarChart3,
    title: "Insightful dashboards",
    desc: "Progress, engagement and attendance at a glance for every role.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    desc: "Students, teachers and admins each get exactly what they need — nothing more.",
  },
];

const roles = [
  {
    icon: GraduationCap,
    title: "Students",
    points: ["Join live classes", "Replay recordings", "Track your progress"],
  },
  {
    icon: Users,
    title: "Teachers",
    points: ["Schedule classes", "Build course content", "View attendance"],
  },
  {
    icon: ShieldCheck,
    title: "Admins",
    points: ["Manage people", "Oversee courses", "Reports & settings"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">
              Verdant
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#roles" className="transition-colors hover:text-foreground">
              For everyone
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="lg" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="lg" className="h-9 px-4" asChild>
              <Link href="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-mint-wash">
        <div className="mx-auto w-full max-w-6xl px-5 pt-20 pb-16 text-center md:pt-28">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 rounded-full px-3 py-1 text-secondary-foreground"
            >
              <Sparkles className="size-3.5" />
              The modern campus, online
            </Badge>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            className="mx-auto max-w-3xl font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl"
          >
            Where your college{" "}
            <span className="text-gradient-brand">comes to learn</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.12 }}
            className="mx-auto mt-5 max-w-xl text-base text-muted-foreground text-pretty sm:text-lg"
          >
            Live classes, recordings, courses and attendance — beautifully unified
            in one place for students, teachers and administrators.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.19 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" className="h-11 px-6 text-sm" asChild>
              <Link href="/login">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-11 px-6 text-sm" asChild>
              <a href="#features">Explore features</a>
            </Button>
          </motion.div>

          {/* Hero preview card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.28 }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="rounded-3xl border border-border/70 bg-card p-2 shadow-[var(--shadow-lift)]">
              <div className="rounded-[1.25rem] border border-border/60 bg-gradient-to-b from-secondary/60 to-card p-6 sm:p-10">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { k: "Live now", v: "Data Structures", icon: Video },
                    { k: "Today", v: "3 classes", icon: CalendarClock },
                    { k: "Attendance", v: "96%", icon: BarChart3 },
                  ].map((s) => (
                    <div
                      key={s.k}
                      className="rounded-2xl border border-border/60 bg-card p-4 text-left shadow-[var(--shadow-soft)]"
                    >
                      <s.icon className="size-5 text-brand-bright" />
                      <p className="mt-3 text-xs font-medium text-muted-foreground">
                        {s.k}
                      </p>
                      <p className="font-heading text-lg font-semibold">{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a campus needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            Thoughtfully designed tools that work together, so teaching and
            learning just flow.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-brand transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              One platform, every role
            </h2>
            <p className="mt-3 text-muted-foreground">
              A tailored experience for each person on campus.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {roles.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-border/70 bg-card p-7 shadow-[var(--shadow-soft)]"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
                  <r.icon className="size-6" />
                </span>
                <h3 className="mt-5 font-heading text-xl font-semibold">
                  {r.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {r.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="size-1.5 rounded-full bg-brand-bright" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20">
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-mint-wash bg-card p-10 text-center shadow-[var(--shadow-soft)] sm:p-16">
          <h2 className="mx-auto max-w-xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to bring your campus online?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Sign in to your Verdant workspace and start teaching today.
          </p>
          <Button size="lg" className="mt-8 h-11 px-6 text-sm" asChild>
            <Link href="/login">
              Get started <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-3.5" />
            </span>
            <span className="font-heading font-semibold text-foreground">
              Verdant LMS
            </span>
          </div>
          <p>© {new Date().getFullYear()} Verdant. Built for colleges.</p>
        </div>
      </footer>
    </div>
  );
}
