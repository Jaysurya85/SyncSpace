declare module "turndown" {
  export interface TurndownOptions {
    headingStyle?: "setext" | "atx";
    hr?: string;
    bulletListMarker?: "-" | "*" | "+";
    codeBlockStyle?: "indented" | "fenced";
    emDelimiter?: "_" | "*";
    strongDelimiter?: "__" | "**";
    linkStyle?: "inlined" | "referenced";
    linkReferenceStyle?: "full" | "collapsed" | "shortcut";
  }

  export interface Rule {
    filter: string[] | string | ((node: Node, options: TurndownOptions) => boolean);
    replacement: (content: string, node: Node, options: TurndownOptions) => string;
  }

  export default class TurndownService {
    constructor(options?: TurndownOptions);
    addRule(key: string, rule: Rule): void;
    turndown(input: string | Node): string;
  }
}
