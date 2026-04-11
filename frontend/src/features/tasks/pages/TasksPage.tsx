import FeaturePageShell from "../../../shared/components/FeaturePageShell";
import { useWorkspaceShell } from "../../workspaces/workspaceShellContext";

const TasksPage = () => {
  const { currentWorkspace } = useWorkspaceShell();

  if (!currentWorkspace) {
    return null;
  }

  return (
    <FeaturePageShell
      eyebrow="Tasks"
      title={`${currentWorkspace.name} tasks`}
      description="Track assignments, deadlines, progress, and ownership without leaving the selected workspace."
    >
      <div className="rounded-3xl border border-dashed border-border bg-surface p-6 shadow-sm">
        <p className="text-sm leading-6 text-text-secondary">
          This route is now scoped to the selected workspace and can evolve
          into a task board, sprint planning space, or personal workload view.
        </p>
      </div>
    </FeaturePageShell>
  );
};

export default TasksPage;
