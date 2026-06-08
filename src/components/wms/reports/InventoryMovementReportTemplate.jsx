export function InventoryMovementReportTemplate({ data }) {
  return (
    <article className="operational-report operational-report-a4">
      <header className="document-header">
        <h1>Entry-Delivery Inventory Report</h1>
        <p>Customer: {data?.customer ?? '-'}</p>
        <p>Date From: {data?.dateFrom ?? '-'} — Date To: {data?.dateTo ?? '-'}</p>
        <p>Issued: {data?.issuedDate ?? '-'}</p>
      </header>

      <section className="operational-report-section">
        <h2 className="operational-report-section-title">Movement Ledger</h2>
        <table className="operational-report-table tgd-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Lot</th>
              <th>Product</th>
              <th>Received</th>
              <th>Delivery</th>
              <th>Balance</th>
              <th>UOM</th>
            </tr>
          </thead>
          <tbody>
            {(data?.lines ?? []).map((line) => (
              <tr key={line.id}>
                <td>{line.date}</td>
                <td>{line.lotNo}</td>
                <td>{line.customerProduct}</td>
                <td>{line.received}</td>
                <td>{line.delivery}</td>
                <td>{line.balance}</td>
                <td>{line.volumeUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </article>
  );
}
