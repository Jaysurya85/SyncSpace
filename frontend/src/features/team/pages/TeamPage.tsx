import { useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import FeaturePageShell from "../../../shared/components/FeaturePageShell";
import { useAuth } from "../../auth/useAuth";
import { useWorkspaceShell } from "../../workspaces/workspaceShellContext";

type InviteMode = "email" | "userId";

const TeamPage = () => {
  const { user } = useAuth();
  const {
    currentWorkspace,
    workspaceMembers,
    isMembersLoading,
    membersError,
    addWorkspaceMemberFromShell,
    removeWorkspaceMemberFromShell,
  } = useWorkspaceShell();
  const [inviteMode, setInviteMode] = useState<InviteMode>("email");
  const [inviteValue, setInviteValue] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const sortedMembers = useMemo(
    () =>
      [...workspaceMembers].sort((leftMember, rightMember) => {
        if (leftMember.role === rightMember.role) {
          return leftMember.name.localeCompare(rightMember.name);
        }

        return leftMember.role === "owner" ? -1 : 1;
      }),
    [workspaceMembers]
  );

  const ownerCount = workspaceMembers.filter(
    (member) => member.role === "owner"
  ).length;
  const memberCount = workspaceMembers.length;
  const currentUserMembership = workspaceMembers.find(
    (member) => member.userId === user.id || member.email === user.email
  );

  if (!currentWorkspace) {
    return null;
  }

  const handleInviteMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedValue = inviteValue.trim();

    if (!trimmedValue) {
      setSubmitError(
        inviteMode === "email"
          ? "An email address is required."
          : "A user ID is required."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await addWorkspaceMemberFromShell(
        currentWorkspace.id,
        inviteMode === "email"
          ? { email: trimmedValue }
          : { userId: trimmedValue }
      );

      setInviteValue("");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to add workspace member. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setRemovingUserId(userId);
      setSubmitError(null);
      await removeWorkspaceMemberFromShell(currentWorkspace.id, userId);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to remove workspace member. Please try again."
      );
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <FeaturePageShell
      eyebrow="Team"
      title={`${currentWorkspace.name} team`}
      description="Workspace membership now drives collaboration visibility. Everyone listed here should also receive this workspace through the workspace list API."
    >
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Team summary
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Members
                </p>
                <p className="mt-3 text-3xl font-semibold text-text-primary">
                  {memberCount}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Visible in this workspace
                </p>
              </div>

              <div className="rounded-2xl bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Owners
                </p>
                <p className="mt-3 text-3xl font-semibold text-text-primary">
                  {ownerCount}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Workspace administrators
                </p>
              </div>

              <div className="rounded-2xl bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Your role
                </p>
                <p className="mt-3 text-lg font-semibold capitalize text-text-primary">
                  {currentUserMembership?.role ?? currentWorkspace.role ?? "member"}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Based on current membership data
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleInviteMember}
            className="rounded-[28px] border border-border bg-surface p-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Add member
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">
              Invite someone into this workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Use email when the backend can resolve a user account from it. Use
              user ID if you already have the exact identifier.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {(["email", "userId"] as InviteMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setInviteMode(mode);
                    setInviteValue("");
                    setSubmitError(null);
                  }}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    inviteMode === mode
                      ? "bg-primary text-white"
                      : "border border-border bg-background text-text-secondary hover:border-primary/20 hover:bg-primary-light/40 hover:text-text-primary",
                  ].join(" ")}
                >
                  {mode === "email" ? "Add by email" : "Add by user ID"}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <Input
                label={inviteMode === "email" ? "Member email" : "Member user ID"}
                type={inviteMode === "email" ? "email" : "text"}
                placeholder={
                  inviteMode === "email" ? "user@example.com" : "user-2"
                }
                value={inviteValue}
                onChange={(event) => setInviteValue(event.target.value)}
                error={
                  submitError &&
                  (submitError.toLowerCase().includes("email") ||
                    submitError.toLowerCase().includes("user"))
                    ? submitError
                    : undefined
                }
              />
            </div>

            {submitError &&
            !submitError.toLowerCase().includes("email") &&
            !submitError.toLowerCase().includes("user") ? (
              <p className="mt-4 text-sm text-red-600">{submitError}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                POST /api/workspaces/{currentWorkspace.id}/members
              </p>
              <Button type="submit" loading={isSubmitting}>
                Add member
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Workspace members
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                Everyone with access to this workspace
              </h2>
            </div>

            <div className="rounded-2xl bg-background px-4 py-3 text-sm text-text-secondary">
              {memberCount} member{memberCount === 1 ? "" : "s"}
            </div>
          </div>

          {membersError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{membersError}</p>
            </div>
          ) : null}

          {!membersError && isMembersLoading ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-text-secondary">
              Loading workspace members...
            </div>
          ) : null}

          {!membersError && !isMembersLoading && sortedMembers.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-border bg-background p-8 text-center">
              <h3 className="text-xl font-semibold text-text-primary">
                No members found
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Add someone to this workspace and they should appear here once
                the backend returns them from the members endpoint.
              </p>
            </div>
          ) : null}

          {!membersError && !isMembersLoading && sortedMembers.length > 0 ? (
            <div className="mt-5 grid gap-4">
              {sortedMembers.map((member) => {
                const canRemove = member.role !== "owner" && member.userId !== user.id;

                return (
                  <article
                    key={member.userId}
                    className="rounded-[24px] border border-border bg-background p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-text-primary">
                            {member.name}
                          </h3>
                          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                            {member.role}
                          </span>
                          {member.userId === user.id ? (
                            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                              You
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm text-text-secondary">
                          {member.email || member.userId}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                          <span>ID {member.userId}</span>
                          <span>Joined {member.joinedAt}</span>
                        </div>
                      </div>

                      {canRemove ? (
                        <Button
                          type="button"
                          variant="secondary"
                          loading={removingUserId === member.userId}
                          onClick={() => handleRemoveMember(member.userId)}
                          className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Remove
                        </Button>
                      ) : (
                        <div className="rounded-full bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                          {member.role === "owner" ? "Owner" : "Current user"}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </FeaturePageShell>
  );
};

export default TeamPage;
