#!/usr/bin/env python3
"""
Python Integration Example for elide-decimal

This demonstrates calling the TypeScript decimal.js implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One decimal library shared across TypeScript and Python
- Consistent financial calculations across services
- No floating-point errors (0.1 + 0.2 = 0.3)
- Perfect for payment processing, currency calculations
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# Decimal = require('./elide-decimal.ts').Decimal

print("=== Python Calling TypeScript Decimal ===\n")

# Example 1: Fix Floating-Point Errors
# print("Python native: 0.1 + 0.2 =", 0.1 + 0.2)  # 0.30000000000000004
# dec_a = Decimal('0.1')
# dec_b = Decimal('0.2')
# print(f"Decimal:       0.1 + 0.2 = {dec_a.plus(dec_b).toString()}")  # 0.3
# print()

# Example 2: Financial Calculations
# price = Decimal('19.99')
# quantity = Decimal('100')
# tax_rate = Decimal('0.0825')  # 8.25%
#
# subtotal = price.times(quantity)
# tax = subtotal.times(tax_rate)
# total = subtotal.plus(tax)
#
# print(f"Price: ${price.toFixed(2)}")
# print(f"Quantity: {quantity.toString()}")
# print(f"Subtotal: ${subtotal.toFixed(2)}")
# print(f"Tax (8.25%): ${tax.toFixed(2)}")
# print(f"Total: ${total.toFixed(2)}")
# print()

# Example 3: Currency Conversion
# usd_amount = Decimal('1000.50')
# exchange_rate = Decimal('0.92')  # USD to EUR
# eur_amount = usd_amount.times(exchange_rate)
#
# print(f"USD: ${usd_amount.toFixed(2)}")
# print(f"Rate: {exchange_rate.toString()}")
# print(f"EUR: €{eur_amount.toFixed(2)}")
# print()

# Example 4: Payment Processing Pipeline
# def process_payment(amount_str, fee_percent_str):
#     """Process payment with precise decimal arithmetic"""
#     amount = Decimal(amount_str)
#     fee_percent = Decimal(fee_percent_str)
#
#     fee = amount.times(fee_percent)
#     total = amount.plus(fee)
#
#     return {
#         'amount': amount.toFixed(2),
#         'fee': fee.toFixed(2),
#         'total': total.toFixed(2)
#     }
#
# payment = process_payment('99.99', '0.029')  # 2.9% fee
# print("Payment Processing:")
# print(f"  Amount: ${payment['amount']}")
# print(f"  Fee (2.9%): ${payment['fee']}")
# print(f"  Total: ${payment['total']}")
# print()

# Example 5: Stripe-style Fee Calculation
# # Stripe charges 2.9% + $0.30 per transaction
# def calculate_stripe_fee(amount_str):
#     amount = Decimal(amount_str)
#     percentage_fee = amount.times(Decimal('0.029'))
#     fixed_fee = Decimal('0.30')
#     total_fee = percentage_fee.plus(fixed_fee)
#
#     return total_fee.toFixed(2)
#
# stripe_fee = calculate_stripe_fee('100.00')
# print(f"Stripe fee for $100.00: ${stripe_fee}")
# print()

# Example 6: Bulk Price Calculations
# products = [
#     {'name': 'Widget A', 'price': '12.99', 'qty': 5},
#     {'name': 'Widget B', 'price': '8.49', 'qty': 10},
#     {'name': 'Widget C', 'price': '24.95', 'qty': 3}
# ]
#
# print("Bulk Order Calculation:")
# grand_total = Decimal('0')
# for product in products:
#     price = Decimal(product['price'])
#     qty = Decimal(str(product['qty']))
#     subtotal = price.times(qty)
#     grand_total = grand_total.plus(subtotal)
#     print(f"  {product['name']:10} ${price.toFixed(2)} × {product['qty']} = ${subtotal.toFixed(2)}")
#
# print(f"  Grand Total: ${grand_total.toFixed(2)}")
# print()

print("Real-world use case:")
print("- Python payment processor calculates transaction fees")
print("- Uses same TypeScript decimal implementation as Node.js API")
print("- Guarantees identical precision for financial calculations")
print("- No floating-point errors, perfect for money")
print()

print("Example: Payment Processing System")
print("┌─────────────────────────────────────┐")
print("│   Elide Decimal (TypeScript)       │")
print("│   conversions/decimal/elide-decimal.ts")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Payments│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same precision everywhere!")
print()

print("Problem Solved:")
print("Before: Python decimal.Decimal + JavaScript Number = different precision")
print("After: One Elide implementation = identical financial calculations")
print()

print("Performance Benefits:")
print("- Zero cold start overhead with Elide")
print("- Instant decimal calculations")
print("- Shared runtime across languages")
print("- No Python decimal library import needed")
print()

print("Financial Precision Examples:")
print("  # Native Python float (WRONG):")
print("  0.1 + 0.2 = 0.30000000000000004")
print()
print("  # Elide Decimal (CORRECT):")
print("  Decimal('0.1').plus('0.2') = '0.3'")
print()
print("  # Payment processing:")
print("  $19.99 × 100 × 1.0825 = $2,163.92 (exact!)")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  Decimal = require('./elide-decimal.ts').Decimal")
print("  total = Decimal('19.99').times('100').toFixed(2)")
print("  # Perfect for payments!")
