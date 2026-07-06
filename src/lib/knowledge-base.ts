import type { KnowledgeBasePage } from "@/types";

export type KnowledgeBaseFlatPage = Omit<KnowledgeBasePage, "children">;

type KnowledgeBaseFilterPage = Pick<KnowledgeBaseFlatPage, "id" | "title" | "content" | "parentId">;

export function buildKnowledgeTree(pages: KnowledgeBaseFlatPage[]): KnowledgeBasePage[] {
  const map = new Map<string, KnowledgeBasePage>();

  for (const page of pages) {
    map.set(page.id, { ...page, children: [] });
  }

  const roots: KnowledgeBasePage[] = [];

  for (const page of pages) {
    const node = map.get(page.id);
    if (!node) continue;

    if (page.parentId && map.has(page.parentId)) {
      map.get(page.parentId)?.children?.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: KnowledgeBasePage[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ru"));
    nodes.forEach((node) => {
      if (node.children?.length) sortNodes(node.children);
    });
  };

  sortNodes(roots);
  return roots;
}

export function filterKnowledgePages<T extends KnowledgeBaseFilterPage>(
  pages: T[],
  query: string,
): { pages: T[]; matchIds: Set<string> } {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { pages, matchIds: new Set() };
  }

  const matchIds = new Set(
    pages
      .filter(
        (page) =>
          page.title.toLowerCase().includes(trimmed) ||
          page.content.toLowerCase().includes(trimmed),
      )
      .map((page) => page.id),
  );

  const parentMap = new Map(pages.map((page) => [page.id, page.parentId]));
  const visibleIds = new Set<string>();

  for (const id of matchIds) {
    visibleIds.add(id);
    let parentId = parentMap.get(id) ?? null;

    while (parentId) {
      visibleIds.add(parentId);
      parentId = parentMap.get(parentId) ?? null;
    }
  }

  return {
    pages: pages.filter((page) => visibleIds.has(page.id)),
    matchIds,
  };
}

export function collectDescendantIds(
  pages: Array<{ id: string; parentId: string | null }>,
  rootId: string,
): Set<string> {
  const childrenMap = new Map<string | null, string[]>();

  for (const page of pages) {
    const key = page.parentId;
    const siblings = childrenMap.get(key) ?? [];
    siblings.push(page.id);
    childrenMap.set(key, siblings);
  }

  const result = new Set<string>();
  const stack = [rootId];

  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || result.has(id)) continue;
    result.add(id);

    for (const childId of childrenMap.get(id) ?? []) {
      stack.push(childId);
    }
  }

  return result;
}
