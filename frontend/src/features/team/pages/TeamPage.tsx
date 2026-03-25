import FeaturePageShell from "../../../shared/components/FeaturePageShell";

const TeamPage = () => {
  return (
    <FeaturePageShell
      eyebrow="Team"
      title="Team members and roles"
      description="Keep collaborators visible with workspace members, role management, and contribution context."
    >
      <div className="rounded-3xl border border-dashed border-border bg-surface p-6 shadow-sm">
        <p className="text-sm leading-6 text-text-secondary">
          Add team directories, invitations, permissions, and presence details
          here when the team management feature is ready.
        </p>
      </div>
    </FeaturePageShell>
  );
};

export default TeamPage;
