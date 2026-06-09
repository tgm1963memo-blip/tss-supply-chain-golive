import React, { useState } from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function BranchStockPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="Consignment Branch Stock"
        description="Monitor inventory levels at consignment branches and modern trade locations."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />
      <Alert variant="warning">
        This module operates in Safe Mode. View current branch stock levels only. Branch stock adjustments and transfers back to Express are disabled.
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Active Branches</div>
          <div className="text-2xl font-bold mt-1">142</div>
        </div>
        <div className="card p-4 border-l-4 border-l-brand-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Value (Consigned)</div>
          <div className="text-2xl font-bold mt-1">8.4M <span className="text-sm font-normal text-gray-500">THB</span></div>
        </div>
        <div className="card p-4 border-l-4 border-l-yellow-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Low Stock Branches</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">18</div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Pending Reconcile</div>
          <div className="text-2xl font-bold mt-1 text-red-600">5</div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-2 items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-700">Branch Inventory</h3>
          <div className="flex gap-2">
            <select className="tgm-input text-sm">
              <option value="">All Branches</option>
              <option value="B001">Lotus - Rama 4</option>
              <option value="B002">Big C - Ratchada</option>
              <option value="B003">Tops - Central World</option>
            </select>
            <input 
              type="text" 
              className="tgm-input text-sm w-64" 
              placeholder="Search SKU..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-secondary">Filter</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Branch</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th className="text-right">Balance Qty</th>
                <th className="text-right">Min Qty</th>
                <th className="text-right">Max Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lotus - Rama 4</td>
                <td className="font-mono text-brand-600">FG-00100</td>
                <td>Thai Sausage Premium 500g</td>
                <td className="text-right font-semibold">45.00</td>
                <td className="text-right text-gray-500">20.00</td>
                <td className="text-right text-gray-500">100.00</td>
                <td><Badge type="success">Normal</Badge></td>
              </tr>
              <tr>
                <td>Lotus - Rama 4</td>
                <td className="font-mono text-brand-600">FG-00105</td>
                <td>Vienna Sausage 1kg</td>
                <td className="text-right font-semibold text-red-500">5.00</td>
                <td className="text-right text-gray-500">15.00</td>
                <td className="text-right text-gray-500">50.00</td>
                <td><Badge type="danger">Low Stock</Badge></td>
              </tr>
              <tr>
                <td>Big C - Ratchada</td>
                <td className="font-mono text-brand-600">FG-00100</td>
                <td>Thai Sausage Premium 500g</td>
                <td className="text-right font-semibold">85.00</td>
                <td className="text-right text-gray-500">30.00</td>
                <td className="text-right text-gray-500">100.00</td>
                <td><Badge type="success">Normal</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
