"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Tags, Plus, Loader2, Pencil, Trash2, ExternalLink } from "lucide-react";
import { pricingGroupsApi, type PricingGroupRecord } from "./service/pricingGroupsApi";

type GroupWithCounts = PricingGroupRecord & { customerCount?: number; productPriceCount?: number };

export default function PricingGroupsPage() {
 const [groups, setGroups] = useState<GroupWithCounts[]>([]);
 const [loading, setLoading] = useState(true);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
 const [createOpen, setCreateOpen] = useState(false);
 const [createName, setCreateName] = useState("");
 const [createSaving, setCreateSaving] = useState(false);
 const [editId, setEditId] = useState<string | null>(null);
 const [editName, setEditName] = useState("");
 const [editSaving, setEditSaving] = useState(false);
 const [deleteId, setDeleteId] = useState<string | null>(null);
 const [deleteConfirm, setDeleteConfirm] = useState(false);
 const [deleteSaving, setDeleteSaving] = useState(false);

 const load = useCallback(async () => {
 setLoading(true);
 try {
 const res = await pricingGroupsApi.getList(true);
 if (res.success && Array.isArray(res.data)) setGroups(res.data);
 else setGroups([]);
 } catch {
 setGroups([]);
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 load();
 }, [load]);

 const showMsg = (type: "success" | "error", text: string) => {
 setMessage({ type, text });
 setTimeout(() => setMessage(null), 3000);
 };

 const handleCreate = async () => {
 const name = createName.trim();
 if (!name) {
 showMsg("error", "Group name is required");
 return;
 }
 setCreateSaving(true);
 try {
 const res = await pricingGroupsApi.create(name);
 if (res.success) {
 setCreateOpen(false);
 setCreateName("");
 await load();
 showMsg("success", "Pricing group created");
 } else {
 showMsg("error", res.message || "Failed to create");
 }
 } catch {
 showMsg("error", "Failed to create");
 } finally {
 setCreateSaving(false);
 }
 };

 const openEdit = (g: GroupWithCounts) => {
 setEditId(g._id);
 setEditName(g.name);
 };

 const handleEdit = async () => {
 if (!editId) return;
 const name = editName.trim();
 if (!name) {
 showMsg("error", "Group name is required");
 return;
 }
 setEditSaving(true);
 try {
 const res = await pricingGroupsApi.update(editId, name);
 if (res.success) {
 setEditId(null);
 await load();
 showMsg("success", "Group updated");
 } else {
 showMsg("error", res.message || "Failed to update");
 }
 } catch {
 showMsg("error", "Failed to update");
 } finally {
 setEditSaving(false);
 }
 };

 const openDelete = (id: string) => {
 setDeleteId(id);
 setDeleteConfirm(false);
 };

 const handleDelete = async () => {
 if (!deleteId) return;
 setDeleteSaving(true);
 try {
 const res = await pricingGroupsApi.delete(deleteId);
 if (res.success) {
 setDeleteId(null);
 await load();
 showMsg("success", "Pricing group deleted. Customers were unassigned and group prices removed.");
 } else {
 showMsg("error", res.message || "Failed to delete");
 }
 } catch {
 showMsg("error", "Failed to delete");
 } finally {
 setDeleteSaving(false);
 }
 };

 return (
 <div className="@container min-h-screen bg-gray-50 p-2 @[640px]:p-3 @[768px]:p-4 @[1024px]:p-6">
 {message && (
 <div
  className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow ${
  message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }`}
 >
  {message.text}
 </div>
 )}

 <div className="max-w-4xl mx-auto">
 <div className="flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-3 @[640px]:gap-4 mb-4 @[640px]:mb-5 @[768px]:mb-6">
  <h1 className="text-base @[640px]:text-lg @[768px]:text-xl font-semibold text-gray-900 flex items-center gap-2">
  <Tags className="h-5 w-5 @[640px]:h-6 @[640px]:w-6 text-orange-500" />
  Pricing Groups
  </h1>
  <button
  type="button"
  onClick={() => setCreateOpen(true)}
  className="inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-xs @[640px]:text-sm font-medium"
  >
  <Plus className="h-4 w-4" />
  Create Group
  </button>
 </div>

 <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  {loading ? (
  <div className="p-8 @[640px]:p-10 @[768px]:p-12 flex items-center justify-center gap-2 text-gray-500">
  <Loader2 className="h-5 w-5 animate-spin" />
  Loading…
  </div>
  ) : groups.length === 0 ? (
  <div className="p-8 @[640px]:p-10 @[768px]:p-12 text-center text-gray-500">
  <Tags className="h-10 w-10 @[640px]:h-12 @[640px]:w-12 mx-auto mb-2 @[640px]:mb-3 text-gray-300" />
  <p className="font-medium text-xs @[640px]:text-sm @[768px]:text-base">No pricing groups yet</p>
  <p className="text-xs @[640px]:text-sm mt-1">Create a group to set customer-specific prices and assign customers.</p>
  <button
  type="button"
  onClick={() => setCreateOpen(true)}
  className="mt-3 @[640px]:mt-4 inline-flex items-center gap-1.5 @[640px]:gap-2 px-3 @[640px]:px-4 py-1.5 @[640px]:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-xs @[640px]:text-sm"
  >
  <Plus className="h-4 w-4" />
  Create Group
  </button>
  </div>
  ) : (
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
   <tr>
   <th className="text-left py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-700">Name</th>
   <th className="text-left py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-700">Customers</th>
   <th className="text-left py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-700">Products with price</th>
   <th className="text-right py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-700">Actions</th>
   </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
   {groups.map((g) => (
   <tr key={g._id} className="hover:bg-gray-50">
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm font-medium text-gray-900">{g.name}</td>
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm text-gray-600">{g.customerCount ?? 0}</td>
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-xs @[640px]:text-sm text-gray-600">{g.productPriceCount ?? 0}</td>
   <td className="py-2.5 @[640px]:py-3 px-3 @[640px]:px-4 text-right">
   <div className="flex items-center justify-end gap-1.5 @[640px]:gap-2">
    <Link
    href={`/pricing-groups/${g._id}`}
    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs @[640px]:text-sm text-orange-600 hover:bg-orange-50 rounded"
    >
    <ExternalLink className="h-4 w-4" />
    Open
    </Link>
    <button
    type="button"
    onClick={() => openEdit(g)}
    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
    aria-label="Edit"
    >
    <Pencil className="h-4 w-4" />
    </button>
    <button
    type="button"
    onClick={() => openDelete(g._id)}
    className="p-1.5 text-gray-500 hover:bg-red-50 text-red-600 rounded"
    aria-label="Delete"
    >
    <Trash2 className="h-4 w-4" />
    </button>
   </div>
   </td>
   </tr>
   ))}
  </tbody>
  </table>
  </div>
  )}
 </div>
 </div>

 {/* Create modal */}
 {createOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
  <h2 className="text-lg font-semibold mb-4">Create pricing group</h2>
  <input
  type="text"
  value={createName}
  onChange={(e) => setCreateName(e.target.value)}
  placeholder="Group name (e.g. Wholesale)"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
  autoFocus
  />
  <div className="flex justify-end gap-2">
  <button type="button" onClick={() => { setCreateOpen(false); setCreateName(""); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
  Cancel
  </button>
  <button type="button" onClick={handleCreate} disabled={createSaving} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
  {createSaving ? "Creating…" : "Create"}
  </button>
  </div>
  </div>
 </div>
 )}

 {/* Edit modal */}
 {editId && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
  <h2 className="text-lg font-semibold mb-4">Edit group name</h2>
  <input
  type="text"
  value={editName}
  onChange={(e) => setEditName(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
  autoFocus
  />
  <div className="flex justify-end gap-2">
  <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
  Cancel
  </button>
  <button type="button" onClick={handleEdit} disabled={editSaving} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
  {editSaving ? "Saving…" : "Save"}
  </button>
  </div>
  </div>
 </div>
 )}

 {/* Delete confirm */}
 {deleteId && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete pricing group?</h2>
  <p className="text-sm text-gray-600 mb-4">
  Customers in this group will be unassigned and all group-specific product prices for this group will be removed. The group will be deleted.
  </p>
  <label className="flex items-center gap-2 mb-4">
  <input type="checkbox" checked={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.checked)} className="rounded border-gray-300" />
  <span className="text-sm">I understand</span>
  </label>
  <div className="flex justify-end gap-2">
  <button type="button" onClick={() => { setDeleteId(null); setDeleteConfirm(false); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
  Cancel
  </button>
  <button type="button" onClick={handleDelete} disabled={!deleteConfirm || deleteSaving} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
  {deleteSaving ? "Deleting…" : "Delete"}
  </button>
  </div>
  </div>
 </div>
 )}
 </div>
 );
}
