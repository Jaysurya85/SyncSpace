import { NavLink } from "react-router-dom";
import { appNavigation } from "../../app/navigation";

const Sidebar = () => {
  return (
    <aside className="w-full border-b border-border bg-surface px-4 py-5 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5">
      <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-stretch">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            SyncSpace
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary">
            Workspace
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Documents, tasks, and communication in one shared hub.
          </p>
        </div>

        <div className="hidden rounded-2xl border border-primary/15 bg-primary-light px-4 py-3 lg:block">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
            Current Space
          </p>
          <p className="mt-2 text-sm font-semibold text-text-primary">
            Product Design Sprint
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            12 active collaborators
          </p>
        </div>
      </div>

      <nav className="mt-6">
        <ul className="grid gap-2 lg:gap-1">
          {appNavigation.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
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

export default Sidebar;
