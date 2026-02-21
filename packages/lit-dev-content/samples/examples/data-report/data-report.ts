import {LitElement, html, css, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

export interface ReportColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'date' | 'percent';
  summary?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportGroup {
  key: string;
  label: string;
}

@customElement('data-report')
export class DataReport extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--report-font, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
      font-size: var(--report-font-size, 12px);
      color: #333;
    }

    .report-container {
      border: 1px solid #ccc;
      background: #fff;
      overflow-x: auto;
    }

    /* Header */
    .report-header {
      padding: 16px 20px;
      border-bottom: 2px solid #1a56db;
      background: linear-gradient(135deg, #f8fafc, #eef2ff);
    }

    .report-title {
      font-size: 1.5em;
      font-weight: 700;
      color: #1a56db;
      margin: 0 0 4px 0;
    }

    .report-subtitle {
      font-size: 0.9em;
      color: #666;
      margin: 0;
    }

    .report-meta {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      font-size: 0.8em;
      color: #888;
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      gap: 6px;
      padding: 8px 12px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      flex-wrap: wrap;
    }

    .toolbar button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      font-size: 0.85em;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #fff;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s;
    }

    .toolbar button:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .toolbar .search-box {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .toolbar input[type='text'] {
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.85em;
      width: 180px;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }

    thead th {
      position: sticky;
      top: 0;
      background: #1e40af;
      color: #fff;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 0.9em;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      border-right: 1px solid rgba(255, 255, 255, 0.15);
    }

    thead th:hover {
      background: #1e3a8a;
    }

    thead th .sort-indicator {
      margin-left: 4px;
      opacity: 0.6;
    }

    thead th .sort-indicator.active {
      opacity: 1;
    }

    tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }

    tbody tr:nth-child(even) {
      background: #f9fafb;
    }

    tbody tr:hover {
      background: #eef2ff;
    }

    tbody td {
      padding: 6px 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
    }

    td.align-right,
    th.align-right {
      text-align: right;
    }

    td.align-center,
    th.align-center {
      text-align: center;
    }

    /* Group header */
    .group-header td {
      background: #e0e7ff;
      font-weight: 700;
      color: #1e40af;
      padding: 6px 10px;
      border-bottom: 2px solid #1e40af;
    }

    /* Summary row */
    .summary-row td {
      background: #fef3c7;
      font-weight: 700;
      border-top: 2px solid #d97706;
      border-bottom: 2px solid #d97706;
      padding: 8px 10px;
    }

    /* Footer */
    .report-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      font-size: 0.8em;
      color: #6b7280;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .pagination button {
      padding: 3px 8px;
      border: 1px solid #d1d5db;
      border-radius: 3px;
      background: #fff;
      cursor: pointer;
      font-size: 0.9em;
    }

    .pagination button:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .pagination button:not(:disabled):hover {
      background: #e5e7eb;
    }

    .pagination .page-info {
      margin: 0 8px;
    }

    /* Print styles */
    @media print {
      .toolbar,
      .pagination {
        display: none !important;
      }

      .report-container {
        border: none;
      }

      thead th {
        background: #333 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      tbody tr:nth-child(even) {
        background: #f3f3f3 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .summary-row td {
        background: #fff3cd !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;

  @property({type: String}) reportTitle = 'Data Report';
  @property({type: String}) subtitle = '';
  @property({type: Array}) columns: ReportColumn[] = [];
  @property({type: Array}) data: Record<string, unknown>[] = [];
  @property({type: Object}) groupBy: ReportGroup | null = null;
  @property({type: Number}) pageSize = 25;
  @property({type: Boolean}) showToolbar = true;

  @state() private _currentPage = 1;
  @state() private _sortKey = '';
  @state() private _sortAsc = true;
  @state() private _searchTerm = '';

  private get _filteredData(): Record<string, unknown>[] {
    let result = [...this.data];
    if (this._searchTerm) {
      const term = this._searchTerm.toLowerCase();
      result = result.filter((row) =>
        this.columns.some((col) =>
          String(row[col.key] ?? '')
            .toLowerCase()
            .includes(term)
        )
      );
    }
    if (this._sortKey) {
      result.sort((a, b) => {
        const va = a[this._sortKey];
        const vb = b[this._sortKey];
        let cmp = 0;
        if (typeof va === 'number' && typeof vb === 'number') {
          cmp = va - vb;
        } else {
          cmp = String(va ?? '').localeCompare(String(vb ?? ''));
        }
        return this._sortAsc ? cmp : -cmp;
      });
    }
    return result;
  }

  private get _pagedData(): Record<string, unknown>[] {
    const start = (this._currentPage - 1) * this.pageSize;
    return this._filteredData.slice(start, start + this.pageSize);
  }

  private get _totalPages(): number {
    return Math.max(1, Math.ceil(this._filteredData.length / this.pageSize));
  }

  private _formatValue(value: unknown, format?: string): string {
    if (value == null) return '';
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(value));
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      case 'percent':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 1,
        }).format(Number(value));
      case 'date':
        return new Date(String(value)).toLocaleDateString('en-US');
      default:
        return String(value);
    }
  }

  private _computeSummary(
    col: ReportColumn,
    rows: Record<string, unknown>[]
  ): string {
    if (!col.summary) return '';
    const values = rows
      .map((r) => Number(r[col.key]))
      .filter((v) => !isNaN(v));
    if (values.length === 0) return '';

    let result: number;
    switch (col.summary) {
      case 'sum':
        result = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'count':
        result = values.length;
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'max':
        result = Math.max(...values);
        break;
      default:
        return '';
    }
    return this._formatValue(result, col.format);
  }

  private _handleSort(key: string) {
    if (this._sortKey === key) {
      this._sortAsc = !this._sortAsc;
    } else {
      this._sortKey = key;
      this._sortAsc = true;
    }
    this._currentPage = 1;
  }

  private _handleSearch(e: Event) {
    this._searchTerm = (e.target as HTMLInputElement).value;
    this._currentPage = 1;
  }

  exportCSV() {
    const separator = ',';
    const header = this.columns.map((c) => `"${c.label}"`).join(separator);
    const rows = this._filteredData.map((row) =>
      this.columns
        .map((col) => {
          const val = this._formatValue(row[col.key], col.format);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(separator)
    );

    // Add summary row if any column has a summary
    if (this.columns.some((c) => c.summary)) {
      const summaryRow = this.columns
        .map((col) => {
          if (col.summary) {
            const val = this._computeSummary(col, this._filteredData);
            return `"${col.summary.toUpperCase()}: ${val}"`;
          }
          return '""';
        })
        .join(separator);
      rows.push(summaryRow);
    }

    const csv = [header, ...rows].join('\n');
    this._downloadFile(csv, `${this.reportTitle}.csv`, 'text/csv');
  }

  exportJSON() {
    const json = JSON.stringify(this._filteredData, null, 2);
    this._downloadFile(json, `${this.reportTitle}.json`, 'application/json');
  }

  printReport() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = Array.from(
      this.shadowRoot?.querySelectorAll('style') ?? []
    )
      .map((s) => s.textContent)
      .join('\n');

    const tableHTML =
      this.shadowRoot?.querySelector('.report-container')?.innerHTML ?? '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${this.reportTitle}</title>
        <style>${styles}</style>
        <style>
          body { font-family: 'Segoe UI', sans-serif; font-size: 11px; margin: 20px; }
          .toolbar { display: none !important; }
          .pagination { display: none !important; }
        </style>
      </head>
      <body>${tableHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  private _downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private _renderGroupedBody() {
    if (!this.groupBy) return this._renderFlatBody();

    const grouped = new Map<string, Record<string, unknown>[]>();
    for (const row of this._pagedData) {
      const key = String(row[this.groupBy.key] ?? '');
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    }

    const rows: unknown[] = [];
    for (const [groupValue, groupRows] of grouped) {
      // Group header
      rows.push(html`
        <tr class="group-header">
          <td colspan="${this.columns.length}">
            ${this.groupBy!.label}: ${groupValue} (${groupRows.length})
          </td>
        </tr>
      `);

      // Data rows
      for (const row of groupRows) {
        rows.push(this._renderRow(row));
      }

      // Group subtotals
      if (this.columns.some((c) => c.summary)) {
        rows.push(html`
          <tr class="summary-row">
            ${this.columns.map(
              (col) => html`
                <td class="${col.align === 'right' ? 'align-right' : ''}">
                  ${col.summary
                    ? `${col.summary}: ${this._computeSummary(col, groupRows)}`
                    : ''}
                </td>
              `
            )}
          </tr>
        `);
      }
    }
    return rows;
  }

  private _renderFlatBody() {
    return this._pagedData.map((row) => this._renderRow(row));
  }

  private _renderRow(row: Record<string, unknown>) {
    return html`
      <tr>
        ${this.columns.map(
          (col) => html`
            <td
              class="${col.align === 'right'
                ? 'align-right'
                : col.align === 'center'
                  ? 'align-center'
                  : ''}"
              style="${col.width ? `width:${col.width}` : ''}"
            >
              ${this._formatValue(row[col.key], col.format)}
            </td>
          `
        )}
      </tr>
    `;
  }

  override render() {
    const hasSummary = this.columns.some((c) => c.summary);
    const now = new Date().toLocaleString();

    return html`
      <div class="report-container">
        <!-- Report Header -->
        <div class="report-header">
          <h1 class="report-title">${this.reportTitle}</h1>
          ${this.subtitle
            ? html`<p class="report-subtitle">${this.subtitle}</p>`
            : nothing}
          <div class="report-meta">
            <span>Generated: ${now}</span>
            <span>Records: ${this._filteredData.length}</span>
          </div>
        </div>

        <!-- Toolbar -->
        ${this.showToolbar
          ? html`
              <div class="toolbar">
                <button @click=${this.exportCSV}>&#128196; Export CSV</button>
                <button @click=${this.exportJSON}>&#128203; Export JSON</button>
                <button @click=${this.printReport}>
                  &#128424; Print / PDF
                </button>
                <div class="search-box">
                  <input
                    type="text"
                    placeholder="Search..."
                    .value=${this._searchTerm}
                    @input=${this._handleSearch}
                  />
                </div>
              </div>
            `
          : nothing}

        <!-- Data Table -->
        <table>
          <thead>
            <tr>
              ${this.columns.map(
                (col) => html`
                  <th
                    class="${col.align === 'right'
                      ? 'align-right'
                      : col.align === 'center'
                        ? 'align-center'
                        : ''}"
                    @click=${() => this._handleSort(col.key)}
                  >
                    ${col.label}
                    <span
                      class="sort-indicator ${this._sortKey === col.key
                        ? 'active'
                        : ''}"
                    >
                      ${this._sortKey === col.key
                        ? this._sortAsc
                          ? '▲'
                          : '▼'
                        : '⇅'}
                    </span>
                  </th>
                `
              )}
            </tr>
          </thead>
          <tbody>
            ${this._renderGroupedBody()}

            <!-- Grand totals -->
            ${hasSummary && !this.groupBy
              ? html`
                  <tr class="summary-row">
                    ${this.columns.map(
                      (col) => html`
                        <td
                          class="${col.align === 'right' ? 'align-right' : ''}"
                        >
                          ${col.summary
                            ? `${col.summary.toUpperCase()}: ${this._computeSummary(col, this._filteredData)}`
                            : ''}
                        </td>
                      `
                    )}
                  </tr>
                `
              : nothing}
          </tbody>
        </table>

        <!-- Footer with Pagination -->
        <div class="report-footer">
          <span>${this.reportTitle} — Page ${this._currentPage} of ${this._totalPages}</span>
          <div class="pagination">
            <button
              ?disabled=${this._currentPage <= 1}
              @click=${() => (this._currentPage = 1)}
            >
              &#171;
            </button>
            <button
              ?disabled=${this._currentPage <= 1}
              @click=${() => this._currentPage--}
            >
              &#8249;
            </button>
            <span class="page-info">${this._currentPage} / ${this._totalPages}</span>
            <button
              ?disabled=${this._currentPage >= this._totalPages}
              @click=${() => this._currentPage++}
            >
              &#8250;
            </button>
            <button
              ?disabled=${this._currentPage >= this._totalPages}
              @click=${() => (this._currentPage = this._totalPages)}
            >
              &#187;
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
