# Currency Configuration Guide

VuleraOS supports dual-currency operations with USD and ZWG (Zimbabwe Gold) as the primary pair.

## Initial Setup

When you register a new business, both USD and ZWG are created automatically. USD is set as the base currency by default.

## Managing Exchange Rates

### Settings → Currency

1. Navigate to **Settings → Currency**
2. View the current rate card showing:
   - **Official Rate**: The interbank rate (e.g., 1 USD = 26.5000 ZWG)
   - **Parallel Market Rate**: The informal market rate (e.g., 1 USD = 32.0000 ZWG)
   - **Status**: Whether the rate is auto-calculated or manually overridden

### Adding a New Rate

1. Click **"Add Rate"**
2. Enter:
   - **Date**: The effective date for this rate
   - **Official Rate**: The USD → ZWG exchange rate
   - **Parallel Market Rate**: (Optional) The parallel market rate
   - **Manual Override**: Check this if you're setting a rate different from the interbank rate
3. Click **"Add Rate"**

### Rate History

The rate history shows the last 90 days of exchange rates. Each entry displays:
- Date the rate was effective
- The official rate
- The parallel market rate (if set)
- Who created the rate
- Whether it was a manual override

## Using Dual Currency

### Invoicing
When creating an invoice:
1. Select the currency (USD or ZWG)
2. Enter line items with prices in that currency
3. The invoice total is calculated in the selected currency
4. The equivalent in the other currency can be displayed on the invoice printout

### Reporting
Reports can show figures in either currency. The **Inflation-Adjusted Report** restates historical values using exchange rates at the time of each transaction.

### Exchange Rate on Transactions
Every financial transaction stores:
- The currency used
- The exchange rate at the time of the transaction
- Whether the rate was a manual override

This ensures historical accuracy even as rates change.

## Tips

- **Update rates daily**: For accurate reporting, enter the day's rate each business day
- **Use parallel market tracking**: The parallel market rate is a separate reference field — it doesn't affect calculations unless you explicitly use it
- **Manual overrides**: On days when the interbank rate lags significantly behind market reality, use the manual override to set a more realistic rate
