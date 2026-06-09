import React, { useState } from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function ReceivingPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="WMS Receiving"
        description="Receive incoming goods from production or external suppliers."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />
      <Alert variant="warning">
        This module operates in Safe Mode. You can view receiving documents, but posting Goods Receipt (GR) back to Express is disabled.
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Expected Today</div>
          <div className="text-2xl font-bold mt-1">12</div>
        </div>
        <div className="card p-4 border-l-4 border-l-yellow-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Receiving In Progress</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">3</div>
        </div>
        <div className="card p-4 border-l-4 border-l-green-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Completed</div>
          <div className="text-2xl font-bold mt-1 text-green-600">8</div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Discrepancies</div>
          <div className="text-2xl font-bold mt-1 text-red-600">1</div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-2 items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-700">Receiving Schedule</h3>
          <div className="flex gap-2">
            <input 
              type="date" 
              className="tgm-input text-sm w-40" 
              defaultValue={new Date().toISOString().slice(0,10)}
            />
            <input 
              type="text" 
              className="tgm-input text-sm w-64" 
              placeholder="Search PO/GR Number..." 
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
                <th>Document No.</th>
                <th>Source</th>
                <th>Supplier/Plant</th>
                <th>Expected Qty</th>
                <th>Received Qty</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-brand-600">PO-2410-0150</td>
                <td>External Supplier</td>
                <td>CP Foods PCL.</td>
                <td className="text-right">5,000.00</td>
                <td className="text-right">0.00</td>
                <td><Badge type="warning">Pending</Badge></td>
                <td><button className="text-brand-600 hover:underline">View</button></td>
              </tr>
              <tr>
                <td className="font-mono text-brand-600">PRD-2410-001</td>
                <td>Production Order</td>
                <td>Plant A</td>
                <td className="text-right">2,500.00</td>
                <td className="text-right text-brand-600">1,200.00</td>
                <td><Badge type="info">In Progress</Badge></td>
                <td><button className="text-brand-600 hover:underline">View</button></td>
              </tr>
              <tr>
                <td className="font-mono text-brand-600">PO-2410-0142</td>
                <td>External Supplier</td>
                <td>Betagro PCL.</td>
                <td className="text-right">10,000.00</td>
                <td className="text-right text-green-600">10,000.00</td>
                <td><Badge type="success">Completed</Badge></td>
                <td><button className="text-brand-600 hover:underline">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
