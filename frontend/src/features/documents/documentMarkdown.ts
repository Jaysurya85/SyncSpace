import { marked } from "marked";
import TurndownService from "turndown";

const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
});

turndownService.addRule("strikethrough", {
  filter: ["del", "s", "strike"],
  replacement(content: string) {
    return `~~${content}~~`;
  },
});

export const markdownToHtml = (markdown: string) => {
  const parsed = marked.parse(markdown);
  return typeof parsed === "string" ? parsed : "";
};

export const htmlToMarkdown = (html: string) => turndownService.turndown(html);
