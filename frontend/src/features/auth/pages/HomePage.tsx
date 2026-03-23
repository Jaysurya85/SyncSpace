import { Link } from "react-router-dom";
import FeaturePageShell from "../../../shared/components/FeaturePageShell";
import { useAuth } from "../../auth/useAuth";

const quickActions = [
  {
    title: "Create document",
    description: "Start a new shared draft for your team.",
    path: "/documents",
    accent: "from-primary to-primary-hover",
  },
  {
    title: "Review tasks",
    description: "Check what needs attention this week.",
    path: "/tasks",
    accent: "from-slate-800 to-slate-700",
  },
  {
    title: "Open team space",
    description: "See collaborators, roles, and availability.",
    path: "/team",
    accent: "from-emerald-600 to-teal-500",
  },
];

const recentDocuments = [
  {
    title: "Q2 Product Launch Brief",
    summary: "Campaign messaging, launch goals, and stakeholder review notes.",
    updatedAt: "2 hours ago",
    owner: "Priya Shah",
    status: "In review",
    collaborators: 6,
  },
  {
    title: "Engineering Weekly Sync Notes",
    summary: "Shared sprint blockers, architecture follow-ups, and release risks.",
    updatedAt: "Yesterday",
    owner: "Arjun Mehta",
    status: "Active",
    collaborators: 4,
  },
  {
    title: "Client Onboarding Checklist",
    summary: "Documentation flow, kickoff tasks, and access requirements.",
    updatedAt: "Mar 21",
    owner: "Neha Patel",
    status: "Draft",
    collaborators: 3,
  },
  {
    title: "Design System Decisions",
    summary: "Approved component changes and unresolved UX questions.",
    updatedAt: "Mar 20",
    owner: "Sara Kim",
    status: "Approved",
    collaborators: 5,
  },
];

const moduleHighlights = [
  {
    title: "Tasks",
    value: "9 open",
    description: "Track deliverables, owners, and sprint focus.",
    path: "/tasks",
  },
  {
    title: "Team",
    value: "12 members",
    description: "View collaborators, roles, and shared responsibilities.",
    path: "/team",
  },
  {
    title: "Chat",
    value: "3 channels",
    description: "Keep discussion tied to active workspace work.",
    path: "/chat",
  },
];

const HomePage = () => {
  const { user } = useAuth();

  return (
    <FeaturePageShell
      eyebrow="Home"
      title={`Welcome back${user.name ? `, ${user.name}` : ""}`}
      description="SyncSpace is your shared workspace for documents, tasks, and team communication. Start from your active documents, then move into the rest of the workspace as needed."
    >
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Workspace overview
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-text-primary md:text-3xl">
                Pick up where your team left off and keep the work moving.
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                Your dashboard keeps documents front and center while surfacing
                the next places you may want to jump into across tasks, team
                coordination, and communication.
              </p>
            </div>

            <div className="rounded-3xl bg-background p-4 lg:w-72">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Signed in as
              </p>
              <div className="mt-4 flex items-center gap-3">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "Google profile"}
                    className="h-14 w-14 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-base font-semibold text-white">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {user.name || "SyncSpace Member"}
                  </p>
                  <p className="truncate text-sm text-text-secondary">
                    {user.email || "Signed in with Google"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Documents
              </p>
              <p className="mt-3 text-3xl font-semibold text-text-primary">18</p>
              <p className="mt-1 text-sm text-text-secondary">
                Recent files available in your workspace
              </p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Reviews
              </p>
              <p className="mt-3 text-3xl font-semibold text-text-primary">5</p>
              <p className="mt-1 text-sm text-text-secondary">
                Documents currently waiting for feedback
              </p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Activity
              </p>
              <p className="mt-3 text-3xl font-semibold text-text-primary">12</p>
              <p className="mt-1 text-sm text-text-secondary">
                Workspace updates in the last 24 hours
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Quick actions
                </p>
                <h2 className="mt-2 text-lg font-semibold text-text-primary">
                  Jump into work
                </h2>
              </div>
              <Link
                to="/documents"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.path}
                  className="group overflow-hidden rounded-2xl border border-border bg-background transition hover:border-primary/25 hover:shadow-sm"
                >
                  <div className={`h-1 w-full bg-gradient-to-r ${action.accent}`} />
                  <div className="p-4">
                    <p className="text-sm font-semibold text-text-primary">
                      {action.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      {action.description}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Open module
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Recent documents
              </p>
              <h2 className="mt-2 text-xl font-semibold text-text-primary">
                Keep documents at the center of your workflow
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                These are mock documents for now, but this section is structured
                to become your primary dashboard preview for document activity.
              </p>
            </div>

            <Link
              to="/documents"
              className="text-sm font-medium text-primary hover:underline"
            >
              Go to documents
            </Link>
          </div>

          <div className="mt-5 grid gap-4">
            {recentDocuments.map((document) => (
              <article
                key={document.title}
                className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/25"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-text-primary">
                        {document.title}
                      </h3>
                      <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                        {document.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {document.summary}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
                    Updated {document.updatedAt}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                  <span>Owner: {document.owner}</span>
                  <span>{document.collaborators} collaborators</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Upcoming modules
            </p>
            <h2 className="mt-2 text-xl font-semibold text-text-primary">
              Other parts of the workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              These sections are placeholders for the next modules you will
              build around the document workflow.
            </p>

            <div className="mt-5 grid gap-3">
              {moduleHighlights.map((module) => (
                <Link
                  key={module.title}
                  to={module.path}
                  className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/25 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-primary">
                      {module.title}
                    </p>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                      {module.value}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {module.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </FeaturePageShell>
  );
};

export default HomePage;
