import type { DocumentSummary } from "./documentTypes";

export const initialDocuments: DocumentSummary[] = [
  {
    id: "doc-q2-launch-brief",
    title: "Q2 Product Launch Brief",
    description:
      "Campaign goals, release milestones, and stakeholder sign-off notes for the quarter.",
    ownerName: "Priya Shah",
    status: "In review",
    updatedAt: "Apr 6, 2026",
  },
  {
    id: "doc-design-system-audit",
    title: "Design System Audit",
    description:
      "Component inventory, token cleanup proposals, and unresolved consistency gaps.",
    ownerName: "Sara Kim",
    status: "Draft",
    updatedAt: "Apr 4, 2026",
  },
  {
    id: "doc-onboarding-checklist",
    title: "Client Onboarding Checklist",
    description:
      "Kickoff flow, access requests, handoff notes, and delivery dependencies.",
    ownerName: "Neha Patel",
    status: "Approved",
    updatedAt: "Apr 1, 2026",
  },
];
