import { HandheldScanHub } from '../../../components/wms/handheld/HandheldScanHub.jsx';

export default function ScanCenterPage() {
  return (
    <HandheldScanHub
      title="Scan Center"
      description="Barcode scan hub for receiving, picking, and stock count. Read-only safe mode."
    />
  );
}
