# ZIMRA Compliance Guide

VuleraOS is designed to support ZIMRA compliance requirements for Zimbabwean businesses.

## Prerequisites

### Business Requirements
Before issuing fiscal invoices, ensure your business has:
1. A **BP Number** (Business Partner / VAT Registration Number) set in Settings
2. A registered **Fiscal Device**

### Customer Requirements
Before issuing a fiscal invoice to a customer, the customer must have:
1. A **BP Number** on their customer record

## Setting Up

### 1. Set Your BP Number

**Settings → General**
- Enter your **BP/VAT Registration Number** (e.g., BP1234567)
- This appears on all fiscal invoices

### 2. Register a Fiscal Device

**Settings → Fiscal Devices**
1. Click **"Register Device"**
2. Enter:
   - **Device ID**: Your fiscal device identifier (e.g., FD-001)
   - **Serial Number**: The device serial number from your fiscal device
   - **Model**: The device model (e.g., ZRA-FD-2000)
3. Click **"Register"**

### 3. Ensure Customer BP Numbers

When creating customers, enter their BP Number. This is required for fiscal invoicing.

## Issuing a Fiscal Invoice

### From Invoice Detail

1. Create a new invoice (Draft status)
2. Ensure the customer has a BP Number
3. Open the invoice detail page
4. Click **"Update Status"**
5. Select **"Fiscal (Issue Invoice)"**
6. Confirm

The system will:
- Validate that both your business and the customer have BP Numbers
- Generate a fiscal receipt number (e.g., F2025-000001)
- Mark the invoice as fiscalised
- Record the fiscalisation in the audit log

### Status Flow

```
DRAFT → FISCAL → PAID (or PARTIALLY_PAID / OVERDUE)
```

## VAT Calculation

- **Standard rate**: 15% (default)
- **Zero-rated**: 0% (for qualifying exports)
- **Exempt**: Certain goods and services

VAT is calculated per line item. You can override the VAT rate on individual line items in the invoice form.

## VAT Return Report

**Reports → VAT Return**

1. Select the reporting period (From / To dates)
2. Click **"Generate Report"**
3. View:
   - **Output VAT**: VAT on sales invoices in the period
   - **Input VAT**: VAT on purchases in the period (simplified)
   - **Net VAT Due**: Output VAT minus Input VAT
4. Download as CSV for ZIMRA filing

## Fiscal Device Management

### Device Status
- **ACTIVE**: Device is operational and can fiscalise invoices
- **INACTIVE**: Device is not operational

### Monitoring
The Fiscal Devices page shows:
- Each registered device with its model and serial number
- How many invoices have been fiscalised per device
- Last communication date
- Current status

## Future: FDMS Integration

VuleraOS has the architecture in place for future integration with ZIMRA's FDMS (Fiscal Device Management System). When FDMS APIs become available:

1. Fiscal devices will transmit invoices electronically
2. Real-time validation with ZIMRA systems
3. Automatic receipt number assignment

The current system generates receipt numbers locally but can be extended to use FDMS endpoints.
