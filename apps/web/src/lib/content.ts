import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

export interface ContentFrontmatter {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface LoadedContent {
  frontmatter: ContentFrontmatter;
  content: string;
}

function resolveContentPath(mdxRef: string): string {
  const candidates = [
    path.join(process.cwd(), "content", mdxRef),
    path.join(process.cwd(), mdxRef),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0]!;
}

export function loadContent(mdxRef: string): LoadedContent {
  const filePath = resolveContentPath(mdxRef);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return {
    frontmatter: (parsed.data ?? {}) as ContentFrontmatter,
    content: parsed.content,
  };
}

export const loadMdx = loadContent;
export const readMdx = loadContent;
export const getMdxContent = loadContent;
export const loadMdxContent = loadContent;