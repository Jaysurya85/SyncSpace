import FeaturePageShell from "../../../shared/components/FeaturePageShell";

const TasksPage = () => {
  return (
    <FeaturePageShell
      eyebrow="Tasks"
      title="Task coordination"
      description="Track assignments, deadlines, progress, and ownership without leaving the shared workspace."
    >
      <div className="rounded-3xl border border-dashed border-border bg-surface p-6 shadow-sm">
        <p className="text-sm leading-6 text-text-secondary">
          This route is connected to the authenticated app shell and can evolve
          into your task board, sprint planning, or personal workload view.
        </p>
      </div>
    </FeaturePageShell>
  );
};

export default TasksPage;
