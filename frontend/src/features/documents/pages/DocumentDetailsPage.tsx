import { useParams } from "react-router-dom";
import FeaturePageShell from "../../../shared/components/FeaturePageShell";

const DocumentDetailsPage = () => {
  const { id } = useParams();

  return (
    <FeaturePageShell
      eyebrow="Document"
      title="Document workspace"
      description="This route is now wired so the document list can hand off users into an individual document experience."
    >
      <div className="rounded-3xl border border-dashed border-border bg-surface p-6 shadow-sm">
        <p className="text-sm leading-6 text-text-secondary">
          Document ID: <span className="font-semibold text-text-primary">{id}</span>
        </p>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Build the editor, metadata panel, comments, or activity stream here.
        </p>
      </div>
    </FeaturePageShell>
  );
};

export default DocumentDetailsPage;
