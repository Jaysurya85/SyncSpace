import FeaturePageShell from "../../../shared/components/FeaturePageShell";

const ChatPage = () => {
  return (
    <FeaturePageShell
      eyebrow="Chat"
      title="Workspace communication"
      description="Centralize conversations alongside the documents and tasks they relate to."
    >
      <div className="rounded-3xl border border-dashed border-border bg-surface p-6 shadow-sm">
        <p className="text-sm leading-6 text-text-secondary">
          This is the shell route for messaging, channels, threaded comments, or
          real-time collaboration updates.
        </p>
      </div>
    </FeaturePageShell>
  );
};

export default ChatPage;
