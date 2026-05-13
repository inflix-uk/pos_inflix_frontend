"use client";

import React from "react";
import { useStock } from "./hooks/useStock";
import {
 StockHeader,
 StockFilters,
 StockTable,
 Pagination,
 AddStockModal,
 EditStockModal,
 DeleteStockModal,
} from "./components";

const ManageStockPage = () => {
 const {
 searchTerm,
 selectedWarehouse,
 selectedStore,
 selectedProduct,
 showWarehouseDropdown,
 showStoreDropdown,
 showProductDropdown,
 currentPage,
 rowsPerPage,
 selectedStocks,
 selectAll,
 isLoading,
 message,
 showAddModal,
 showEditModal,
 showDeleteModal,
 selectedStock,
 warehouses,
 stores,
 products,
 people,
 productList,
 currentStocks,
 totalPages,
 handleSearchChange,
 handleWarehouseChange,
 handleStoreChange,
 handleProductChange,
 handlePageChange,
 handleRowsPerPageChange,
 handleSelectAll,
 handleSelectStock,
 toggleWarehouseDropdown,
 toggleStoreDropdown,
 toggleProductDropdown,
 openAddModal,
 closeAddModal,
 openEditModal,
 closeEditModal,
 openDeleteModal,
 closeDeleteModal,
 handleAddStock,
 handleUpdateStock,
 handleDeleteStock,
 setMessage,
 } = useStock();

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <StockHeader onAddClick={openAddModal} />

 {message && (
 <div
  className={`mb-4 p-4 rounded-lg ${
  message.type === "success"
  ? "bg-green-100 text-green-800"
  : "bg-red-100 text-red-800"
  }`}
 >
  <div className="flex justify-between items-center">
  <span>{message.text}</span>
  <button
  onClick={() => setMessage(null)}
  className="text-lg font-bold"
  >
  ×
  </button>
  </div>
 </div>
 )}

 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
 <div className="p-6">
  <StockFilters
  searchTerm={searchTerm}
  selectedWarehouse={selectedWarehouse}
  selectedStore={selectedStore}
  selectedProduct={selectedProduct}
  showWarehouseDropdown={showWarehouseDropdown}
  showStoreDropdown={showStoreDropdown}
  showProductDropdown={showProductDropdown}
  warehouses={warehouses}
  stores={stores}
  products={products}
  onSearchChange={handleSearchChange}
  onWarehouseChange={handleWarehouseChange}
  onStoreChange={handleStoreChange}
  onProductChange={handleProductChange}
  onToggleWarehouseDropdown={toggleWarehouseDropdown}
  onToggleStoreDropdown={toggleStoreDropdown}
  onToggleProductDropdown={toggleProductDropdown}
  />
 </div>

 {isLoading ? (
  <div className="flex justify-center items-center py-12">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
  </div>
 ) : (
  <StockTable
  stocks={currentStocks}
  selectedStocks={selectedStocks}
  selectAll={selectAll}
  onSelectAll={handleSelectAll}
  onSelectStock={handleSelectStock}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
  />
 )}

 <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  rowsPerPage={rowsPerPage}
  onPageChange={handlePageChange}
  onRowsPerPageChange={handleRowsPerPageChange}
 />
 </div>

 <AddStockModal
 open={showAddModal}
 onClose={closeAddModal}
 onAdd={handleAddStock}
 warehouses={warehouses}
 stores={stores}
 people={people}
 products={products}
 />

 <EditStockModal
 open={showEditModal}
 onClose={closeEditModal}
 onSave={handleUpdateStock}
 stock={selectedStock ? {
  warehouse: selectedStock.warehouse,
  store: selectedStock.store,
  person: selectedStock.person.name,
  product: selectedStock.product.name,
  qty: selectedStock.qty,
 } : null}
 warehouses={warehouses}
 stores={stores}
 people={people}
 products={productList}
 />

 <DeleteStockModal
 open={showDeleteModal}
 onClose={closeDeleteModal}
 onDelete={handleDeleteStock}
 stock={selectedStock}
 />
 </div>
 );
};

export default ManageStockPage;
