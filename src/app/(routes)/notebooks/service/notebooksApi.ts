const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function parseJson<T>(res: Response): Promise<{ success: boolean; data?: T; message?: string }> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, message: (json as { message?: string }).message || res.statusText };
  }
  return json as { success: boolean; data?: T; message?: string };
}

export type Notebook = {
  _id: string;
  name: string;
  color: string;
  noteCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type NoteListItem = {
  _id: string;
  notebookId: string;
  title: string;
  color: string;
  snippet: string;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  _id: string;
  notebookId: string;
  title: string;
  bodyHtml: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export const NOTEBOOK_COLORS = [
  "orange",
  "amber",
  "green",
  "emerald",
  "sky",
  "blue",
  "violet",
  "purple",
  "rose",
  "slate",
] as const;

export const NOTE_TAG_COLORS = [
  "orange",
  "red",
  "sky",
  "blue",
  "green",
  "emerald",
  "violet",
  "purple",
  "amber",
  "rose",
] as const;

export const notebooksApi = {
  listNotebooks: async (): Promise<{ success: boolean; data?: Notebook[]; message?: string }> => {
    const res = await fetch(`${API_URL}/api/notebooks`, { headers: getAuthHeaders() });
    return parseJson<Notebook[]>(res);
  },

  createNotebook: async (payload: {
    name: string;
    color?: string;
  }): Promise<{ success: boolean; data?: Notebook; message?: string }> => {
    const res = await fetch(`${API_URL}/api/notebooks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return parseJson<Notebook>(res);
  },

  updateNotebook: async (
    id: string,
    payload: { name?: string; color?: string }
  ): Promise<{ success: boolean; data?: Notebook; message?: string }> => {
    const res = await fetch(`${API_URL}/api/notebooks/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return parseJson<Notebook>(res);
  },

  deleteNotebook: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await fetch(`${API_URL}/api/notebooks/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return parseJson(res);
  },

  listNotes: async (
    notebookId: string,
    q?: string
  ): Promise<{ success: boolean; data?: NoteListItem[]; message?: string }> => {
    const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    const res = await fetch(`${API_URL}/api/notebooks/${notebookId}/notes${params}`, {
      headers: getAuthHeaders(),
    });
    return parseJson<NoteListItem[]>(res);
  },

  createNote: async (
    notebookId: string,
    payload?: { title?: string; bodyHtml?: string; color?: string }
  ): Promise<{ success: boolean; data?: Note; message?: string }> => {
    const res = await fetch(`${API_URL}/api/notebooks/${notebookId}/notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload ?? {}),
    });
    return parseJson<Note>(res);
  },

  getNote: async (id: string): Promise<{ success: boolean; data?: Note; message?: string }> => {
    const res = await fetch(`${API_URL}/api/notes/${id}`, { headers: getAuthHeaders() });
    return parseJson<Note>(res);
  },

  updateNote: async (
    id: string,
    payload: { title?: string; bodyHtml?: string; color?: string; notebookId?: string }
  ): Promise<{ success: boolean; data?: Note; message?: string }> => {
    const res = await fetch(`${API_URL}/api/notes/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return parseJson<Note>(res);
  },

  deleteNote: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await fetch(`${API_URL}/api/notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return parseJson(res);
  },
};
