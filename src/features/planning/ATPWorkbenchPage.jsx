import React, { useState } from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function ATPWorkbenchPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="ATP Workbench"
        description="Available To Promise stock and reservation planning."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />
      <Alert variant="warning">
        This module operates in Safe Mode. You can view ATP calculations, but stock reservation and SO fulfillment are disabled.
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Stock</div>
          <div className="text-2xl font-bold mt-1">45,120 <span className="text-sm font-normal text-gray-500">kg</span></div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Reserved</div>
          <div className="text-2xl font-bold mt-1 text-red-600">12,400 <span className="text-sm font-normal text-red-400">kg</span></div>
        </div>
        <div className="card p-4 border-l-4 border-l-green-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">ATP Available</div>
          <div className="text-2xl font-bold mt-1 text-green-600">32,720 <span className="text-sm font-normal text-green-400">kg</span></div>
        </div>
        <div className="card p-4 border-l-4 border-l-yellow-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Pending PO</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">8,500 <span className="text-sm font-normal text-yellow-400">kg</span></div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-2 items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-700">ATP Inventory Items</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="tgm-input text-sm w-64" 
              placeholder="Search by SKU Code, Name..." 
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
                <th>SKU</th>
                <th>Name</th>
                <th className="text-right">Total Stock</th>
                <th className="text-right">Reserved</th>
                <th className="text-right">Incoming (PO)</th>
                <th className="text-right text-brand-700 font-bold">ATP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-brand-600">FG-00100</td>
                <td>Thai Sausage Premium 500g</td>
                <td className="text-right">1,200.00</td>
                <td className="text-right text-red-500">800.00</td>
                <td className="text-right text-blue-500">500.00</td>
                <td className="text-right font-bold text-brand-700">400.00</td>
                <td><Badge type="success">Available</Badge></td>
              </tr>
              <tr>
                <td className="font-mono text-brand-600">FG-00105</td>
                <td>Vienna Sausage 1kg</td>
                <td className="text-right">500.00</td>
                <td className="text-right text-red-500">450.00</td>
                <td className="text-right text-blue-500">0.00</td>
                <td className="text-right font-bold text-brand-700">50.00</td>
                <td><Badge type="warning">Low Stock</Badge></td>
              </tr>
              <tr>
                <td className="font-mono text-brand-600">FG-00210</td>
                <td>Bacon Sliced 250g</td>
                <td className="text-right">120.00</td>
                <td className="text-right text-red-500">120.00</td>
                <td className="text-right text-blue-500">0.00</td>
                <td className="text-right font-bold text-red-600">0.00</td>
                <td><Badge type="danger">Stockout</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
