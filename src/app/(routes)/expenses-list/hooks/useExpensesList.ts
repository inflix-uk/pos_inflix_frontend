"use client";

import { useState, useCallback, useEffect } from "react";
import { expenseApi } from "../service/expenseApi";
import { expenseCategoryApi } from "../../expense-category/service/expenseCategoryApi";
import type { Expense, ExpenseFilters } from "../types";
import type { ExpenseCategory } from "../../expense-category/types";

export function useExpensesList() {
 const [expenses, setExpenses] = useState<Expense[]>([]);
 const [categories, setCategories] = useState<ExpenseCategory[]>([]);
 const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
 const [loading, setLoading] = useState(true);
 const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
 const [filters, setFilters] = useState<ExpenseFilters>({ page: 1, limit: 25 });
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
 const [deleteLoading, setDeleteLoading] = useState(false);

 const loadCategories = useCallback(async () => {
  try {
   const data = await expenseCategoryApi.getAll(true);
   setCategories(data);
  } catch {
   // ignore
  }
 }, []);

 const load = useCallback(async () => {
  setLoading(true);
  try {
   const res = await expenseApi.list(filters);
   setExpenses(res.data);
   setPagination(res.pagination);
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to load", type: "error" });
  } finally {
   setLoading(false);
  }
 }, [filters]);

 useEffect(() => {
  loadCategories();
 }, [loadCategories]);
 useEffect(() => {
  load();
 }, [load]);

 const setFilter = useCallback(<K extends keyof ExpenseFilters>(key: K, value: ExpenseFilters[K]) => {
  setFilters((f) => ({ ...f, [key]: value, page: 1 }));
 }, []);

 const setPage = useCallback((page: number) => {
  setFilters((f) => ({ ...f, page }));
 }, []);

 const refresh = useCallback(() => {
  load();
 }, [load]);

 const openDeleteModal = useCallback((expense: Expense) => {
  setExpenseToDelete(expense);
  setDeleteModalOpen(true);
 }, []);

 const closeDeleteModal = useCallback(() => {
  setDeleteModalOpen(false);
  setExpenseToDelete(null);
 }, []);

 const deleteExpense = useCallback(
  async (id: string) => {
   setDeleteLoading(true);
   try {
    await expenseApi.delete(id);
    setMessage({ text: "Expense deleted successfully", type: "success" });
    closeDeleteModal();
    load();
   } catch (e) {
    setMessage({ text: e instanceof Error ? e.message : "Failed to delete expense", type: "error" });
   } finally {
    setDeleteLoading(false);
   }
  },
  [closeDeleteModal, load]
 );

 return {
  expenses,
  categories,
  pagination,
  loading,
  message,
  setMessage,
  filters,
  setFilter,
  setPage,
  refresh,
  deleteModalOpen,
  expenseToDelete,
  openDeleteModal,
  closeDeleteModal,
  deleteExpense,
  deleteLoading,
 };
}
