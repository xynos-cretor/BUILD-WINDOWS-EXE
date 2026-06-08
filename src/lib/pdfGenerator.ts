import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (company: any, invoice: any, items: any[], customer: any) => {
  try {
    const doc = new jsPDF();
    
    // 1. Draw Page Outer Border for Premium Layout Craftsmanship
    doc.setDrawColor(224, 242, 254); // Very light sky blue border
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 280, 'D');
    
    // 2. Add Ambient Artistic Diagonal Watermark across the Background
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(35);
    doc.setTextColor(240, 249, 255); // Hyper-light sky blue (nearly invisible, highly professional)
    const storageKey = company?.id ? `premium_watermark_${company.id}` : 'premium_watermark_global';
    const watermarkText = (typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null) || company?.name || 'DAMSON BILLING';
    doc.text(watermarkText.toUpperCase(), 50, 160, { angle: 28 });
    doc.setFontSize(16);
    doc.text("DELL * HP * ASUS * ACER * LENOVO  -  AUTHORIZED PARTNER", 45, 178, { angle: 28 });
    doc.restoreGraphicsState();

    // 3. Custom Header Layout
    // Left side: Primary Company Logo Type & Partner badge
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199); // Sky-600 primary base color
    const companyName = (company?.name || 'DAMSON BILLING').toUpperCase();
    doc.text(companyName, 15, 22);
    
    // Subtle Dealer / Brand Partner Designation Text block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(14, 165, 233); // Sky-500
    doc.text("AUTHORISED RETAIL PARTNER & SERVICE HUB", 15, 28);
    
    // Primary Address Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80); // Subtle contrast charcoal
    doc.text(company?.address || '12, Electronic Plaza, New Delhi', 15, 31.5);
    doc.text(`GSTIN: ${company?.gstin || 'N/A'}`, 15, 36);
    doc.text(`Contact: ${company?.mobile || 'N/A'} | WhatsApp No: ${company?.whatsapp || 'N/A'} | E-mail: ${company?.email || 'N/A'}`, 15, 40.5);
    
    // Right side of header: Clean, professional, high-end minimalist design
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("GENUINE IT HARDWARE & PRO SERVICES RETAILER", 198, 27, { align: 'right' });
    
    // Segment Separator
    doc.setDrawColor(224, 242, 254);
    doc.line(12, 45.5, 198, 45.5);
    
    // 4. Dual Grid Section (Invoice Info & Customer Bills - Perfect Fixed Grid spacing)
    // Left Grid: Invoice Information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(2, 132, 199);
    doc.text('TAX INVOICE DETAILS', 15, 51);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`Invoice Number :  ${invoice?.invoice_no || 'DRAFT'}`, 15, 57);
    doc.text(`Billing Date        :  ${new Date(invoice?.date || Date.now()).toLocaleDateString()}`, 15, 62);
    doc.text(`Payment Mode   :  ${invoice?.payment_mode || 'Cash'}`, 15, 67);
    
    // Right Grid: Customer Address / Statement (No overlapping possibility)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(2, 132, 199);
    doc.text('BILL TO (CUSTOMER)', 115, 51);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900 for prominence
    doc.text(customer?.name || 'Walk-in Customer', 115, 57);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    doc.text(customer?.address || 'No Address Provided', 115, 62);
    doc.text(`Mob: ${customer?.mobile || 'N/A'}`, 115, 67);
    
    // Divider before table content
    doc.setDrawColor(224, 242, 254);
    doc.line(12, 73, 198, 73);
    
    // 5. Build and Populate the Tables (Stunning Sky Blue Header with custom alignment)
    const tableData = (items || []).map((item, index) => [
      index + 1,
      item?.product_name || item?.name || 'Item/Service',
      item?.hsn_code || item?.hsn || '1001',
      item?.quantity || 1,
      `Rs. ${Number(item?.price || 0).toFixed(2)}`,
      item?.gst_rate ? `${item.gst_rate}%` : '0%',
      `Rs. ${(Number(item?.price || 0) * Number(item?.quantity || 1) * (1 + (item?.gst_rate || 0)/100)).toFixed(2)}`
    ]);
    
    const tableConfig = {
      startY: 78,
      margin: { left: 10 },
      head: [['Sr.', 'Item / Service Description', 'HSN/SAC', 'Qty', 'Rate', 'GST Rate', 'Total Amount']],
      body: tableData,
      theme: 'grid' as const,
      headStyles: { 
        fillColor: [2, 132, 199] as [number, number, number], 
        textColor: [255, 255, 255] as [number, number, number], 
        fontStyle: 'bold' as const, 
        fontSize: 9.5 
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3.5, 
        font: 'helvetica',
        valign: 'middle' as const,
        overflow: 'linebreak' as const 
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' as const },
        1: { cellWidth: 72 },
        2: { cellWidth: 22, halign: 'center' as const },
        3: { cellWidth: 14, halign: 'center' as const },
        4: { cellWidth: 22, halign: 'right' as const },
        5: { cellWidth: 18, halign: 'center' as const },
        6: { cellWidth: 32, halign: 'right' as const }
      }
    };
    
    // Modular support for both ES build standards and fallback systems
    if (typeof autoTable === 'function') {
      autoTable(doc, tableConfig);
    } else if (autoTable && typeof (autoTable as any).default === 'function') {
      (autoTable as any).default(doc, tableConfig);
    } else if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(tableConfig);
    } else {
      console.warn("jspdf-autotable plugin was not bound correctly.");
    }
    
    // Safe final vertical position calculation
    let finalY = 125;
    if ((doc as any).lastAutoTable && typeof (doc as any).lastAutoTable.finalY === 'number') {
      finalY = (doc as any).lastAutoTable.finalY + 8;
    } else if ((doc as any).previousAutoTable && typeof (doc as any).previousAutoTable.finalY === 'number') {
      finalY = (doc as any).previousAutoTable.finalY + 8;
    }
    
    // If table ends near bottom of page, split summary block to avoid overlaps safely
    if (finalY > 155) {
      doc.addPage();
      doc.setDrawColor(224, 242, 254);
      doc.rect(8, 8, 194, 280, 'D');
      finalY = 20;
    }

    // Calculations
    const subTotal = (items || []).reduce((sum, item) => sum + (Number(item?.price || 0) * Number(item?.quantity || 1)), 0);
    const totalGst = (items || []).reduce((sum, item) => sum + (Number(item?.gst_amount) || (Number(item?.price || 0) * Number(item?.quantity || 1) * (item?.gst_rate || 0)/100)), 0);
    const transport = Number(invoice?.transport_charge || 0);
    const grandTotal = Number(invoice?.total_amount || (subTotal + totalGst + transport));
    
    // 6. Double Column Bottom Placement (Left Side Bank/Terms and Right Side Totals)
    // Left side context: Brand badge, Bank details, and Terms details
    
    // Render Beautiful Authorized Dealer brand box at a fixed place on bottom left
    const dealerY = finalY;
    doc.saveGraphicsState();
    doc.setFillColor(240, 249, 255); // light sky blue block
    doc.setDrawColor(186, 230, 253);
    doc.setLineWidth(0.4);
    doc.rect(10, dealerY, 103, 17, 'F');
    doc.rect(10, dealerY, 103, 17, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(3, 105, 161); // Sky-700
    doc.text("AUTHORISED DEALER & PARTNER OF", 61.5, dealerY + 5.5, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(2, 132, 199); // Sky-600
    doc.text("DELL   *   HP   *   ASUS   *   ACER   *   LENOVO", 61.5, dealerY + 11.5, { align: 'center' });
    doc.restoreGraphicsState();

    let leftInfoY = dealerY + 21;
    
    const hasBankDetails = company && (company.bank_name || company.account_no || company.ifsc || company.upi_id);
    if (hasBankDetails) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(2, 132, 199);
      doc.text('BANK TRANSFER DETAILS', 10, leftInfoY + 4);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(70, 70, 70);
      let offset = 8.5;
      if (company.bank_name) {
        doc.text(`Bank Name    : ${company.bank_name}`, 10, leftInfoY + offset);
        offset += 4.5;
      }
      if (company.account_no) {
        doc.text(`Account No   : ${company.account_no}`, 10, leftInfoY + offset);
        offset += 4.5;
      }
      if (company.ifsc) {
        doc.text(`IFSC Code    : ${company.ifsc}`, 10, leftInfoY + offset);
        offset += 4.5;
      }
      if (company.upi_id) {
        doc.text(`UPI Address  : ${company.upi_id}`, 10, leftInfoY + offset);
        offset += 4.5;
      }
      leftInfoY = leftInfoY + offset + 2;
    }
    
    // Terms block directly below Bank details with customized required terms and conditions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(2, 132, 199);
    doc.text('TERMS & CONDITIONS', 10, leftInfoY + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    
    // Custom requested default terms
    const defaultTerms = [
      "1. Goods once sold will not be taken back.",
      "2. Interest @18% p.a. will be charged if payment delayed.",
      "3. Guarantee/Warranty is only at Companies Service Center.",
      "   -If you have any service issue you can call on Toll Free No...............",
      "4. All Disputes Subject to DUNGARPUR Jurisdiction only."
    ];

    if (company && company.terms && company.terms.trim()) {
      const lines = company.terms.split('\n');
      lines.forEach((line: string, index: number) => {
        if (index < 5) { // safety limit
          doc.text(line.trim(), 10, leftInfoY + 8.5 + (index * 4));
        }
      });
    } else {
      defaultTerms.forEach((line: string, index: number) => {
        doc.text(line, 10, leftInfoY + 8.5 + (index * 4));
      });
    }
    
    // Right side context: Enlarged Clean Rounded Summary Box with Sky Accent & better spacing
    doc.saveGraphicsState();
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(224, 242, 254);
    doc.setLineWidth(0.4);
    doc.rect(118, finalY, 82, 42, 'F');
    doc.rect(118, finalY, 82, 42, 'D');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`Sub-Total:`, 122, finalY + 7);
    doc.text(`Rs. ${subTotal.toFixed(2)}`, 193, finalY + 7, { align: 'right' });
    
    doc.text(`GST Duty:`, 122, finalY + 14);
    doc.text(`Rs. ${totalGst.toFixed(2)}`, 193, finalY + 14, { align: 'right' });
    
    doc.text(`Shipping/Transport:`, 122, finalY + 21);
    doc.text(`Rs. ${transport.toFixed(2)}`, 193, finalY + 21, { align: 'right' });
    
    doc.setDrawColor(224, 242, 254);
    doc.setLineWidth(0.4);
    doc.line(121, finalY + 25, 196, finalY + 25);
    
    // Grand Total highlights
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(2, 132, 199); // Sky blue
    doc.text(`Grand Total:`, 122, finalY + 33);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, 193, finalY + 33, { align: 'right' });
    doc.restoreGraphicsState();
    
    // 7. Signature area at the bottom - shifted 4cm (40mm) down precisely
    const signatureAreaY = Math.max(leftInfoY + 25, finalY + 46) + 40;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('For ' + (company?.name || 'Authorized Outlet').toUpperCase(), 138, signatureAreaY);
    
    // Signature underline
    doc.setDrawColor(226, 232, 240);
    doc.line(134, signatureAreaY + 14, 190, signatureAreaY + 14);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('(Authorised Signatory)', 138, signatureAreaY + 18);
    
    // Print short small brand partnership footer 
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("DELIVERING EXCELLENCE WITH DELL * HP * ASUS * ACER * LENOVO IN IT COMPUTE SOLUTIONS", 105, 284, { align: 'center' });

    // Save/Output file direct action
    const fileName = `${invoice?.invoice_no || 'invoice'}.pdf`;
    doc.save(fileName);
  } catch (error: any) {
    console.error("Critical error during PDF synthesis: ", error);
    alert(`Could not output the PDF file: ${error?.message || error}`);
  }
};

export const generatePurchasePDF = (company: any, purchase: any, items: any[], vendor: any) => {
  try {
    const doc = new jsPDF();
    
    // 1. Draw Page Outer Border for Premium Layout Craftsmanship
    doc.setDrawColor(249, 115, 22); // Orange layout boundary for Purchases to clearly distinguish from Sales
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 280, 'D');
    
    // 2. Add Ambient Artistic Diagonal Watermark across the Background
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(35);
    doc.setTextColor(255, 247, 237); // Light orange background hue
    const storageKey = company?.id ? `premium_watermark_${company.id}` : 'premium_watermark_global';
    const watermarkText = (typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null) || company?.name || 'DAMSON BILLING';
    doc.text(watermarkText.toUpperCase(), 50, 160, { angle: 28 });
    doc.setFontSize(16);
    doc.text("DELL * HP * ASUS * ACER * LENOVO  -  AUTHORIZED PARTNER", 45, 178, { angle: 28 });
    doc.restoreGraphicsState();

    // 3. Custom Header Layout
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12); // Orange-600 focus color for purchase
    const companyName = (company?.name || 'DAMSON BILLING').toUpperCase();
    doc.text(companyName, 15, 22);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(249, 115, 22); // Orange-500
    doc.text("AUTHORISED RETAIL PARTNER & SERVICE HUB", 15, 28);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(company?.address || '12, Electronic Plaza, New Delhi', 15, 31.5);
    doc.text(`GSTIN: ${company?.gstin || 'N/A'}`, 15, 36);
    doc.text(`Contact: ${company?.mobile || 'N/A'} | WhatsApp No: ${company?.whatsapp || 'N/A'} | E-mail: ${company?.email || 'N/A'}`, 15, 40.5);
    
    // Right side of header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(234, 88, 12); // Orange-600
    doc.text("PURCHASE TAX BILL", 198, 22, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("INWARD INVENTORY MATERIAL STATEMENT", 198, 27, { align: 'right' });
    
    // Segment Separator
    doc.setDrawColor(254, 215, 170); // Orange-200
    doc.line(12, 45.5, 198, 45.5);
    
    // 4. Dual Grid Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(234, 88, 12);
    doc.text('PURCHASE RECORD DETAILS', 15, 51);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`Bill Number          :  ${purchase?.bill_no || 'N/A'}`, 15, 57);
    doc.text(`Record Date        :  ${new Date(purchase?.date || Date.now()).toLocaleDateString()}`, 15, 62);
    doc.text(`Payment Mode   :  ${purchase?.payment_mode || 'Cash'}`, 15, 67);
    
    // Right Grid: Vendor Information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(234, 88, 12);
    doc.text('BILL FROM (VENDOR)', 115, 51);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(vendor?.name || 'Walk-in Vendor', 115, 57);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    doc.text(vendor?.address || 'No Address Provided', 115, 62);
    doc.text(`GSTIN: ${vendor?.gstin || 'N/A'} | Mob: ${vendor?.mobile || 'N/A'}`, 115, 67);
    
    doc.setDrawColor(254, 215, 170);
    doc.line(12, 73, 198, 73);
    
    // 5. Items Grid for Purchase List with Orange Headers
    const tableData = (items || []).map((item, index) => [
      index + 1,
      item?.product_name || item?.name || 'Inventory Item',
      item?.quantity || 1,
      `Rs. ${Number(item?.price || 0).toFixed(2)}`,
      item?.gst_rate ? `${item.gst_rate}%` : '0%',
      `Rs. ${(Number(item?.price || 0) * Number(item?.quantity || 1) * (1 + (item?.gst_rate || 0)/100)).toFixed(2)}`
    ]);
    
    const tableConfig = {
      startY: 78,
      margin: { left: 10 },
      head: [['Sr.', 'Item / Service Description', 'Qty', 'Rate', 'GST Rate', 'Total Amount']],
      body: tableData,
      theme: 'grid' as const,
      headStyles: { 
        fillColor: [234, 88, 12] as [number, number, number], // Orange-600
        textColor: [255, 255, 255] as [number, number, number], 
        fontStyle: 'bold' as const, 
        fontSize: 9.5 
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3.5, 
        font: 'helvetica',
        valign: 'middle' as const,
        overflow: 'linebreak' as const 
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' as const },
        1: { cellWidth: 94 },
        2: { cellWidth: 16, halign: 'center' as const },
        3: { cellWidth: 24, halign: 'right' as const },
        4: { cellWidth: 20, halign: 'center' as const },
        5: { cellWidth: 26, halign: 'right' as const }
      }
    };
    
    if (typeof autoTable === 'function') {
      autoTable(doc, tableConfig);
    } else if (autoTable && typeof (autoTable as any).default === 'function') {
      (autoTable as any).default(doc, tableConfig);
    } else if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(tableConfig);
    }
    
    let finalY = 125;
    if ((doc as any).lastAutoTable && typeof (doc as any).lastAutoTable.finalY === 'number') {
      finalY = (doc as any).lastAutoTable.finalY + 8;
    } else if ((doc as any).previousAutoTable && typeof (doc as any).previousAutoTable.finalY === 'number') {
      finalY = (doc as any).previousAutoTable.finalY + 8;
    }
    
    if (finalY > 155) {
      doc.addPage();
      doc.setDrawColor(254, 215, 170);
      doc.rect(8, 8, 194, 280, 'D');
      finalY = 20;
    }

    const subTotal = (items || []).reduce((sum, item) => sum + (Number(item?.price || 0) * Number(item?.quantity || 1)), 0);
    const totalGst = (items || []).reduce((sum, item) => sum + (Number(item?.gst_amount) || (Number(item?.price || 0) * Number(item?.quantity || 1) * (item?.gst_rate || 0)/100)), 0);
    const transport = Number(purchase?.transport_charge || 0);
    const grandTotal = Number(purchase?.total_amount || (subTotal + totalGst + transport));
    
    // Left side: Partner brand box
    const dealerY = finalY;
    doc.saveGraphicsState();
    doc.setFillColor(255, 247, 237); // Light orange bg
    doc.setDrawColor(253, 186, 116);
    doc.setLineWidth(0.4);
    doc.rect(10, dealerY, 103, 17, 'F');
    doc.rect(10, dealerY, 103, 17, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(194, 65, 12); // Orange-700
    doc.text("STOCK CONTROLLED & AUDITED ENTRIES", 61.5, dealerY + 5.5, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(234, 88, 12);
    doc.text("INWARD GOODS LEDGER STATEMENT COPY", 61.5, dealerY + 11.5, { align: 'center' });
    doc.restoreGraphicsState();

    let leftInfoY = dealerY + 21;
    
    // Notes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(234, 88, 12);
    doc.text('AUDIT & COMPLIANCE RULES', 10, leftInfoY + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('1. All purchase entries correspond to real inward supplier invoices.', 10, leftInfoY + 8.5);
    doc.text('2. Stock balances updated immediately upon confirmation of receipt.', 10, leftInfoY + 12.5);
    doc.text('3. Input Tax Credit (ITC) as per matching GSTR-2B compliance.', 10, leftInfoY + 16.5);
    
    // Right summary box
    doc.saveGraphicsState();
    doc.setFillColor(255, 250, 245);
    doc.setDrawColor(254, 215, 170);
    doc.setLineWidth(0.4);
    doc.rect(118, finalY, 82, 42, 'F');
    doc.rect(118, finalY, 82, 42, 'D');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`Sub-Total:`, 122, finalY + 7);
    doc.text(`Rs. ${subTotal.toFixed(2)}`, 193, finalY + 7, { align: 'right' });
    
    doc.text(`Gst Amount:`, 122, finalY + 14);
    doc.text(`Rs. ${totalGst.toFixed(2)}`, 193, finalY + 14, { align: 'right' });
    
    doc.text(`Freight/Inward:`, 122, finalY + 21);
    doc.text(`Rs. ${transport.toFixed(2)}`, 193, finalY + 21, { align: 'right' });
    
    doc.setDrawColor(254, 215, 170);
    doc.setLineWidth(0.4);
    doc.line(121, finalY + 25, 196, finalY + 25);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(234, 88, 12);
    doc.text(`Total Amount:`, 122, finalY + 33);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, 193, finalY + 33, { align: 'right' });
    doc.restoreGraphicsState();
    
    const signatureAreaY = Math.max(leftInfoY + 25, finalY + 46) + 40;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Verified By: ' + (company?.name || 'Authorized Outlet').toUpperCase(), 138, signatureAreaY);
    
    doc.setDrawColor(254, 215, 170);
    doc.line(134, signatureAreaY + 14, 190, signatureAreaY + 14);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('(Store In-charge Sign)', 138, signatureAreaY + 18);
    
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("INWARD INVENTORY MANAGEMENT & LEDGER ARCHIVE STATEMENT", 105, 284, { align: 'center' });

    const fileName = `purchase_${purchase?.bill_no || 'record'}.pdf`;
    doc.save(fileName);
  } catch (error: any) {
    console.error("Critical error during Purchase PDF synthesis: ", error);
    alert(`Could not output the Purchase PDF: ${error?.message || error}`);
  }
};

export const generateResortInvoicePDF = (company: any, booking: any) => {
  try {
    const doc = new jsPDF();
    
    // 1. Draw Page Outer Border
    doc.setDrawColor(20, 184, 166); // Teal color for resort theme
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 280, 'D');
    
    // 2. Artistic Diagonal Watermark
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(240, 253, 250); // extremely light teal
    const watermarkText = company?.name || 'DAMSON RESORT & RETREAT';
    doc.text(watermarkText.toUpperCase(), 35, 160, { angle: 28 });
    doc.restoreGraphicsState();

    // 3. Header Section (Elegant Teal Corporate Styling)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136); // Teal-600
    doc.text((company?.name || 'DAMSON RESORT & GUEST HOUSE').toUpperCase(), 15, 24);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 184, 166); // Teal-500
    doc.text("PREMIUM ACCOMMODATION & LEISURE RETREAT", 15, 30);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(company?.address || 'Green Meadows Resort Drive, Udaipur', 15, 34);
    doc.text(`GSTIN: ${company?.gstin || 'N/A'} | Contact: ${company?.mobile || 'N/A'}`, 15, 38);
    doc.text(`Email: ${company?.email || 'N/A'} | WhatsApp: ${company?.whatsapp || 'N/A'}`, 15, 42);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(13, 148, 136);
    doc.text("GUEST INVOICE / BOOKING RECEIPT", 198, 24, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("CONFIRMED ROOM RESERVATION COPY", 198, 29, { align: 'right' });

    doc.setDrawColor(153, 246, 228);
    doc.line(12, 47, 198, 47);
    
    // 4. Booking & Guest details grid
    // Left Grid: Guest Profile
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136);
    doc.text('GUEST INFORMATION', 15, 53);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(booking?.guest_name || 'N/A', 15, 59);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    doc.text(`Mobile: ${booking?.mobile || 'N/A'}`, 15, 64);
    doc.text(`Address: ${booking?.address || 'N/A'}`, 15, 69);
    doc.text(`ID Proof Verified: ${booking?.id_proof || 'Yes (PAN/Aadhaar)'}`, 15, 74);
    
    // Right Grid: Stay Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136);
    doc.text('STAY & RESERVATION DETAILS', 115, 53);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text(`Invoice No     :  RES-${booking?.id || 'DRAFT'}`, 115, 59);
    doc.text(`Room No        :  Room ${booking?.room_no || 'N/A'}`, 115, 64);
    doc.text(`Room Type      :  ${booking?.room_type || 'N/A'}`, 115, 69);
    doc.text(`Check In       :  ${booking?.check_in || 'N/A'}`, 115, 74);
    doc.text(`Check Out      :  ${booking?.check_out || 'N/A'}`, 115, 79);
    doc.text(`Stay Nights    :  ${booking?.nights || 1} Night(s)`, 115, 84);

    doc.setDrawColor(153, 246, 228);
    doc.line(12, 89, 198, 89);

    // 5. Build Booking Breakdown Table
    const perNight = Number(booking?.per_night_charge || 0);
    const nightsCount = Number(booking?.nights || 1);
    const subTotal = perNight * nightsCount;
    const gstRate = Number(booking?.gst_rate || 12);
    const gstAmount = subTotal * (gstRate / 100);
    const grandTotal = Number(booking?.total_amount || (subTotal + gstAmount));

    const tableData = [
      [
        1,
        `Luxury Stay Accommodation - Room ${booking?.room_no || ''} (${booking?.room_type || ''})`,
        `${booking?.nights || 1} Night(s)`,
        `Rs. ${perNight.toFixed(2)}`,
        `${gstRate}%`,
        `Rs. ${grandTotal.toFixed(2)}`
      ]
    ];

    const tableConfig = {
      startY: 94,
      margin: { left: 10 },
      head: [['Sr.', 'Room Reservation Description', 'Duration', 'Night Tariff', 'GST Rate', 'Total Stay Charge']],
      body: tableData,
      theme: 'grid' as const,
      headStyles: { 
        fillColor: [13, 148, 136] as [number, number, number], // Teal-600
        textColor: [255, 255, 255] as [number, number, number], 
        fontStyle: 'bold' as const, 
        fontSize: 9.5 
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 4, 
        font: 'helvetica',
        valign: 'middle' as const,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' as const },
        1: { cellWidth: 92 },
        2: { cellWidth: 22, halign: 'center' as const },
        3: { cellWidth: 22, halign: 'right' as const },
        4: { cellWidth: 18, halign: 'center' as const },
        5: { cellWidth: 30, halign: 'right' as const }
      }
    };

    if (typeof autoTable === 'function') {
      autoTable(doc, tableConfig);
    } else if (autoTable && typeof (autoTable as any).default === 'function') {
      (autoTable as any).default(doc, tableConfig);
    } else if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(tableConfig);
    }

    let finalY = 135;

    // Summary block on bottom right
    doc.saveGraphicsState();
    doc.setFillColor(242, 252, 251); // Teal-50
    doc.setDrawColor(153, 246, 228);
    doc.setLineWidth(0.4);
    doc.rect(118, finalY, 82, 35, 'F');
    doc.rect(118, finalY, 82, 35, 'D');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`Stay Sub-Total:`, 122, finalY + 7);
    doc.text(`Rs. ${subTotal.toFixed(2)}`, 193, finalY + 7, { align: 'right' });
    
    doc.text(`Teal Room Luxury GST (${gstRate}%):`, 122, finalY + 14);
    doc.text(`Rs. ${gstAmount.toFixed(2)}`, 193, finalY + 14, { align: 'right' });
    
    doc.setDrawColor(153, 246, 228);
    doc.line(121, finalY + 19, 196, finalY + 19);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136); // Teal-600
    doc.text(`Grand Total Amount:`, 122, finalY + 26);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, 193, finalY + 26, { align: 'right' });
    doc.restoreGraphicsState();

    // QR Code visual placeholder on left side
    const qrsY = finalY;
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(20, 184, 166);
    doc.rect(10, qrsY, 103, 17, 'F');
    doc.rect(10, qrsY, 103, 17, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(13, 148, 136);
    doc.text("FAST UPI SCAN PAYMENT ENABLED", 61.5, qrsY + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);
    doc.text(company?.upi_id ? `Please scan or pay direct to UPI ID: ${company.upi_id}` : "Scan code at reception counter or request checkout invoice details", 61.5, qrsY + 11, { align: 'center' });

    let leftInfoY = qrsY + 21;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(13, 148, 136);
    doc.text('RESORT CHECKOUT POLICIES', 10, leftInfoY + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text('1. Checkout time is strictly 11:00 AM. Delayed checkouts attract half-day charges.', 10, leftInfoY + 9);
    doc.text('2. ID verification mandatory upon reservation entry.', 10, leftInfoY + 13);
    doc.text('3. Guest is responsible for any damage to premium room equipment or amenities.', 10, leftInfoY + 17);

    // Signature Area
    const signatureAreaY = Math.max(leftInfoY + 23, finalY + 39) + 40;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Approved Guest Signature', 20, signatureAreaY);
    doc.text('Reception desk: ' + (company?.name || 'Damson').toUpperCase(), 130, signatureAreaY);
    
    doc.setDrawColor(203, 213, 225);
    doc.line(15, signatureAreaY + 14, 75, signatureAreaY + 14);
    doc.line(125, signatureAreaY + 14, 185, signatureAreaY + 14);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('(Signature of Guest)', 35, signatureAreaY + 18);
    doc.text('(Authorised Receptionist)', 145, signatureAreaY + 18);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("CRAFTED GUEST CHECKOUT DETAILS  *  DAMSON RESORTS  *  HOSPITALITY ERP ENGINE", 105, 284, { align: 'center' });

    doc.save(`Resort_Stay_RES-${booking?.id || 'Bill'}.pdf`);
  } catch (error: any) {
    console.error("Resort Invoice generation error: ", error);
    alert(`Could not output resort PDF: ${error?.message || error}`);
  }
};
