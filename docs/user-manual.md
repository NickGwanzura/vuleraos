# VuleraOS User Manual

## Overview

VuleraOS is a multi-tenant Enterprise Resource Planning (ERP) system designed for Zimbabwean businesses. It handles inventory, sales, purchasing, accounting, HR, and payroll with built-in support for multi-currency, ZIMRA compliance, and mobile money payments.

## Getting Started

### Signing In

1. Go to your VuleraOS login page
2. Enter your email and password
3. Click **Sign in**

If you were invited by an admin, use the temporary password provided in the invitation email. You can change your password after signing in.

### Navigation

The left sidebar provides access to all modules:
- **Dashboard**: Overview of your business metrics
- **Sales**: Invoices and customers
- **Buying**: Purchase orders and suppliers
- **Stock**: Inventory items and stock movements
- **Accounting**: Payments and reconciliation
- **HR**: Employees and payroll
- **Reports**: Financial reports
- **Settings**: Business configuration

Use **⌘K** (or **Ctrl+K**) to quickly search across all records.

## Modules

### Dashboard
The dashboard shows key metrics: open invoices, low stock items, unreconciled payments, and recent activity. Use the quick action buttons to create records.

### Sales
**Invoices**
- Create invoices with multiple line items
- Search items while typing for quick selection
- Auto-calculated totals and VAT
- Print invoices with your business letterhead
- Issue fiscal invoices for ZIMRA compliance
- Track payment status (Draft → Fiscal → Paid)

**Customers**
- Manage customer records with BP Numbers
- View customer invoice history

### Buying
**Purchase Orders**
- Create purchase orders with line items
- Submit for approval workflow
- Receive stock against purchase orders (auto-updates inventory)
- Track order status (Draft → Approved → Received)

**Suppliers**
- Manage supplier records
- View supplier purchase history

### Stock
**Items**
- Create and manage stock items with SKU, barcode, and categories
- Set minimum stock levels for alerts
- Track stock movements (IN, OUT, Adjustment)
- View stock transaction history per item

### Accounting
**Payments**
- Record payments against invoices
- Support for EcoCash, OneMoney, RTGS, Bank Transfer, and Cash
- Auto-updates invoice payment status
- View payment history

**Reconciliation**
- Match unmatched payments to invoices
- Side-by-side view of payments and unpaid invoices

### HR
**Employees**
- Manage employee records with contact, employment, and payroll details
- Track statutory numbers (PAYE, NSSA)

**Payroll**
- Run payroll for all active employees
- Automatic calculation of PAYE, NSSA, NEC, and AID deductions
- Process payroll and mark as paid
- Per-employee breakdown

### Reports
- **VAT Return**: ZIMRA-compliant VAT report with CSV export
- **Inflation-Adjusted**: Revenue and stock valuation adjusted for currency movement

### Settings
- **General**: Business name, BP Number, business type
- **Currency**: Exchange rate management with parallel market tracking
- **Fiscal Devices**: Register ZIMRA fiscal devices
- **Users**: Invite and manage users with role-based access
- **Documents**: Customise invoice letterhead

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| ⌘K / Ctrl+K | Global search |
| ⌘S / Ctrl+S | Save current form |
| Escape | Close dialog / search |

## Roles & Permissions

| Role | Access |
|---|---|
| **Owner** | Full access to all modules and settings |
| **Admin** | Full access except changing subscription/owner |
| **Accountant** | Sales, Buying, Accounting, Reports |
| **Cashier** | Sales (invoices, payments), limited Stock view |
| **Staff** | Basic view access as configured |

## Offline Usage

VuleraOS queues transactions when you lose connectivity:
1. The sync indicator in the header shows your connection status
2. When offline, transactions are stored locally
3. When connectivity returns, queued transactions sync automatically
4. Click the sync indicator to manually trigger a sync

## Support

For support, contact your system administrator or the VuleraOS support team.
