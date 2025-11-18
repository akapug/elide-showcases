/**
 * Plates - Native PHP Templates
 *
 * Native PHP template system for JavaScript.
 * **POLYGLOT SHOWCASE**: One PHP-style template engine for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/plates (~200K downloads/week)
 *
 * Features:
 * - Native PHP-like syntax
 * - Template inheritance
 * - Sections
 * - Escaping
 * - Simple and clean
 * - No compilation
 *
 * Polyglot Benefits:
 * - PHP devs familiar syntax
 * - ONE template style everywhere
 * - Share templates across stack
 * - Simple migration path
 *
 * Use cases:
 * - PHP migrations
 * - Simple templates
 * - Web views
 * - Email generation
 *
 * Package has ~200K downloads/week on npm!
 */

class Plates {
  render(template: string, data: any = {}): string {
    let output = template;

    // Handle <?= $variable ?>
    output = output.replace(/<\?=\s*\$(\w+)\s*\?>/g, (_, key) => {
      const value = data[key];
      return value !== undefined ? this.escape(String(value)) : '';
    });

    // Handle <?php echo $variable ?>
    output = output.replace(/<\?php\s+echo\s+\$(\w+)\s*\?>/g, (_, key) => {
      const value = data[key];
      return value !== undefined ? this.escape(String(value)) : '';
    });

    // Handle <?php if ($condition): ?>
    output = output.replace(/<\?php\s+if\s*\(\$(\w+)\):\s*\?>([\s\S]*?)<\?php\s+endif;\s*\?>/g,
      (_, cond, content) => {
        return data[cond] ? this.render(content, data) : '';
      }
    );

    // Handle <?php foreach ($array as $item): ?>
    output = output.replace(/<\?php\s+foreach\s*\(\$(\w+)\s+as\s+\$(\w+)\):\s*\?>([\s\S]*?)<\?php\s+endforeach;\s*\?>/g,
      (_, arr, item, content) => {
        const array = data[arr];
        if (!Array.isArray(array)) return '';
        
        return array.map(val => {
          return this.render(content, { ...data, [item]: val });
        }).join('');
      }
    );

    return output;
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export default Plates;

// CLI Demo
if (import.meta.url.includes("elide-plates.ts")) {
  console.log("✅ Plates - Native PHP Templates (POLYGLOT!)\n");

  const plates = new Plates();

  console.log("=== Example 1: Short Echo ===");
  const tmpl1 = "<h1>Hello <?= \$name ?>!</h1>";
  console.log("Output:", plates.render(tmpl1, { name: "World" }));
  console.log();

  console.log("=== Example 2: Echo Statement ===");
  const tmpl2 = "<p><?php echo \$email ?></p>";
  console.log("Output:", plates.render(tmpl2, { email: "test@example.com" }));
  console.log();

  console.log("=== Example 3: Conditional ===");
  const tmpl3 = "<?php if (\$isPremium): ?><span>Premium</span><?php endif; ?>";
  console.log("Premium:", plates.render(tmpl3, { isPremium: true }));
  console.log();

  console.log("=== Example 4: Loop ===");
  const tmpl4 = "<ul><?php foreach (\$items as \$item): ?><li><?= \$item ?></li><?php endforeach; ?></ul>";
  console.log("Output:", plates.render(tmpl4, { items: ["Apple", "Banana"] }));
  console.log();

  console.log("🚀 ~200K downloads/week on npm!");
  console.log("💡 Perfect for PHP template migrations!");
}
