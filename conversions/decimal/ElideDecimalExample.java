/**
 * Java Integration Example for elide-decimal
 *
 * This demonstrates calling the TypeScript decimal.js implementation from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One decimal library shared across TypeScript and Java
 * - Consistent financial calculations across all JVM services
 * - No BigDecimal vs JavaScript Number discrepancies
 * - Perfect for Spring Boot, payment processing, banking
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideDecimalExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Decimal ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value Decimal = context.eval("js",
        //     "const { Decimal } = require('./elide-decimal.ts'); Decimal;");

        // Example 1: Fix Floating-Point Errors
        // System.out.println("Java native: 0.1 + 0.2 = " + (0.1 + 0.2));  // 0.30000000000000004
        //
        // Value decA = Decimal.newInstance("0.1");
        // Value decB = Decimal.newInstance("0.2");
        // Value sum = decA.invokeMember("plus", decB);
        // System.out.println("Decimal:     0.1 + 0.2 = " + sum.invokeMember("toString").asString());
        // System.out.println();

        // Example 2: Spring Boot Payment Service
        // @Service
        // public class PaymentService {
        //     private final Value Decimal;
        //
        //     public PaymentService(Context graalContext) {
        //         this.Decimal = graalContext.eval("js",
        //             "require('./elide-decimal.ts').Decimal");
        //     }
        //
        //     public String calculateTotal(String amount, String feePercent) {
        //         Value amountDec = Decimal.newInstance(amount);
        //         Value feeDec = Decimal.newInstance(feePercent);
        //
        //         Value fee = amountDec.invokeMember("times", feeDec);
        //         Value total = amountDec.invokeMember("plus", fee);
        //
        //         return total.invokeMember("toFixed", 2).asString();
        //     }
        // }
        //
        // PaymentService service = new PaymentService(context);
        // String total = service.calculateTotal("99.99", "0.029");
        // System.out.println("Payment total: $" + total);

        // Example 3: JPA Entity with Precise Pricing
        // @Entity
        // public class Order {
        //     @Id
        //     @GeneratedValue
        //     private Long id;
        //
        //     private String amount;  // Store as string for precision
        //     private String taxRate;
        //
        //     @Transient
        //     private PaymentService paymentService;
        //
        //     public String getTotalWithTax() {
        //         Value amountDec = Decimal.newInstance(amount);
        //         Value taxDec = Decimal.newInstance(taxRate);
        //
        //         Value tax = amountDec.invokeMember("times", taxDec);
        //         Value total = amountDec.invokeMember("plus", tax);
        //
        //         return total.invokeMember("toFixed", 2).asString();
        //     }
        // }

        // Example 4: Currency Conversion
        // public class CurrencyConverter {
        //     private final Value Decimal;
        //
        //     public CurrencyConverter(Value Decimal) {
        //         this.Decimal = Decimal;
        //     }
        //
        //     public String convertUsdToEur(String usdAmount) {
        //         Value amount = Decimal.newInstance(usdAmount);
        //         Value rate = Decimal.newInstance("0.92");
        //         Value converted = amount.invokeMember("times", rate);
        //         return converted.invokeMember("toFixed", 2).asString();
        //     }
        // }
        //
        // CurrencyConverter converter = new CurrencyConverter(Decimal);
        // String eurAmount = converter.convertUsdToEur("1000.50");
        // System.out.println("$1000.50 USD = €" + eurAmount + " EUR");

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot service processes payments");
        System.out.println("- Uses same TypeScript decimal implementation as Node.js API");
        System.out.println("- Guarantees identical precision for financial transactions");
        System.out.println("- No BigDecimal vs JavaScript rounding issues");
        System.out.println();

        System.out.println("Example: Payment Processing Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Decimal (TypeScript)       │");
        System.out.println("│   conversions/decimal/elide-decimal.ts");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Payment │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same financial precision everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: java.math.BigDecimal + JavaScript Number = different rounding");
        System.out.println("After: One Elide implementation = identical calculations");
        System.out.println();

        System.out.println("Spring Boot Integration (when ready):");
        System.out.println("  @Configuration");
        System.out.println("  public class ElideConfig {");
        System.out.println("      @Bean");
        System.out.println("      public Context graalContext() {");
        System.out.println("          return Context.newBuilder(\"js\")");
        System.out.println("              .allowAllAccess(true)");
        System.out.println("              .build();");
        System.out.println("      }");
        System.out.println();
        System.out.println("      @Bean");
        System.out.println("      public Value decimalClass(Context context) {");
        System.out.println("          return context.eval(\"js\",");
        System.out.println("              \"require('./elide-decimal.ts').Decimal\");");
        System.out.println("      }");
        System.out.println("  }");
        System.out.println();

        System.out.println("Payment Service Example:");
        System.out.println("  @Service");
        System.out.println("  public class PaymentService {");
        System.out.println("      @Autowired");
        System.out.println("      private Value Decimal;");
        System.out.println();
        System.out.println("      public String processPayment(String amount, String fee) {");
        System.out.println("          Value amt = Decimal.newInstance(amount);");
        System.out.println("          Value feeVal = Decimal.newInstance(fee);");
        System.out.println("          Value total = amt.invokeMember(\"plus\", feeVal);");
        System.out.println("          return total.invokeMember(\"toFixed\", 2).asString();");
        System.out.println("      }");
        System.out.println("  }");
        System.out.println();

        System.out.println("Performance Benefits:");
        System.out.println("- GraalVM JIT optimization");
        System.out.println("- Zero cold start overhead");
        System.out.println("- Shared runtime across services");
        System.out.println("- Native image compilation support");
        System.out.println();

        System.out.println("Financial Precision:");
        System.out.println("  // Java native double (WRONG):");
        System.out.println("  0.1 + 0.2 = 0.30000000000000004");
        System.out.println();
        System.out.println("  // Elide Decimal (CORRECT):");
        System.out.println("  Decimal(\"0.1\").plus(\"0.2\") = \"0.3\"");
        System.out.println();
        System.out.println("  // Perfect for banking and payments!");
    }
}
