import { useMemo } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getRoomCompanySummary,
  listRoomCompanyConfig,
} from '../../services/admin/roomCompanyService.js';

export default function RoomCompanyPage() {
  const rooms = useMemo(() => listRoomCompanyConfig(), []);
  const summary = useMemo(() => getRoomCompanySummary(rooms), [rooms]);

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Room / Company"
        description="System config preview for room_code, company, and source system scope. Read-only."
        actions={
          <>
            <Badge type="neutral">Read-only</Badge>
            <Badge type="warning">System Config Preview</Badge>
          </>
        }
      />

      <Alert variant="info">
        Config preview only. room_code filters used across reservation, stock balance, and WMS views. No production write.
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Room Codes" value={summary.total} />
        <KpiCard label="Active" value={summary.active} />
        <KpiCard label="Source Systems" value={summary.sourceSystems.length} />
      </div>

      <TablePanel title="Room / Company Configuration">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Room Code</th>
              <th>Company Name</th>
              <th>Source System</th>
              <th>Warehouse Scope</th>
              <th>Active</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((row) => (
              <tr key={row.roomCode}>
                <td className="font-mono font-semibold">{row.roomCode}</td>
                <td>{row.companyName}</td>
                <td>{row.sourceSystem}</td>
                <td>{row.warehouseScope}</td>
                <td>{row.active ? 'Yes' : 'No'}</td>
                <td className="max-w-[240px] text-sm text-[var(--color-text-muted)]">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
