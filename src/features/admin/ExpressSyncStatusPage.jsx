import React, { useState } from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function ExpressSyncStatusPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="Express DBF Sync Status"
        description="Monitor data synchronization between legacy Express DBF and Supabase."
        actions={
          <>
            <Badge type="success">SYNC ACTIVE</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />
      <Alert variant="warning">
        This module operates in Safe Mode. The sync engine is running in Read-Only mode. Data flows from Express to Supabase. Write-back to Express is disabled.
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-green-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Overall Status</div>
          <div className="text-2xl font-bold mt-1 text-green-600">Healthy</div>
        </div>
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Last Sync Time</div>
          <div className="text-2xl font-bold mt-1">2 mins ago</div>
        </div>
        <div className="card p-4 border-l-4 border-l-yellow-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Pending Queue</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">0</div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Sync Errors (24h)</div>
          <div className="text-2xl font-bold mt-1 text-red-600">0</div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-2 items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-700">Table Synchronization Status</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="tgm-input text-sm w-64" 
              placeholder="Search table..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-secondary">Refresh</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Express DBF File</th>
                <th>Supabase Table</th>
                <th>Direction</th>
                <th>Last Sync</th>
                <th>Rows Synced</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-brand-600">STKMAST.DBF</td>
                <td className="font-mono">sc_products</td>
                <td><Badge type="info">Express → Supabase</Badge></td>
                <td>2024-10-09 10:45:12</td>
                <td className="text-right">1,245</td>
                <td><Badge type="success">Success</Badge></td>
                <td><button className="text-brand-600 hover:underline">Logs</button></td>
              </tr>
              <tr>
                <td className="font-mono text-brand-600">OESOI.DBF</td>
                <td className="font-mono">sc_sales_orders</td>
                <td><Badge type="info">Express → Supabase</Badge></td>
                <td>2024-10-09 10:46:05</td>
                <td className="text-right">45</td>
                <td><Badge type="success">Success</Badge></td>
                <td><button className="text-brand-600 hover:underline">Logs</button></td>
              </tr>
              <tr>
                <td className="font-mono text-brand-600">STKBAL.DBF</td>
                <td className="font-mono">sc_stock_balances</td>
                <td><Badge type="info">Express → Supabase</Badge></td>
                <td>2024-10-09 10:47:30</td>
                <td className="text-right">15,820</td>
                <td><Badge type="success">Success</Badge></td>
                <td><button className="text-brand-600 hover:underline">Logs</button></td>
              </tr>
              <tr>
                <td className="font-mono text-gray-500">OESOI.DBF</td>
                <td className="font-mono">sc_sales_orders</td>
                <td><Badge type="danger">Supabase → Express</Badge></td>
                <td>-</td>
                <td className="text-right">0</td>
                <td><Badge type="neutral">Disabled</Badge></td>
                <td><button className="text-gray-400 cursor-not-allowed">Logs</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
