import React, { useState } from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function StockBalancePage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="Stock Balance"
        description="Warehouse inventory snapshot."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />
      <Alert variant="warning">
        This module operates in Safe Mode. View current stock levels only. Stock posting/adjustments back to Express are disabled.
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-brand-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Stock Value</div>
          <div className="text-2xl font-bold mt-1">12.5M <span className="text-sm font-normal text-gray-500">THB</span></div>
        </div>
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Items</div>
          <div className="text-2xl font-bold mt-1">45,120 <span className="text-sm font-normal text-gray-500">kg</span></div>
        </div>
        <div className="card p-4 border-l-4 border-l-green-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">In Good Condition</div>
          <div className="text-2xl font-bold mt-1 text-green-600">98.5%</div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Expired / Hold</div>
          <div className="text-2xl font-bold mt-1 text-red-600">675 <span className="text-sm font-normal text-red-400">kg</span></div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-2 items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-700">Inventory Ledger</h3>
          <div className="flex gap-2">
            <select className="tgm-input text-sm">
              <option value="">All Warehouses</option>
              <option value="WH01">WH01 - Main Storage</option>
              <option value="WH02">WH02 - Cold Room A</option>
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
                <th>Warehouse/Location</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Lot / Batch</th>
                <th className="text-right">Quantity</th>
                <th>UOM</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>WH02 / R01-A1</td>
                <td className="font-mono text-brand-600">FG-00100</td>
                <td>Thai Sausage Premium 500g</td>
                <td className="font-mono">LOT-2410-001</td>
                <td className="text-right font-semibold">1,200.00</td>
                <td>KG</td>
                <td><Badge type="success">Available</Badge></td>
              </tr>
              <tr>
                <td>WH02 / R01-B2</td>
                <td className="font-mono text-brand-600">FG-00105</td>
                <td>Vienna Sausage 1kg</td>
                <td className="font-mono">LOT-2409-045</td>
                <td className="text-right font-semibold">500.00</td>
                <td>KG</td>
                <td><Badge type="success">Available</Badge></td>
              </tr>
              <tr>
                <td>WH01 / Q-HOLD</td>
                <td className="font-mono text-brand-600">FG-00210</td>
                <td>Bacon Sliced 250g</td>
                <td className="font-mono">LOT-2408-012</td>
                <td className="text-right font-semibold text-red-600">120.00</td>
                <td>KG</td>
                <td><Badge type="danger">Hold / Expired</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
