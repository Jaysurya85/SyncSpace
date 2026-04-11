import type { DocumentRecord } from "../documents/documentTypes";
import type { WorkspaceRecord } from "./workspaceTypes";

export const initialWorkspaces: WorkspaceRecord[] = [
  {
    id: "ws-product-design-sprint",
    name: "Product Design Sprint",
    description:
      "Planning, launch notes, and design reviews for the current product sprint.",
    ownerName: "Priya Shah",
    updatedAt: "Apr 10, 2026",
  },
  {
    id: "ws-client-onboarding",
    name: "Client Onboarding",
    description:
      "Documents and checklists for onboarding new clients into the SyncSpace workflow.",
    ownerName: "Neha Patel",
    updatedAt: "Apr 8, 2026",
  },
];

export const initialWorkspaceDocuments: DocumentRecord[] = [
  {
    id: "doc-q2-launch-brief",
    workspaceId: "ws-product-design-sprint",
    title: "Q2 Product Launch Brief",
    description:
      "Campaign goals, release milestones, and stakeholder sign-off notes for the quarter.",
    ownerName: "Priya Shah",
    status: "In review",
    updatedAt: "Apr 6, 2026",
    content: `# Q2 Product Launch Brief

## Launch goals

- Align marketing and product messaging
- Confirm the release timeline across teams
- Capture stakeholder review notes in one place

## Current status

The team is finalizing launch assets and reviewing the customer onboarding flow.

[Project tracker](https://example.com/launch-tracker)
`,
  },
  {
    id: "doc-design-system-audit",
    workspaceId: "ws-product-design-sprint",
    title: "Design System Audit",
    description:
      "Component inventory, token cleanup proposals, and unresolved consistency gaps.",
    ownerName: "Sara Kim",
    status: "Draft",
    updatedAt: "Apr 4, 2026",
    content: `# Design System Audit

## Focus areas

1. Token duplication
2. Inconsistent button states
3. Missing mobile spacing rules

Use \`Button\` and \`Input\` as the baseline components for audit examples.
`,
  },
  {
    id: "doc-onboarding-checklist",
    workspaceId: "ws-client-onboarding",
    title: "Client Onboarding Checklist",
    description:
      "Kickoff flow, access requests, handoff notes, and delivery dependencies.",
    ownerName: "Neha Patel",
    status: "Approved",
    updatedAt: "Apr 1, 2026",
    content: `# Client Onboarding Checklist

## Pre-kickoff

- Confirm primary stakeholders
- Request workspace access
- Prepare the kickoff agenda

## Notes

Keep this checklist lightweight and easy to reuse for each engagement.
`,
  },
];
