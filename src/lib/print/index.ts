/**
 * Print and PDF generation helpers for VuleraOS.
 * Generates formatted documents with business letterhead.
 */

import { formatCurrency } from "@/lib/currency";

export interface LetterheadConfig {
  businessName: string;
  bpNumber: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  logoUrl?: string | null;
  primaryColor?: string;
  headerText?: string;
  footerText?: string;
}

/**
 * Format an invoice/PO document for printing.
 * Returns an HTML string styled for print.
 */
export function formatDocumentHTML(
  title: string,
  documentNumber: string,
  letterhead: LetterheadConfig,
  parties: { label: string; name: string; bp?: string | null; address?: string | null; city?: string | null; email?: string | null; phone?: string | null },
  items: { description: string; quantity: number; unitPrice: number; total: number }[],
  totals: { subtotal: number; vatAmount: number; vatRate: number; total: number; amountPaid: number; balanceDue: number; currencySymbol: string },
  meta: { date: string; dueDate?: string; notes?: string | null }
): string {
  const color = letterhead.primaryColor || "#1e40af";

  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 4px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unitPrice, { code: "", symbol: totals.currencySymbol })}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.total, { code: "", symbol: totals.currencySymbol })}</td>
      </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${title} ${documentNumber}</title>
    <style>
      @page { margin: 20mm 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #333; line-height: 1.5; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${color}; padding-bottom: 15px; margin-bottom: 20px; }
      .header .business { flex: 1; }
      .header .business h1 { font-size: 22px; margin: 0; color: ${color}; }
      .header .business p { margin: 2px 0; color: #666; font-size: 11px; }
      .header .document-info { text-align: right; }
      .header .document-info h2 { font-size: 18px; margin: 0; color: ${color}; }
      .header .document-info p { margin: 2px 0; color: #666; font-size: 11px; }
      .parties { display: flex; justify-content: space-between; margin-bottom: 20px; }
      .parties .box { flex: 1; }
      .parties .box h3 { font-size: 12px; color: ${color}; margin: 0 0 5px 0; text-transform: uppercase; }
      .parties .box p { margin: 2px 0; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      th { background: ${color}; color: white; padding: 8px 4px; text-align: left; font-size: 11px; }
      th.right { text-align: right; }
      th.center { text-align: center; }
      .totals { width: 300px; margin-left: auto; }
      .totals table { width: 100%; }
      .totals td { padding: 4px 8px; font-size: 12px; }
      .totals .grand-total td { font-weight: bold; font-size: 14px; border-top: 2px solid ${color}; }
      .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
      .status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; }
      @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head>
    <body>
      <div class="header">
        <div class="business">
          <h1>${letterhead.businessName}</h1>
          ${letterhead.address ? `<p>${letterhead.address}</p>` : ""}
          ${letterhead.city ? `<p>${letterhead.city}</p>` : ""}
          ${letterhead.phone ? `<p>Tel: ${letterhead.phone}</p>` : ""}
          ${letterhead.email ? `<p>Email: ${letterhead.email}</p>` : ""}
          ${letterhead.bpNumber ? `<p>BP: ${letterhead.bpNumber}</p>` : ""}
        </div>
        <div class="document-info">
          <h2>${title}</h2>
          <p><strong>${documentNumber}</strong></p>
          <p>Date: ${meta.date}</p>
          ${meta.dueDate ? `<p>Due: ${meta.dueDate}</p>` : ""}
        </div>
      </div>

      <div class="parties">
        <div class="box">
          <h3>${parties.label}</h3>
          <p><strong>${parties.name}</strong></p>
          ${parties.bp ? `<p>BP: ${parties.bp}</p>` : ""}
          ${parties.address ? `<p>${parties.address}</p>` : ""}
          ${parties.city ? `<p>${parties.city}</p>` : ""}
          ${parties.email ? `<p>${parties.email}</p>` : ""}
          ${parties.phone ? `<p>${parties.phone}</p>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Item</th><th class="center">Qty</th><th class="right">Price</th><th class="right">Total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        <table>
          <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(totals.subtotal, { code: "", symbol: totals.currencySymbol })}</td></tr>
          ${totals.vatRate > 0 ? `<tr><td>VAT (${totals.vatRate}%)</td><td style="text-align:right">${formatCurrency(totals.vatAmount, { code: "", symbol: totals.currencySymbol })}</td></tr>` : ""}
          <tr class="grand-total"><td>Total</td><td style="text-align:right">${formatCurrency(totals.total, { code: "", symbol: totals.currencySymbol })}</td></tr>
          ${totals.amountPaid > 0 ? `<tr><td>Paid</td><td style="text-align:right">(${formatCurrency(totals.amountPaid, { code: "", symbol: totals.currencySymbol })})</td></tr><tr style="font-weight:bold"><td>Balance Due</td><td style="text-align:right">${formatCurrency(totals.balanceDue, { code: "", symbol: totals.currencySymbol })}</td></tr>` : ""}
        </table>
      </div>

      ${meta.notes ? `<div style="margin-top:15px;padding:10px;background:#f9f9f9;border-radius:4px;font-size:11px;"><strong>Notes:</strong><br>${meta.notes}</div>` : ""}
      ${letterhead.footerText ? `<div class="footer">${letterhead.footerText}</div>` : ""}
    </body></html>`;
}

/**
 * Open a print dialog with the formatted document.
 * Works as a print preview — the user can print to PDF or paper.
 */
export function openPrintWindow(html: string): void {
  const win = window.open("", "_blank");
  if (!win) {
    // Fallback: print inline
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-10000px";
    document.body.appendChild(iframe);
    iframe.contentDocument?.write(html);
    iframe.contentDocument?.close();
    setTimeout(() => { iframe.contentWindow?.print(); document.body.removeChild(iframe); }, 500);
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}
