import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWorkspaceShell } from "../../features/workspaces/workspaceShellContext";

const WorkspaceSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspace, workspaces } = useWorkspaceShell();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const otherWorkspaces = useMemo(
    () =>
      workspaces.filter((workspace) => workspace.id !== currentWorkspace?.id),
    [workspaces, currentWorkspace]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  if (!currentWorkspace) {
    return null;
  }

  const currentWorkspaceSubtitle =
    currentWorkspace.documentCount !== undefined
      ? `${currentWorkspace.documentCount} document${
          currentWorkspace.documentCount === 1 ? "" : "s"
        }`
      : "Selected workspace";

  const getWorkspaceTargetPath = (nextWorkspaceId: string) => {
    const currentPath = location.pathname;

    if (
      currentPath.startsWith(
        `/workspaces/${currentWorkspace.id}/documents/`
      )
    ) {
      return `/workspaces/${nextWorkspaceId}/documents`;
    }

    if (currentPath.startsWith(`/workspaces/${currentWorkspace.id}/`)) {
      return currentPath.replace(
        `/workspaces/${currentWorkspace.id}/`,
        `/workspaces/${nextWorkspaceId}/`
      );
    }

    return `/workspaces/${nextWorkspaceId}/home`;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentState) => !currentState)}
        className="w-full rounded-2xl border border-primary/15 bg-primary-light px-4 py-3 text-left transition hover:border-primary/25"
      >
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
          Current Workspace
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {currentWorkspace.name}
            </p>
            <p className="truncate text-sm text-text-secondary">
              {currentWorkspaceSubtitle}
            </p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {isOpen ? "Close" : "Switch"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="workspace-switcher-popover mt-3 rounded-3xl border border-border bg-surface p-4 shadow-xl lg:absolute lg:left-0 lg:right-0 lg:z-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Available workspaces
            </p>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/home");
                }}
                className="rounded-2xl border border-border bg-background px-3 py-3 text-left transition hover:border-primary/20 hover:bg-primary-light"
              >
                <p className="text-sm font-semibold text-text-primary">
                  Back to workspace hub
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  View all workspaces on the global home page
                </p>
              </button>

              {otherWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(getWorkspaceTargetPath(workspace.id));
                  }}
                  className="rounded-2xl border border-border bg-background px-3 py-3 text-left transition hover:border-primary/20 hover:bg-primary-light"
                >
                  <p className="text-sm font-semibold text-text-primary">
                    {workspace.name}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {workspace.documentCount !== undefined
                      ? `${workspace.documentCount} document${
                          workspace.documentCount === 1 ? "" : "s"
                        }`
                      : "Available workspace"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WorkspaceSwitcher;
