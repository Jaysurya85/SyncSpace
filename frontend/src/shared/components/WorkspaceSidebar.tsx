import { Link, NavLink, useParams } from "react-router-dom";
import { workspaceNavigation } from "../../app/workspaceNavigation";
import WorkspaceCreateAction from "./WorkspaceCreateAction";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const WorkspaceSidebar = () => {
  const { workspaceId } = useParams();

  return (
    <aside className="w-full border-b border-border bg-surface px-4 py-5 lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r lg:px-5">
      <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-stretch">
        <div>
          <Link to="/home" className="inline-block">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              SyncSpace
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-text-primary">
              Workspace View
            </h1>
          </Link>
          <p className="mt-1 text-sm text-text-secondary">
            Switch workspaces or move through documents, teams, and tasks within
            the currently selected workspace.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <WorkspaceSwitcher />
        <WorkspaceCreateAction />
      </div>

      <nav className="mt-6">
        <ul className="grid gap-2 lg:gap-1">
          {workspaceNavigation.map((item) => (
            <li key={item.segment}>
              <NavLink
                to={`/workspaces/${workspaceId}/${item.segment}`}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-2xl border px-3 py-3 transition",
                    isActive
                      ? "border-primary/20 bg-primary-light text-primary shadow-sm"
                      : "border-transparent text-text-secondary hover:border-border hover:bg-background hover:text-text-primary",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold uppercase tracking-[0.16em]",
                        isActive
                          ? "bg-white text-primary"
                          : "bg-background text-text-muted group-hover:bg-white group-hover:text-text-primary",
                      ].join(" ")}
                    >
                      {item.shortLabel}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs">
                        {item.description}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default WorkspaceSidebar;
