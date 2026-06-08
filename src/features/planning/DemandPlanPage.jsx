import React, { useState, useEffect } from 'react';
import {
  listDemandPlanningCandidates,
  getDemandPlanningSummary,
  buildPlannerWorkbenchRows,
  isSupabaseConfigured,
} from '../../services/planning/demandPlanningService.js';
import Alert from '../../components/scm-ui/Alert.jsx';

export default function DemandPlanPage() {
  const [plannerRows, setPlannerRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const candidatesData = await listDemandPlanningCandidates({});
      const summaryData = await getDemandPlanningSummary({});
      setSummary(summaryData);
      setPlannerRows(buildPlannerWorkbenchRows(candidatesData));
    } catch (err) {
      setError(err.message || 'Failed to load demand planning data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="tgm-page p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Demand Planning</h1>
        <p className="text-gray-600">Planner Workbench (Phase L2A)</p>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Read-Only Notice / ประกาศ (Read-only)
            </h3>
            <div className="mt-2 text-sm text-yellow-700 space-y-2">
              <p>EN: Demand Planning is read-only. It supports ATP review, planner summaries, and optional stock lock decisions only. It does not create PR/PO, purchase orders, production orders, dispatch, goods issue, ledger posting, or Express write-back.</p>
              <p>TH: หน้านี้เป็น Read-only สำหรับดู Demand, ATP และสรุปให้ Planner เท่านั้น ไม่สร้าง PR/PO ไม่สั่งซื้อ ไม่สั่งผลิต ไม่ตัดสต็อก และไม่ส่งกลับ Express</p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="danger" className="mb-6">{error}</Alert>
      ) : null}

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Demand Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <SummaryCard title="Total Required Qty" value={summary?.totalRequiredQty || 0} />
          <SummaryCard title="Total Available Qty" value={summary?.totalAvailableQty || 0} color="text-green-600" />
          <SummaryCard title="Total Reserved Qty" value={summary?.totalReservedQty || 0} color="text-blue-600" />
          <SummaryCard title="Total Shortage Qty" value={summary?.totalShortageQty || 0} color="text-red-600" />
          <SummaryCard title="Ready to Pick Lines" value={summary?.readyToPickLines || 0} color="text-indigo-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
          <SummaryCard title="Not Reserved but Available Lines" value={summary?.notReservedButAvailableLines || 0} />
          <SummaryCard title="Short Stock Lines" value={summary?.shortStockLines || 0} color="text-orange-600" />
          <SummaryCard title="Pick Draft Exists" value={summary?.pickDraftExistsLines || 0} />
          <SummaryCard title="Pick Confirmed" value={summary?.pickConfirmedLines || 0} />
          <SummaryCard title="Total Open SO Demand Lines" value={summary?.totalOpenSoDemandLines || 0} />
        </div>
      </div>

      <div className="mb-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Planner Rules Preview</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Planner rules are preview-only in this phase.</p>
          </div>
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Read-only Template
          </span>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Reserve Policy</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">Automatic matching (Preview)</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Allocation Strategy</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">FEFO / Expiry Rule (Preview)</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mb-8 bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Planner Workbench</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Grouped by Required Date, Customer, and Product</p>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading demand data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expand</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Req Qty</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rsv Qty</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avail Qty</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shortage</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pick Readiness</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planner Rec.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plannerRows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          type="button"
                          onClick={() => toggleRow(row.id)}
                          className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        >
                          {expandedRows[row.id] ? '▼ Collapse' : '▶ Expand'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.shipDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.customerCode} <br /><span className="text-xs text-gray-500">{row.customerName}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.productCode} <br /><span className="text-xs text-gray-500">{row.productName}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.requiredQty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{row.reservedQty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{row.availableQty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{row.shortageQty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.pickReadinessSummary || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {row.recommendation}
                        </span>
                      </td>
                    </tr>

                    {expandedRows[row.id] ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <div className="text-sm text-gray-900 font-semibold mb-2">SO Line Details</div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-300 border border-gray-200 rounded">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SO No</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SO Line</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">WH/LOC</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Req Qty</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rsv Qty</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avail Qty</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shortage</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pick Readiness</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {row.details.map((detail, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{detail.so_no}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{detail.so_line}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{detail.wh_room || '-'}/{detail.wh_location || '-'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{detail.required_qty}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600">{detail.reserved_qty}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600">{detail.available_qty}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">{detail.shortage_qty}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{detail.pick_readiness || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))}
                {plannerRows.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                      No demand candidates found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className={`mt-1 text-3xl font-semibold ${color}`}>{value}</dd>
      </div>
    </div>
  );
}
