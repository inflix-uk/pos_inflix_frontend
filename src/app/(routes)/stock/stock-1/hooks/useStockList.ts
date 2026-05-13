"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { stockListApi, type StockListItem } from "../services/stockListApi";
import { categoryApi } from "../../../inventory/category/service/categoryApi";

const LEVEL_LABELS = [
 "Category",
 "Manufacturer",
 "Model",
 "Condition",
 "Capacity",
 "Colour",
] as const;

const UNSPECIFIED = "(Unspecified)";

/** path indices: 0=category, 1=manufacturer, 2=model, 3=grade, 4=capacity, 5=colour, 6+=dim_6, dim_7, ... */
export interface StockListFilters {
 category: string;
 manufacturer: string;
 model: string;
 grade: string;
 capacity: string;
 colour: string;
 taxCategory: string;
 search: string;
 [key: string]: string;
}

export const DEFAULT_FILTERS: StockListFilters = {
 category: "",
 manufacturer: "",
 brands: "",
 model: "",
 brands_model: "",
 grade: "",
 capacity: "",
 colour: "",
 taxCategory: "",
 search: "",
};

/** One filter dimension (only included when options.length > 0) */
export interface StockListFilterDimension {
 key: string;
 label: string;
 options: string[];
}

export interface StockListFilterOptions {
 /** Dynamic list: only dimensions that have at least one option in the data */
 dimensions: StockListFilterDimension[];
 /** @deprecated Use dimensions instead */
 categories: string[];
 subCategories: string[];
 manufacturers: string[];
 models: string[];
 grades: string[];
 capacities: string[];
 colours: string[];
}

/** Slug synonyms: filter key -> path segment slugs that represent the same attribute (backend may use different names). */
const SLUG_SYNONYMS: Record<string, string[]> = {
 storage: ["capacity"],
 color: ["colour"],
 colour: ["color"],
 brands: ["manufacturer", "brand"],
 brands_model: ["model", "brand_model"],
 condition: ["grade"],
 grade: ["condition"],
 manufacturer: ["brands", "brand"],
 model: ["brands_model", "brand_model"],
};

function pathSegmentMatchesFilter(path: string[], key: string, value: string): boolean {
 const segment = `${key}:${value}`;
 if (path.some((seg) => (seg ?? "").trim() === segment)) return true;
 if (key === "category") {
  const v = (value ?? "").trim().toLowerCase();
  if (path.some((seg) => (seg ?? "").trim().toLowerCase() === `category:${v}`)) return true;
 }
 const synonyms = SLUG_SYNONYMS[key];
 if (synonyms) {
  for (const alt of synonyms) {
   if (path.some((seg) => (seg ?? "").trim() === `${alt}:${value}`)) return true;
  }
 }
 return false;
}

/** All dimensions are dynamic (slug:value segments). Match by segment (including synonym slugs). */
function matchesFilter(path: string[], filters: StockListFilters): boolean {
 for (const key of Object.keys(filters)) {
  if (key === "taxCategory" || key === "search" || !filters[key]) continue;
  if (!pathSegmentMatchesFilter(path, key, filters[key])) return false;
 }
 return true;
}

/** Substring search across the value-part of every path segment (e.g. "category:Phone" → "Phone"). */
function matchesSearch(path: string[], term: string): boolean {
 const t = (term ?? "").trim().toLowerCase();
 if (!t) return true;
 for (const segment of path) {
  const s = (segment ?? "").trim();
  if (!s) continue;
  const value = s.includes(":") ? s.slice(s.indexOf(":") + 1).trim() : s;
  if (value.toLowerCase().includes(t)) return true;
 }
 return false;
}

export interface TreeNode {
 label: string;
 pathKey: string;
 depth: number;
 availableCount: number;
 children: TreeNode[];
}

export interface StockListRow {
 label: string;
 pathKey: string;
 depth: number;
 availableCount: number;
 hasChildren: boolean;
}

function ensurePath(
 roots: Map<string, TreeNode>,
 path: string[],
 leafCount: number
): void {
 let current: TreeNode | undefined;
 const parts: string[] = [];

 for (let i = 0; i < path.length; i++) {
  const segment = (path[i] ?? "").trim() || UNSPECIFIED;
  parts.push(segment);
  const pathKey = parts.join("|");

  if (i === 0) {
   if (!roots.has(segment)) {
    const node: TreeNode = {
     label: segment,
     pathKey,
     depth: 0,
     availableCount: 0,
     children: [],
    };
    roots.set(segment, node);
   }
   current = roots.get(segment)!;
  } else if (current) {
   let next = current.children.find((c) => c.label === segment);
   if (!next) {
    next = {
     label: segment,
     pathKey,
     depth: current.depth + 1,
     availableCount: 0,
     children: [],
    };
    current.children.push(next);
   }
   current = next;
  }

  if (i === path.length - 1 && current) {
   current.availableCount += leafCount;
  }
 }
}

function rollupCounts(nodes: TreeNode[]): void {
 for (const node of nodes) {
  rollupCounts(node.children);
  if (node.children.length > 0) {
   node.availableCount = node.children.reduce(
    (sum, c) => sum + c.availableCount,
    0
   );
  }
 }
}

/** Drop slug:value segments where the value is empty — backend emits a fixed 6-slot path even
 *  for categories that don't define those variant attributes (e.g. AirTag has no
 *  condition/capacity/colour), and those would otherwise render as "(Unspecified)" leaves. */
function stripEmptySegments(path: string[]): string[] {
 return path.filter((seg) => {
  const s = (seg ?? "").trim();
  if (!s) return false;
  if (s.includes(":")) return s.slice(s.indexOf(":") + 1).trim() !== "";
  return true;
 });
}

function buildTree(items: StockListItem[]): TreeNode[] {
 const roots = new Map<string, TreeNode>();

 for (const item of items) {
  const path = stripEmptySegments(item.path || []);
  if (path.length === 0 && item.availableCount > 0) {
   const key = UNSPECIFIED;
   if (!roots.has(key)) {
    roots.set(key, {
     label: key,
     pathKey: key,
     depth: 0,
     availableCount: 0,
     children: [],
    });
   }
   roots.get(key)!.availableCount += item.availableCount;
   continue;
  }
  ensurePath(roots, path, item.availableCount);
 }

 const rootArray = Array.from(roots.values()).sort((a, b) =>
  a.label.localeCompare(b.label)
 );
 function sortChildren(nodes: TreeNode[]) {
  nodes.sort((a, b) => a.label.localeCompare(b.label));
  nodes.forEach((n) => sortChildren(n.children));
 }
 sortChildren(rootArray);
 rollupCounts(rootArray);
 return rootArray;
}

function segmentDisplayLabel(segment: string): string {
 const s = (segment ?? "").trim();
 if (s.includes(":")) {
  const value = s.slice(s.indexOf(":") + 1).trim();
  return value || UNSPECIFIED;
 }
 return s || UNSPECIFIED;
}

function flattenVisible(
 nodes: TreeNode[],
 expanded: Set<string>,
 out: StockListRow[] = []
): StockListRow[] {
 for (const node of nodes) {
  out.push({
   label: segmentDisplayLabel(node.label),
   pathKey: node.pathKey,
   depth: node.depth,
   availableCount: node.availableCount,
   hasChildren: node.children.length > 0,
  });
  if (node.children.length > 0 && expanded.has(node.pathKey)) {
   flattenVisible(node.children, expanded, out);
  }
 }
 return out;
}

export function useStockList(options?: { enabled?: boolean }) {
 const enabled = options?.enabled !== false;
 const [items, setItems] = useState<StockListItem[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [expanded, setExpanded] = useState<Set<string>>(new Set());
 const [filters, setFilters] = useState<StockListFilters>(DEFAULT_FILTERS);
 const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
 const [categoryVariantSlugs, setCategoryVariantSlugs] = useState<string[] | null>(null);

 const fetchStockList = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
   const res = await stockListApi.getStockList({ status: "Received" });
   if (!res.success || !Array.isArray(res.data)) {
    setItems([]);
    setError(res.message || "Failed to load stock list");
    return;
   }
   setItems(res.data);
  } catch (err) {
   console.error("Error fetching stock list:", err);
   setError("Failed to load stock list");
   setItems([]);
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  if (enabled) fetchStockList();
 }, [enabled, fetchStockList]);

 useEffect(() => {
  if (!enabled) return;
  let cancelled = false;
  (async () => {
   const res = await categoryApi.getCategories({ isActive: true, limit: 500 });
   if (cancelled || !res.success || !Array.isArray(res.data)) return;
   const list = (res.data as Array<{ _id: string; name: string }>).map((c) => ({
    _id: c._id,
    name: c.name ?? "",
   }));
   setCategories(list);
  })();
  return () => {
   cancelled = true;
  };
 }, [enabled]);

 useEffect(() => {
  if (!filters.category?.trim()) {
   setCategoryVariantSlugs(null);
   return;
  }
  const cat = categories.find((c) => c.name === filters.category);
  if (!cat) {
   setCategoryVariantSlugs(null);
   return;
  }
  let cancelled = false;
  (async () => {
   const res = await categoryApi.getCategoryVariantAttributes(cat._id);
   if (cancelled || !res.success || !Array.isArray(res.data)) {
    if (!cancelled) setCategoryVariantSlugs([]);
    return;
   }
   const slugs = (res.data as Array<{ slug?: string }>)
    .map((a) => a.slug)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
   if (!cancelled) setCategoryVariantSlugs(slugs);
  })();
  return () => {
   cancelled = true;
  };
 }, [filters.category, categories]);

 const hasAnyPathData = (path: string[]) =>
  path.some((s) => (s ?? "").trim() !== "");

 const filteredItems = useMemo(
  () =>
   items
    .filter((item) => hasAnyPathData(item.path || []))
    .filter((item) => {
     const path = item.path || [];
     return matchesFilter(path, filters) && matchesSearch(path, filters.search);
    }),
  [items, filters]
 );

 const filterOptions = useMemo((): StockListFilterOptions => {
  const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
  const uniq = (arr: (string | null | undefined)[]): string[] =>
   [...new Set(arr)]
    .filter(
     (v): v is string =>
      v != null &&
      v !== "" &&
      v !== UNSPECIFIED &&
      !OBJECT_ID_REGEX.test(String(v))
    )
    .sort();

  const formatSlugLabel = (slug: string) =>
   slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const bySlug = new Map<string, Set<string>>();
  let categoryOptions: string[] = [];
  for (const item of items) {
   const path = item.path || [];
   for (const segment of path) {
    const s = (segment ?? "").trim();
    if (!s || !s.includes(":")) continue;
    const colon = s.indexOf(":");
    const slug = s.slice(0, colon).trim();
    const value = s.slice(colon + 1).trim();
    if (!slug || !value || OBJECT_ID_REGEX.test(value)) continue;
    if (slug === "category") {
     categoryOptions.push(value);
     continue;
    }
    if (!bySlug.has(slug)) bySlug.set(slug, new Set());
    bySlug.get(slug)!.add(value);
   }
  }
  categoryOptions = uniq(categoryOptions);

  const categoryDimension: StockListFilterDimension = {
   key: "category",
   label: "Category",
   options: categoryOptions,
  };
  const dimensions: StockListFilterDimension[] = [categoryDimension];

  // Show variant attributes for the selected category; always include Brand and Model when the data has them
  const selectedCategory = filters.category?.trim();
  const categorySegmentMatch = (seg: string) => {
   const s = (seg ?? "").trim();
   if (!s.toLowerCase().startsWith("category:")) return false;
   const pathVal = s.slice(9).trim();
   return pathVal.toLowerCase() === selectedCategory.toLowerCase();
  };
  if (selectedCategory) {
   const itemsInCategory = items.filter((item) =>
    (item.path || []).some(categorySegmentMatch)
   );

   const slugsFromCategory = Array.isArray(categoryVariantSlugs) ? categoryVariantSlugs : [];
   const brandSlugs = ["brands", "brand", "manufacturer"];
   const modelSlugs = ["brands_model", "brand_model", "model"];
   const hasBrandInData = itemsInCategory.some((item) =>
    (item.path || []).some((seg) => seg.startsWith("brands:") || seg.startsWith("brand:") || seg.startsWith("manufacturer:"))
   );
   const hasModelInData = itemsInCategory.some((item) =>
    (item.path || []).some((seg) => seg.startsWith("brands_model:") || seg.startsWith("model:") || seg.startsWith("brand_model:"))
   );
   // Always show Brand then Model first when data has them; then other category variant attributes (no duplicate brand/model)
   const slugOrder: string[] = [];
   if (hasBrandInData) slugOrder.push("brands");
   if (hasModelInData) slugOrder.push("brands_model");
   for (const s of slugsFromCategory) {
    const lower = (s || "").toLowerCase();
    if (brandSlugs.includes(lower) || modelSlugs.includes(lower)) continue;
    if (!slugOrder.some((x) => (x || "").toLowerCase() === lower)) slugOrder.push(s);
   }

   const pathMatchesFilters = (path: string[], excludeSlug: string): boolean => {
    if (!path.some(categorySegmentMatch)) return false;
    for (const slug of slugOrder) {
     if (slug === excludeSlug) continue;
     const val = filters[slug];
     if (!val?.trim()) continue;
     if (!pathSegmentMatchesFilter(path, slug, val)) return false;
    }
    return true;
   };

   for (const slug of slugOrder) {
    const itemsMatchingOtherFilters = itemsInCategory.filter((item) =>
     pathMatchesFilters(item.path || [], slug)
    );
    const slugOrSynonym = (segSlug: string) =>
     segSlug === slug || SLUG_SYNONYMS[slug]?.includes(segSlug) === true;
    const values = new Set<string>();
    for (const item of itemsMatchingOtherFilters) {
     const path = item.path || [];
     for (const segment of path) {
      const s = (segment ?? "").trim();
      if (!s || !s.includes(":")) continue;
      const colon = s.indexOf(":");
      const segSlug = s.slice(0, colon).trim();
      const value = s.slice(colon + 1).trim();
      if (!slugOrSynonym(segSlug) || !value || OBJECT_ID_REGEX.test(value)) continue;
      values.add(value);
     }
    }
    const options = uniq([...values]);
    if (options.length > 0) {
     dimensions.push({ key: slug, label: formatSlugLabel(slug), options });
    }
   }
  }

  const legacy = {
   categories: categoryDimension.options,
   subCategories: [] as string[],
   manufacturers: dimensions.find((d) => d.key === "manufacturer" || d.key === "brands")?.options ?? [],
   models: dimensions.find((d) => d.key === "model" || d.key === "brands_model")?.options ?? [],
   grades: dimensions.find((d) => d.key === "grade" || d.key === "condition")?.options ?? [],
   capacities: dimensions.find((d) => d.key === "capacity" || d.key === "storage")?.options ?? [],
   colours: dimensions.find((d) => d.key === "colour" || d.key === "color")?.options ?? [],
  };

  return {
   dimensions,
   ...legacy,
  };
 }, [items, filters, categoryVariantSlugs]);

 const setFilter = useCallback((key: keyof StockListFilters, value: string) => {
  setFilters((prev) => {
   const next = { ...prev, [key]: value };
   if (key === "category") {
    Object.keys(next).forEach((k) => {
     if (k !== "category" && k !== "taxCategory" && k !== "search") next[k] = "";
    });
   } else if (key === "manufacturer" || key === "brands") {
    next.model = "";
    next.brands_model = "";
   }
   return next;
  });
 }, []);

 const clearFilters = useCallback(() => {
  setFilters(DEFAULT_FILTERS);
 }, []);

 const tree = useMemo(() => buildTree(filteredItems), [filteredItems]);

 const toggle = useCallback((pathKey: string) => {
  setExpanded((prev) => {
   const next = new Set(prev);
   if (next.has(pathKey)) next.delete(pathKey);
   else next.add(pathKey);
   return next;
  });
 }, []);

 const expandAll = useCallback(() => {
  const collectKeys = (nodes: TreeNode[]): string[] => {
   let keys: string[] = [];
   for (const node of nodes) {
    keys.push(node.pathKey);
    if (node.children.length) keys = keys.concat(collectKeys(node.children));
   }
   return keys;
  };
  setExpanded(new Set(collectKeys(tree)));
 }, [tree]);

 const collapseAll = useCallback(() => {
  setExpanded(new Set());
 }, []);

 const visibleRows = useMemo(
  () => flattenVisible(tree, expanded),
  [tree, expanded]
 );

 return {
  tree,
  visibleRows,
  isLoading,
  error,
  refetch: fetchStockList,
  expanded,
  toggle,
  expandAll,
  collapseAll,
  levelLabels: LEVEL_LABELS,
  filters,
  setFilter,
  clearFilters,
  filterOptions,
 };
}
