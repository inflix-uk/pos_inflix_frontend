"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  BookOpen,
  Pin,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import {
  notebooksApi,
  NOTEBOOK_COLORS,
  NOTE_TAG_COLORS,
  type Notebook,
  type Note,
  type NoteListItem,
} from "./service/notebooksApi";

const COLOR_DOT: Record<string, string> = {
  orange: "bg-orange-500",
  amber: "bg-amber-400",
  green: "bg-green-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-400",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  rose: "bg-rose-500",
  red: "bg-red-500",
  slate: "bg-slate-500",
};

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function dateGroupLabel(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
}

/** Run a contentEditable command with focus/selection restored so list buttons work. */
function runEditorCommand(editor: HTMLDivElement | null, cmd: string, value?: string) {
  if (!editor) return;
  editor.focus();
  const sel = window.getSelection();
  const selectionInEditor =
    sel &&
    sel.rangeCount > 0 &&
    sel.anchorNode &&
    (editor === sel.anchorNode || editor.contains(sel.anchorNode));
  if (!selectionInEditor) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
  // Ensure there is editable content for list commands (empty editor → insert a paragraph first).
  if ((cmd === "insertUnorderedList" || cmd === "insertOrderedList") && !editor.textContent?.trim()) {
    document.execCommand("insertHTML", false, "<div><br></div>");
  }
  try {
    if (cmd === "formatBlock" && value) {
      // Browsers differ on tag form; try both.
      const ok = document.execCommand(cmd, false, value);
      if (!ok) document.execCommand(cmd, false, `<${value.toLowerCase()}>`);
    } else {
      document.execCommand(cmd, false, value);
    }
  } catch {
    // ignore unsupported commands
  }
  // Notify React so autosave picks up list markup.
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [search, setSearch] = useState("");
  const [loadingNotebooks, setLoadingNotebooks] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [createNotebookOpen, setCreateNotebookOpen] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [newNotebookColor, setNewNotebookColor] = useState<string>("sky");
  const [creatingNotebook, setCreatingNotebook] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<
    null | { type: "notebook"; id: string; name: string } | { type: "note"; id: string; title: string }
  >(null);
  const [deleting, setDeleting] = useState(false);
  const newNotebookInputRef = useRef<HTMLInputElement>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeNoteIdRef = useRef<string | null>(null);
  const skipBodySyncRef = useRef(false);

  activeNoteIdRef.current = activeNote?._id ?? null;

  const selectedNotebook = useMemo(
    () => notebooks.find((n) => n._id === selectedNotebookId) ?? null,
    [notebooks, selectedNotebookId]
  );

  const loadNotebooks = useCallback(async (preferId?: string | null) => {
    setLoadingNotebooks(true);
    setError(null);
    const res = await notebooksApi.listNotebooks();
    setLoadingNotebooks(false);
    if (!res.success || !res.data) {
      setError(res.message || "Failed to load notebooks");
      return;
    }
    setNotebooks(res.data);
    const nextId =
      (preferId && res.data.some((n) => n._id === preferId) && preferId) ||
      (selectedNotebookId && res.data.some((n) => n._id === selectedNotebookId) && selectedNotebookId) ||
      res.data[0]?._id ||
      null;
    setSelectedNotebookId(nextId);
  }, [selectedNotebookId]);

  const loadNotes = useCallback(async (notebookId: string, q?: string) => {
    setLoadingNotes(true);
    const res = await notebooksApi.listNotes(notebookId, q);
    setLoadingNotes(false);
    if (!res.success || !res.data) {
      setNotes([]);
      return;
    }
    setNotes(res.data);
  }, []);

  useEffect(() => {
    void loadNotebooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial mount only
  }, []);

  useEffect(() => {
    if (!selectedNotebookId) {
      setNotes([]);
      setSelectedNoteId(null);
      setActiveNote(null);
      return;
    }
    void loadNotes(selectedNotebookId, search);
  }, [selectedNotebookId, search, loadNotes]);

  useEffect(() => {
    if (!selectedNoteId) {
      setActiveNote(null);
      return;
    }
    let cancelled = false;
    setLoadingNote(true);
    void notebooksApi.getNote(selectedNoteId).then((res) => {
      if (cancelled) return;
      setLoadingNote(false);
      if (res.success && res.data) {
        skipBodySyncRef.current = false;
        setActiveNote(res.data);
        setSaveStatus("idle");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedNoteId]);

  useEffect(() => {
    if (!activeNote || !bodyRef.current) return;
    if (skipBodySyncRef.current) return;
    if (bodyRef.current.innerHTML !== (activeNote.bodyHtml || "")) {
      bodyRef.current.innerHTML = activeNote.bodyHtml || "";
    }
  }, [activeNote]);

  const scheduleSave = useCallback(
    (patch: { title?: string; bodyHtml?: string; color?: string }) => {
      if (!activeNoteIdRef.current) return;
      const id = activeNoteIdRef.current;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(async () => {
        const res = await notebooksApi.updateNote(id, patch);
        if (!res.success || !res.data) {
          setSaveStatus("error");
          return;
        }
        setActiveNote(res.data);
        setSaveStatus("saved");
        setNotes((prev) =>
          prev.map((n) =>
            n._id === res.data!._id
              ? {
                  ...n,
                  title: res.data!.title,
                  color: res.data!.color,
                  snippet: (res.data!.bodyHtml || "")
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 140),
                  updatedAt: res.data!.updatedAt,
                }
              : n
          )
        );
      }, 600);
    },
    []
  );

  const handleTitleChange = (value: string) => {
    if (!activeNote) return;
    skipBodySyncRef.current = true;
    setActiveNote({ ...activeNote, title: value });
    scheduleSave({ title: value });
  };

  const handleBodyInput = () => {
    if (!activeNote || !bodyRef.current) return;
    skipBodySyncRef.current = true;
    const bodyHtml = bodyRef.current.innerHTML;
    setActiveNote({ ...activeNote, bodyHtml });
    scheduleSave({ bodyHtml });
  };

  const handleColorTag = (color: string) => {
    if (!activeNote) return;
    const next = activeNote.color === color ? "" : color;
    skipBodySyncRef.current = true;
    setActiveNote({ ...activeNote, color: next });
    scheduleSave({ color: next });
  };

  const openCreateNotebook = () => {
    setNewNotebookName("");
    setNewNotebookColor(NOTEBOOK_COLORS[notebooks.length % NOTEBOOK_COLORS.length]);
    setCreateNotebookOpen(true);
    setTimeout(() => newNotebookInputRef.current?.focus(), 50);
  };

  const handleCreateNotebook = async () => {
    const name = newNotebookName.trim();
    if (!name || creatingNotebook) return;
    setCreatingNotebook(true);
    setError(null);
    const res = await notebooksApi.createNotebook({ name, color: newNotebookColor });
    setCreatingNotebook(false);
    if (!res.success || !res.data) {
      setError(res.message || "Failed to create notebook");
      return;
    }
    setCreateNotebookOpen(false);
    setNewNotebookName("");
    await loadNotebooks(res.data._id);
  };

  const commitRename = async (id: string) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    const res = await notebooksApi.updateNotebook(id, { name });
    if (res.success) await loadNotebooks(selectedNotebookId);
  };

  const requestDeleteNotebook = (id: string, name: string) => {
    if (notebooks.length <= 1) return;
    setConfirmDelete({ type: "notebook", id, name });
  };

  const requestDeleteNote = () => {
    if (!activeNote) return;
    setConfirmDelete({ type: "note", id: activeNote._id, title: activeNote.title || "Untitled" });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    setError(null);
    if (confirmDelete.type === "notebook") {
      const res = await notebooksApi.deleteNotebook(confirmDelete.id);
      setDeleting(false);
      if (!res.success) {
        setError(res.message || "Failed to delete notebook");
        return;
      }
      setConfirmDelete(null);
      setSelectedNoteId(null);
      setActiveNote(null);
      await loadNotebooks(null);
      return;
    }
    const res = await notebooksApi.deleteNote(confirmDelete.id);
    setDeleting(false);
    if (!res.success) {
      setError(res.message || "Failed to delete note");
      return;
    }
    setConfirmDelete(null);
    setSelectedNoteId(null);
    setActiveNote(null);
    if (selectedNotebookId) {
      await loadNotes(selectedNotebookId, search);
      await loadNotebooks(selectedNotebookId);
    }
  };

  const handleCreateNote = async () => {
    if (!selectedNotebookId) return;
    const res = await notebooksApi.createNote(selectedNotebookId, { title: "Untitled" });
    if (!res.success || !res.data) {
      setError(res.message || "Failed to create note");
      return;
    }
    await loadNotes(selectedNotebookId, search);
    await loadNotebooks(selectedNotebookId);
    setSelectedNoteId(res.data._id);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const togglePinNotebook = async (nb: Notebook, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !nb.pinned;
    setNotebooks((prev) =>
      [...prev.map((n) => (n._id === nb._id ? { ...n, pinned: next } : n))].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
    );
    const res = await notebooksApi.updateNotebook(nb._id, { pinned: next });
    if (!res.success) {
      setError(res.message || "Failed to update pin");
      await loadNotebooks(selectedNotebookId);
    }
  };

  const togglePinNote = async (noteId: string, currentlyPinned: boolean) => {
    const next = !currentlyPinned;
    setNotes((prev) =>
      [...prev.map((n) => (n._id === noteId ? { ...n, pinned: next } : n))].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
    );
    if (activeNote?._id === noteId) {
      setActiveNote({ ...activeNote, pinned: next });
    }
    const res = await notebooksApi.updateNote(noteId, { pinned: next });
    if (!res.success) {
      setError(res.message || "Failed to update pin");
      if (selectedNotebookId) await loadNotes(selectedNotebookId, search);
      return;
    }
    if (res.data && activeNote?._id === noteId) setActiveNote(res.data);
  };

  const notesByDate = useMemo(() => {
    const pinned = notes.filter((n) => n.pinned);
    const unpinned = notes.filter((n) => !n.pinned);
    const groups: { label: string; items: NoteListItem[] }[] = [];
    if (pinned.length > 0) {
      groups.push({ label: "PINNED", items: pinned });
    }
    const map = new Map<string, NoteListItem[]>();
    for (const n of unpinned) {
      const label = dateGroupLabel(n.updatedAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    for (const [label, items] of map) {
      groups.push({ label, items });
    }
    return groups;
  }, [notes]);

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[480px] bg-white border-t border-gray-200">
      {/* Notebooks column */}
      <aside className="w-[220px] shrink-0 border-r border-gray-200 flex flex-col bg-slate-50/80">
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-slate-800">Notebooks</h2>
          <button
            type="button"
            onClick={openCreateNotebook}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200/80"
            aria-label="Add notebook"
            title="Add notebook"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loadingNotebooks ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            notebooks.map((nb) => {
              const active = nb._id === selectedNotebookId;
              return (
                <div
                  key={nb._id}
                  className={`group mx-2 mb-0.5 rounded-lg px-2.5 py-2 cursor-pointer ${
                    active ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-white/70"
                  }`}
                  onClick={() => {
                    setError(null);
                    setSelectedNotebookId(nb._id);
                    setSelectedNoteId(null);
                    setActiveNote(null);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${COLOR_DOT[nb.color] || "bg-sky-400"}`}
                    />
                    <div className="min-w-0 flex-1">
                      {renamingId === nb._id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => void commitRename(nb._id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void commitRename(nb._id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-sm font-medium border border-blue-300 rounded px-1 py-0.5"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-900 truncate">{nb.name}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        {nb.noteCount} note{nb.noteCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    {active && (
                      <div
                        className={`flex items-center gap-0.5 transition-opacity ${
                          nb.pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <button
                          type="button"
                          className={`p-1 rounded hover:bg-slate-100 ${
                            nb.pinned ? "text-amber-600 opacity-100" : "text-slate-500"
                          }`}
                          aria-label={nb.pinned ? "Unpin notebook" : "Pin notebook"}
                          title={nb.pinned ? "Unpin" : "Pin"}
                          onClick={(e) => void togglePinNotebook(nb, e)}
                        >
                          <Pin className={`h-3.5 w-3.5 ${nb.pinned ? "fill-amber-500" : ""}`} />
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded text-slate-500 hover:bg-slate-100"
                          aria-label="Rename notebook"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingId(nb._id);
                            setRenameValue(nb.name);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {notebooks.length > 1 && (
                        <button
                          type="button"
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                          aria-label="Delete notebook"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDeleteNotebook(nb._id, nb.name);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        )}
                      </div>
                    )}
                    {!active && nb.pinned && (
                      <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 mt-1" aria-label="Pinned" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Notes column */}
      <aside className="w-[280px] shrink-0 border-r border-gray-200 flex flex-col bg-white">
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                COLOR_DOT[selectedNotebook?.color || ""] || "bg-orange-400"
              }`}
            />
            <h2 className="text-sm font-semibold text-slate-800 truncate">Notes</h2>
          </div>
          <button
            type="button"
            onClick={() => void handleCreateNote()}
            disabled={!selectedNotebookId}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Note
          </button>
        </div>
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-slate-50 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingNotes ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              {selectedNotebookId ? "No notes yet. Create one." : "Select a notebook."}
            </div>
          ) : (
            notesByDate.map((group) => (
              <div key={group.label} className="px-2 py-2">
                <p className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-slate-400">
                  {group.label}
                </p>
                {group.items.map((n) => {
                  const active = n._id === selectedNoteId;
                  return (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSelectedNoteId(n._id);
                      }}
                      className={`group/note w-full text-left rounded-lg px-3 py-2.5 mb-1 border transition-colors ${
                        active
                          ? "border-blue-300 bg-blue-50/60 ring-1 ring-blue-200"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {n.title || "Untitled"}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            className={`p-0.5 rounded hover:bg-white/80 ${
                              n.pinned ? "text-amber-600" : "text-slate-400 opacity-0 group-hover/note:opacity-100"
                            }`}
                            aria-label={n.pinned ? "Unpin note" : "Pin note"}
                            title={n.pinned ? "Unpin" : "Pin"}
                            onClick={(e) => {
                              e.stopPropagation();
                              void togglePinNote(n._id, !!n.pinned);
                            }}
                          >
                            <Pin className={`h-3.5 w-3.5 ${n.pinned ? "fill-amber-500" : ""}`} />
                          </button>
                          {n.color ? (
                            <span className={`h-2 w-2 rounded-full ${COLOR_DOT[n.color] || "bg-slate-400"}`} />
                          ) : null}
                        </div>
                      </div>
                      {n.snippet ? (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.snippet}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-slate-400">{relativeTime(n.updatedAt)}</p>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Editor */}
      <main className="flex-1 min-w-0 flex flex-col bg-white">
        {error && (
          <div className="mx-4 mt-3 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-red-500 hover:text-red-800 font-semibold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}
        {!selectedNoteId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 px-6">
            <BookOpen className="h-10 w-10 opacity-40" />
            <p className="text-sm">Select or create a note to start writing</p>
          </div>
        ) : loadingNote && !activeNote ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : activeNote ? (
          <>
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5 flex-wrap">
                {NOTE_TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorTag(c)}
                    className={`h-5 w-5 rounded-full ${COLOR_DOT[c]} ring-offset-1 ${
                      activeNote.color === c ? "ring-2 ring-slate-700" : "hover:opacity-80"
                    }`}
                    aria-label={`Tag ${c}`}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                <button
                  type="button"
                  onClick={() => void togglePinNote(activeNote._id, !!activeNote.pinned)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium transition-colors ${
                    activeNote.pinned
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-gray-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  aria-label={activeNote.pinned ? "Unpin note" : "Pin note"}
                >
                  <Pin className={`h-3.5 w-3.5 ${activeNote.pinned ? "fill-amber-500" : ""}`} />
                  {activeNote.pinned ? "Pinned" : "Pin"}
                </button>
                <span>
                  {saveStatus === "saving"
                    ? "Saving…"
                    : saveStatus === "saved"
                      ? `Saved ${relativeTime(activeNote.updatedAt)}`
                      : saveStatus === "error"
                        ? "Save failed"
                        : `Saved ${relativeTime(activeNote.updatedAt)}`}
                </span>
                <button
                  type="button"
                  onClick={() => void requestDeleteNote()}
                  className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-6 pt-5 pb-2">
              <input
                ref={titleRef}
                type="text"
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled"
                className="w-full text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-300"
              />
            </div>

            <div className="px-4 pb-2">
              <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-gray-200 bg-slate-50 px-1.5 py-1">
                <ToolbarBtn title="Heading 1" onClick={() => runEditorCommand(bodyRef.current, "formatBlock", "H1")}>
                  <Heading1 className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn title="Heading 2" onClick={() => runEditorCommand(bodyRef.current, "formatBlock", "H2")}>
                  <Heading2 className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn title="Heading 3" onClick={() => runEditorCommand(bodyRef.current, "formatBlock", "H3")}>
                  <Heading3 className="h-4 w-4" />
                </ToolbarBtn>
                <Sep />
                <ToolbarBtn title="Bold" onClick={() => runEditorCommand(bodyRef.current, "bold")}>
                  <Bold className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn title="Italic" onClick={() => runEditorCommand(bodyRef.current, "italic")}>
                  <Italic className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn title="Underline" onClick={() => runEditorCommand(bodyRef.current, "underline")}>
                  <Underline className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn title="Strikethrough" onClick={() => runEditorCommand(bodyRef.current, "strikeThrough")}>
                  <Strikethrough className="h-4 w-4" />
                </ToolbarBtn>
                <Sep />
                <ToolbarBtn title="Align left" onClick={() => runEditorCommand(bodyRef.current, "justifyLeft")}>
                  <AlignLeft className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn title="Align center" onClick={() => runEditorCommand(bodyRef.current, "justifyCenter")}>
                  <AlignCenter className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn title="Align right" onClick={() => runEditorCommand(bodyRef.current, "justifyRight")}>
                  <AlignRight className="h-4 w-4" />
                </ToolbarBtn>
                <Sep />
                <ToolbarBtn title="Bullet list" onClick={() => runEditorCommand(bodyRef.current, "insertUnorderedList")}>
                  <List className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn title="Numbered list" onClick={() => runEditorCommand(bodyRef.current, "insertOrderedList")}>
                  <ListOrdered className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  title="Link"
                  onClick={() => {
                    const url = window.prompt("URL");
                    if (url) runEditorCommand(bodyRef.current, "createLink", url);
                  }}
                >
                  <LinkIcon className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn title="Clear formatting" onClick={() => runEditorCommand(bodyRef.current, "removeFormat")}>
                  <Eraser className="h-4 w-4" />
                </ToolbarBtn>
              </div>
            </div>

            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleBodyInput}
              className="flex-1 overflow-y-auto px-6 pb-8 text-sm text-slate-800 leading-relaxed outline-none prose prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-0.5 [&_li]:marker:text-slate-500"
              data-placeholder="Start writing…"
            />
          </>
        ) : null}
      </main>

      {createNotebookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => !creatingNotebook && setCreateNotebookOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-notebook-title"
            className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200 p-5"
          >
            <h3 id="create-notebook-title" className="text-lg font-semibold text-slate-900">
              New notebook
            </h3>
            <p className="mt-1 text-sm text-slate-500">Give it a name and colour so it’s easy to find.</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </label>
            <input
              ref={newNotebookInputRef}
              type="text"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreateNotebook();
                if (e.key === "Escape") setCreateNotebookOpen(false);
              }}
              placeholder="e.g. Daily Stock"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              maxLength={120}
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Colour</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {NOTEBOOK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewNotebookColor(c)}
                  className={`h-7 w-7 rounded-full ${COLOR_DOT[c]} ring-offset-2 ${
                    newNotebookColor === c ? "ring-2 ring-slate-800" : "hover:opacity-80"
                  }`}
                  aria-label={c}
                  title={c}
                />
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={creatingNotebook}
                onClick={() => setCreateNotebookOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creatingNotebook || !newNotebookName.trim()}
                onClick={() => void handleCreateNotebook()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {creatingNotebook ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => !deleting && setConfirmDelete(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {confirmDelete.type === "notebook" ? "Delete notebook?" : "Delete note?"}
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              {confirmDelete.type === "notebook" ? (
                <>
                  Delete <span className="font-semibold text-slate-900">{confirmDelete.name}</span> and all notes
                  inside it? This cannot be undone.
                </>
              ) : (
                <>
                  Delete <span className="font-semibold text-slate-900">{confirmDelete.title}</span>? This cannot be
                  undone.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleConfirmDelete()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="p-1.5 rounded text-slate-600 hover:bg-white hover:text-slate-900"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />;
}
