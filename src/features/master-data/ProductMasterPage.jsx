import React, { useState } from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function ProductMasterPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="Product Master"
        description="Central repository for all SKUs and product configurations."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />
      <Alert variant="warning">
        This module operates in Safe Mode. You can view product definitions from Express. Creating or modifying products is disabled.
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total SKUs</div>
          <div className="text-2xl font-bold mt-1">1,245</div>
        </div>
        <div className="card p-4 border-l-4 border-l-green-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Active Products</div>
          <div className="text-2xl font-bold mt-1 text-green-600">1,120</div>
        </div>
        <div className="card p-4 border-l-4 border-l-yellow-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">New This Month</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">15</div>
        </div>
        <div className="card p-4 border-l-4 border-l-gray-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Inactive</div>
          <div className="text-2xl font-bold mt-1 text-gray-600">125</div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-2 items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-700">Product List</h3>
          <div className="flex gap-2">
            <select className="tgm-input text-sm">
              <option value="">All Categories</option>
              <option value="sausage">Sausage</option>
              <option value="bacon">Bacon</option>
              <option value="ham">Ham</option>
            </select>
            <input 
              type="text" 
              className="tgm-input text-sm w-64" 
              placeholder="Search Code, Name, Barcode..." 
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
                <th>Code</th>
                <th>Name (EN)</th>
                <th>Name (TH)</th>
                <th>Category</th>
                <th>Base UOM</th>
                <th>Weight (Kg)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-brand-600">FG-00100</td>
                <td>Thai Sausage Premium 500g</td>
                <td>ไส้กรอกไทยพรีเมียม 500 กรัม</td>
                <td>Sausage</td>
                <td>PC</td>
                <td>0.500</td>
                <td><Badge type="success">Active</Badge></td>
                <td><button className="text-brand-600 hover:underline">View</button></td>
              </tr>
              <tr>
                <td className="font-mono text-brand-600">FG-00105</td>
                <td>Vienna Sausage 1kg</td>
                <td>เวียนนาซอสเซจ 1 กิโลกรัม</td>
                <td>Sausage</td>
                <td>PC</td>
                <td>1.000</td>
                <td><Badge type="success">Active</Badge></td>
                <td><button className="text-brand-600 hover:underline">View</button></td>
              </tr>
              <tr>
                <td className="font-mono text-brand-600">FG-00210</td>
                <td>Bacon Sliced 250g</td>
                <td>เบคอนสไลด์ 250 กรัม</td>
                <td>Bacon</td>
                <td>PC</td>
                <td>0.250</td>
                <td><Badge type="success">Active</Badge></td>
                <td><button className="text-brand-600 hover:underline">View</button></td>
              </tr>
              <tr>
                <td className="font-mono text-gray-500">FG-00999</td>
                <td className="text-gray-500">Old Recipe Sausage (Discontinued)</td>
                <td className="text-gray-500">ไส้กรอกสูตรเก่า (เลิกผลิต)</td>
                <td className="text-gray-500">Sausage</td>
                <td className="text-gray-500">PC</td>
                <td className="text-gray-500">0.500</td>
                <td><Badge type="neutral">Inactive</Badge></td>
                <td><button className="text-brand-600 hover:underline">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
