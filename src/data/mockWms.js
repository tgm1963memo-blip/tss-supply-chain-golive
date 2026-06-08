export const mockWmsTasks = [
  {
    id: 'WMS-RCV-001',
    taskNo: 'RCV-2026-0145',
    type: 'Receiving',
    reference: 'PO-2026-0088',
    warehouse: 'WH-BKK-01',
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'Team A',
    dueDate: '2026-06-08',
  },
  {
    id: 'WMS-PUT-001',
    taskNo: 'PUT-2026-0092',
    type: 'Putaway',
    reference: 'RCV-2026-0145',
    warehouse: 'WH-BKK-01',
    status: 'Pending',
    priority: 'Normal',
    assignedTo: 'Team B',
    dueDate: '2026-06-08',
  },
  {
    id: 'WMS-PCK-001',
    taskNo: 'PCK-2026-0310',
    type: 'Picking',
    reference: 'SO-2026-001',
    warehouse: 'WH-BKK-01',
    status: 'Assigned',
    priority: 'High',
    assignedTo: 'Team C',
    dueDate: '2026-06-09',
  },
  {
    id: 'WMS-DSP-001',
    taskNo: 'DSP-2026-0044',
    type: 'Dispatch',
    reference: 'SO-2026-003',
    warehouse: 'WH-BKK-01',
    status: 'Ready',
    priority: 'Normal',
    assignedTo: 'Team D',
    dueDate: '2026-06-09',
  },
];

export const wmsColumns = [
  { key: 'taskNo', label: 'Task No.' },
  { key: 'type', label: 'Type' },
  { key: 'reference', label: 'Reference' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'dueDate', label: 'Due Date' },
];

export const wmsSummaryCards = [
  { label: 'Open Tasks', value: '38', hint: 'All WMS task types' },
  { label: 'Receiving Today', value: '6', hint: 'Inbound GR pending' },
  { label: 'Pick Waves', value: '4', hint: 'Active pick lists' },
  { label: 'Dispatch Ready', value: '9', hint: 'Awaiting loading' },
];

export default mockWmsTasks;
