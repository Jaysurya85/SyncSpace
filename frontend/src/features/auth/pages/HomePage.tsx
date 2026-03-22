import FeaturePageShell from "../../../shared/components/FeaturePageShell";
import { useAuth } from "../../auth/useAuth";

const HomePage = () => {
  const { user } = useAuth();

  return (
    <FeaturePageShell
      eyebrow="Home"
      title={`Welcome back${user.name ? `, ${user.name}` : ""}`}
      description=""
    >
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">
            Your workspace Summary
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Everything you need to kickstart your next project is just a click away. Dive into your documents, track your tasks, and collaborate with your team seamlessly. Here's a quick overview of what's happening in your workspace right now.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Documents
              </p>
              <p className="mt-3 text-2xl font-semibold text-text-primary">18</p>
              <p className="mt-1 text-sm text-text-secondary">
                Active files in review
              </p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Tasks
              </p>
              <p className="mt-3 text-2xl font-semibold text-text-primary">9</p>
              <p className="mt-1 text-sm text-text-secondary">
                Open items this sprint
              </p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Team
              </p>
              <p className="mt-3 text-2xl font-semibold text-text-primary">12</p>
              <p className="mt-1 text-sm text-text-secondary">
                Members collaborating
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">
            Signed-in profile
          </h2>
          <div className="mt-5 flex items-center gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "Google profile"}
                className="h-16 w-16 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            <div>
              <p className="text-base font-semibold text-text-primary">
                {user.name || "SyncSpace Member"}
              </p>
              <p className="text-sm text-text-secondary">
                {user.email || "Signed in with Google"}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
                Provider: {user.provider || "Unknown"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </FeaturePageShell>
  );
};

export default HomePage;
