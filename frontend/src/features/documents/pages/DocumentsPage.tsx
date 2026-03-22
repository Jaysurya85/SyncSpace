import FeaturePageShell from "../../../shared/components/FeaturePageShell";

const DocumentsPage = () => {
  return (
    <FeaturePageShell
      eyebrow="Documents"
      title="Shared documents"
      description="This section is ready for collaborative editing features, document lists, drafts, and review workflows."
    >
      <div className="rounded-3xl border border-dashed border-border bg-surface p-6 shadow-sm">
        <p className="text-sm leading-6 text-text-secondary">
          Use this page for document browsing, recent files, editing sessions,
          and permissions. The authenticated layout is already connected, so you
          can build the documents feature inside this content area.
        </p>
      </div>
    </FeaturePageShell>
  );
};

export default DocumentsPage;
