interface FeaturePageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

const FeaturePageShell = ({
  eyebrow,
  title,
  description,
  children,
}: FeaturePageShellProps) => {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-text-primary">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
};

export default FeaturePageShell;
