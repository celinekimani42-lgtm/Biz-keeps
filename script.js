/* ==========================================================================
   BIZ KEEP - Kenyan SME Modern Fintech Management Platform
   script.js - Client-side interactive logic
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   Constants & sample data
   -------------------------------------------------------------------------- */
const VAT_RATE = 0.16; // Kenya standard VAT; receipt prices are VAT-inclusive

// Sample ledger data (Kenyan SME trade records)
const transactionsData = [
  {
    inv: '#INV-2024-089',
    date: '22/11/2024',
    time: '14:32',
    customer: 'Kamau Enterprises Ltd',
    phone: '+254 712 345 678',
    description: '50 Bags Bamburi Cement 50kg, Wire & Rebar',
    channel: 'M-PESA TILL',
    status: 'VERIFIED',
    ref: 'SH89K120LM',
    amount: 125000,
    items: [
      { name: 'Bamburi Cement 50kg', qty: 50, rate: 950, total: 47500 },
      { name: 'Binding Wire 16G', qty: 10, rate: 4500, total: 45000 },
      { name: 'D12 Y-Rebar TMT', qty: 25, rate: 1300, total: 32500 }
    ]
  },
  {
    inv: '#INV-2024-088',
    date: '21/11/2024',
    time: '11:05',
    customer: 'Otieno Electricals',
    phone: '+254 733 998 120',
    description: '12 rolls 2.5mm copper cable',
    channel: 'EQUITY BANK',
    status: 'PENDING',
    ref: 'EFT-88912',
    amount: 85000,
    items: [
      { name: '2.5mm Copper Cable', qty: 12, rate: 7083.33, total: 85000 }
    ]
  },
  {
    inv: '#INV-2024-087',
    date: '21/11/2024',
    time: '09:48',
    customer: 'Walk-in Counter Client',
    phone: 'OTC Cash Drawer',
    description: 'Heavy duty padlock and hinges',
    channel: 'CASH',
    status: 'VERIFIED',
    ref: 'CSH-0912',
    amount: 4200,
    items: [
      { name: 'Tri-Circle Padlock 70mm', qty: 2, rate: 1200, total: 2400 },
      { name: 'Heavy Duty Brass Hinges', qty: 6, rate: 300, total: 1800 }
    ]
  },
  {
    inv: '#INV-2024-086',
    date: '20/11/2024',
    time: '16:20',
    customer: 'Wanjiku Builders Co.',
    phone: '+254 720 114 982',
    description: 'Iron sheets 30G resin coated',
    channel: 'M-PESA PAYBILL',
    status: 'VERIFIED',
    ref: 'SH76P994TR',
    amount: 92400,
    items: [
      { name: 'Resin Coated Iron Sheets 30G', qty: 44, rate: 2100, total: 92400 }
    ]
  },
  {
    inv: '#INV-2024-085',
    date: '19/11/2024',
    time: '13:10',
    customer: 'Baraka Agro Supplies',
    phone: '+254 722 550 401',
    description: 'Wholesale chain link fencing mesh',
    channel: 'M-PESA TILL',
    status: 'VERIFIED',
    ref: 'SH61K442XX',
    amount: 48000,
    items: [
      { name: 'Chain Link Mesh 8ft (50m)', qty: 4, rate: 12000, total: 48000 }
    ]
  }
];

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

/** Escape text before inserting it into innerHTML (prevents XSS from user input). */
function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, (char) => map[char]);
}

/** 125000 -> "125,000" */
function formatWhole(amount) {
  return amount.toLocaleString('en-KE');
}

/** 125000 -> "125,000.00" */
function formatMoney(amount) {
  return amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/** Date -> "DD/MM/YYYY" */
function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

/** Date -> "HH:MM" */
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

/** Next sequential invoice number, e.g. "#INV-2024-090" */
function nextInvoiceNumber() {
  const highest = transactionsData.reduce((max, tx) => {
    const match = tx.inv.match(/(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const sequence = String(highest + 1).padStart(3, '0');
  return `#INV-${new Date().getFullYear()}-${sequence}`;
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();

  // Show today's date in the top bar
  const dateDisplay = document.getElementById('currentDateDisplay');
  if (dateDisplay) dateDisplay.textContent = formatDate(new Date());

  renderTable(transactionsData);

  // Search & filters
  ['transactionSearch', 'channelFilter', 'statusFilter'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', applyFilters);
  });

  setupEventListeners();
});

/* --------------------------------------------------------------------------
   Filtering
   -------------------------------------------------------------------------- */
function applyFilters() {
  const searchInput = document.getElementById('transactionSearch');
  const channelFilter = document.getElementById('channelFilter');
  const statusFilter = document.getElementById('statusFilter');

  const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const channel = channelFilter ? channelFilter.value : 'ALL';
  const status = statusFilter ? statusFilter.value : 'ALL';

  const filtered = transactionsData.filter((tx) => {
    const matchesSearch =
      tx.customer.toLowerCase().includes(term) ||
      tx.inv.toLowerCase().includes(term) ||
      tx.ref.toLowerCase().includes(term);
    const matchesChannel = channel === 'ALL' || tx.channel.toUpperCase() === channel;
    const matchesStatus = status === 'ALL' || tx.status === status;

    return matchesSearch && matchesChannel && matchesStatus;
  });

  renderTable(filtered);
}

/* --------------------------------------------------------------------------
   Rendering
   -------------------------------------------------------------------------- */

/** Render the ledger table rows. */
function renderTable(data) {
  const tbody = document.getElementById('incomeTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.forEach((tx) => {
    const tr = document.createElement('tr');
    tr.dataset.inv = tx.inv;
    tr.tabIndex = 0; // keyboard accessible

    let channelClass = 'mpesa';
    if (tx.channel.includes('BANK')) channelClass = 'bank';
    if (tx.channel.includes('CASH')) channelClass = 'cash';

    tr.innerHTML = `
      <td><strong class="text-primary font-mono">${escapeHtml(tx.inv)}</strong></td>
      <td class="text-neutral-500">${escapeHtml(tx.date)}</td>
      <td>
        <div class="font-bold text-neutral-900">${escapeHtml(tx.customer)}</div>
        <div class="text-[11px] text-neutral-400 font-mono">${escapeHtml(tx.phone)}</div>
      </td>
      <td class="text-neutral-600">${escapeHtml(tx.description)}</td>
      <td><span class="channel-pill ${channelClass}">${escapeHtml(tx.channel)}</span></td>
      <td class="font-bold text-neutral-900">KSh ${formatWhole(tx.amount)}</td>
      <td>
        <button type="button" class="btn btn-secondary text-xs view-receipt-btn" title="View receipt" aria-label="View receipt ${escapeHtml(tx.inv)}">
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
        </button>
      </td>
    `;

    // Click (or Enter) on a row to show it in the receipt preview
    tr.addEventListener('click', () => updateReceiptView(tx));
    tr.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') updateReceiptView(tx);
    });
    tbody.appendChild(tr);
  });

  const showingCount = document.getElementById('showingCount');
  if (showingCount) showingCount.textContent = data.length;

  if (window.lucide) window.lucide.createIcons();
}

/** Update the thermal receipt preview. */
function updateReceiptView(tx) {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('recNumber', tx.inv);
  setText('recDate', `${tx.date} ${tx.time || '14:32'} EAT`);
  setText('recCustomer', tx.customer);
  setText('recRef', tx.ref);
  setText('recGrandTotal', `KSh ${formatMoney(tx.amount)}`);

  // Subtotal & VAT (prices are VAT-inclusive)
  const net = Math.round((tx.amount / (1 + VAT_RATE)) * 100) / 100;
  const vat = Math.round((tx.amount - net) * 100) / 100;
  const totalRows = document.querySelectorAll('.receipt-totals-box .total-row');
  if (totalRows[0]) totalRows[0].lastElementChild.textContent = `KSh ${formatMoney(net)}`;
  if (totalRows[1]) totalRows[1].lastElementChild.textContent = `KSh ${formatMoney(vat)}`;

  // Line items
  const itemsTbody = document.getElementById('receiptItemsBody');
  if (itemsTbody) {
    itemsTbody.innerHTML = '';
    tx.items.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(item.name)}</td>
        <td class="text-center">${item.qty} x ${formatMoney(item.rate)}</td>
        <td class="text-right">${formatMoney(item.total)}</td>
      `;
      itemsTbody.appendChild(row);
    });
  }

  // On smaller screens the receipt sits below the table, so scroll to it
  if (window.innerWidth < 1024) {
    const sheet = document.getElementById('receiptSheet');
    if (sheet) sheet.scrollIntoView({ behavior: 'smooth' });
  }
}

/* --------------------------------------------------------------------------
   Event handlers
   -------------------------------------------------------------------------- */
function setupEventListeners() {
  // Print receipt
  const printBtn = document.getElementById('printReceiptBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  // WhatsApp / SMS share (placeholder)
  const whatsappBtn = document.getElementById('sendWhatsappBtn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      const inv = document.getElementById('recNumber')?.textContent ?? '';
      const amt = document.getElementById('recGrandTotal')?.textContent ?? '';
      alert(`Receipt ${inv} (${amt}) prepared! In production, this dispatches via Safaricom SMS Gateway / WhatsApp Cloud API.`);
    });
  }

  // Record new income (placeholder: replace the prompts with a real modal form)
  ['newIncomeBtn', 'openRecordModalBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', recordNewIncome);
  });

  // Log out (placeholder)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Log out from Mwangi Hardware SME session?')) {
        window.location.hash = '#login';
      }
    });
  }
}

/** Prompt for a customer and amount, then add a new ledger entry. */
function recordNewIncome() {
  const customer = prompt('Enter customer name:');
  if (!customer || !customer.trim()) return;

  const amountInput = prompt('Enter amount in KSh:');
  if (amountInput === null) return;

  const amount = Math.round(parseFloat(amountInput.replace(/,/g, '')) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    alert('Please enter a valid amount greater than 0.');
    return;
  }

  const now = new Date();
  const newTx = {
    inv: nextInvoiceNumber(),
    date: formatDate(now),
    time: formatTime(now),
    customer: customer.trim(),
    phone: '+254 7XX XXX XXX',
    description: 'Direct Counter Hardware Sale',
    channel: 'M-PESA TILL',
    status: 'VERIFIED',
    ref: 'SH' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    amount,
    items: [{ name: 'Direct Counter Sale', qty: 1, rate: amount, total: amount }]
  };

  transactionsData.unshift(newTx);
  applyFilters(); // re-render, respecting any active search/filters
  updateReceiptView(newTx);
}
