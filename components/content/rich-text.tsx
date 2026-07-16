import Link from "next/link";
import type { ReactNode } from "react";

import type { RichTextContent } from "@/types/content";

type LexicalNode = {
  children?: LexicalNode[];
  direction?: "ltr" | "rtl" | null;
  format?: number | string;
  listType?: "bullet" | "number";
  tag?: "h2" | "h3" | "h4" | "h5" | "h6";
  text?: string;
  type?: string;
  url?: string;
};

export function RichText({ content, className = "" }: { content: RichTextContent; className?: string }) {
  const root = asNode(content.root);
  const children = root.children ?? [];

  return <div className={`ae-rich-text ${className}`}>{children.map((node, index) => renderNode(node, `root-${index}`))}</div>;
}

function renderNode(node: LexicalNode, key: string): ReactNode {
  const children = node.children?.map((child, index) => renderNode(child, `${key}-${index}`));
  const direction = node.direction === "rtl" ? "rtl" : undefined;

  if (node.type === "text") {
    let value: ReactNode = node.text ?? "";
    const format = typeof node.format === "number" ? node.format : 0;
    if (format & 1) value = <strong>{value}</strong>;
    if (format & 2) value = <em>{value}</em>;
    if (format & 8) value = <u>{value}</u>;
    if (format & 16) value = <code>{value}</code>;
    return <span key={key}>{value}</span>;
  }

  if (node.type === "heading") {
    const Tag = node.tag === "h3" || node.tag === "h4" || node.tag === "h5" || node.tag === "h6" ? node.tag : "h2";
    return <Tag key={key} dir={direction}>{children}</Tag>;
  }
  if (node.type === "quote") return <blockquote key={key} dir={direction}>{children}</blockquote>;
  if (node.type === "list") {
    const Tag = node.listType === "number" ? "ol" : "ul";
    return <Tag key={key} dir={direction}>{children}</Tag>;
  }
  if (node.type === "listitem") return <li key={key} dir={direction}>{children}</li>;
  if (node.type === "linebreak") return <br key={key} />;
  if (node.type === "link" || node.type === "autolink") {
    const url = safeUrl(node.url);
    if (!url) return <span key={key}>{children}</span>;
    const external = url.startsWith("http");
    return <Link key={key} href={url} {...(external ? { rel: "noreferrer", target: "_blank" } : {})}>{children}</Link>;
  }
  if (node.type === "paragraph") return <p key={key} dir={direction}>{children}</p>;
  return <div key={key} dir={direction}>{children}</div>;
}

function asNode(value: unknown): LexicalNode {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LexicalNode : {};
}

function safeUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  if (value.startsWith("/") || value.startsWith("#") || /^https?:\/\//i.test(value) || /^mailto:/i.test(value)) return value;
  return undefined;
}
