import type { DocumentRecord } from "./documentTypes";

export const initialDocuments: DocumentRecord[] = [
  {
    id: "doc-q2-launch-brief",
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
