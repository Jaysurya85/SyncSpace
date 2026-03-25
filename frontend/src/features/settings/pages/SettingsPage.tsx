import FeaturePageShell from "../../../shared/components/FeaturePageShell";

const SettingsPage = () => {
  return (
    <FeaturePageShell
      eyebrow="Settings"
      title="Workspace settings"
      description="Control workspace preferences, profile options, and future integration settings from one place."
    >
      <div className="rounded-3xl border border-dashed border-border bg-surface p-6 shadow-sm">
        <p className="text-sm leading-6 text-text-secondary">
          Build workspace preferences, profile management, and admin controls in
          this section when you are ready.
        </p>
      </div>
    </FeaturePageShell>
  );
};

export default SettingsPage;
