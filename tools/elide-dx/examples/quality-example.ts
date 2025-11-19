/**
 * Example: Using Code Quality Tools (Linter, Formatter, Type Checker)
 */

import { ElideLinter } from '../quality/src/linter';
import { ElideFormatter } from '../quality/src/formatter';
import { ElideTypeChecker } from '../quality/src/type-checker';

async function main() {
  console.log('Code Quality Tools Example\n');
  console.log('='.repeat(60) + '\n');

  // Example source code with issues
  const sourceCode = `
const x=42;
var y = "hello"
function add(a,b){
return a+b
}
if(x==42){
console.log(y)
}
eval("dangerous code")
  `.trim();

  console.log('ORIGINAL CODE:');
  console.log('─'.repeat(60));
  console.log(sourceCode);
  console.log('─'.repeat(60) + '\n');

  // ===========================
  // LINTING
  // ===========================
  console.log('1. LINTING\n');

  const linter = new ElideLinter({
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'no-var': 'error',
      'eqeqeq': 'error',
      'no-eval': 'error',
      'no-debugger': 'error'
    },
    ignorePatterns: ['node_modules/**', 'dist/**']
  });

  console.log('Linting with rules:');
  for (const [rule, setting] of Object.entries(linter.getConfig().rules)) {
    console.log(`  - ${rule}: ${Array.isArray(setting) ? setting[0] : setting}`);
  }
  console.log('');

  const lintResult = await linter.lintFile('example.ts', sourceCode);

  console.log('Lint Results:');
  console.log(`  Errors:   ${lintResult.errorCount}`);
  console.log(`  Warnings: ${lintResult.warningCount}`);
  console.log(`  Fixable:  ${lintResult.fixableErrorCount + lintResult.fixableWarningCount}`);
  console.log('');

  if (lintResult.messages.length > 0) {
    console.log('Issues Found:');
    for (const msg of lintResult.messages) {
      const icon = msg.severity === 'error' ? '✗' : '⚠';
      console.log(`  ${icon} Line ${msg.line}:${msg.column} - ${msg.message} [${msg.ruleId}]`);
    }
    console.log('');
  }

  // Auto-fix
  console.log('Applying auto-fixes...\n');
  const fixedCode = await linter.fix(sourceCode, lintResult.messages);
  console.log('FIXED CODE:');
  console.log('─'.repeat(60));
  console.log(fixedCode);
  console.log('─'.repeat(60) + '\n');

  // ===========================
  // FORMATTING
  // ===========================
  console.log('2. FORMATTING\n');

  const formatter = new ElideFormatter({
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    arrowParens: 'always'
  });

  console.log('Formatter configuration:');
  const config = formatter.getConfig();
  console.log(`  Print Width:     ${config.printWidth}`);
  console.log(`  Tab Width:       ${config.tabWidth}`);
  console.log(`  Use Tabs:        ${config.useTabs}`);
  console.log(`  Semicolons:      ${config.semi}`);
  console.log(`  Single Quotes:   ${config.singleQuote}`);
  console.log(`  Trailing Comma:  ${config.trailingComma}`);
  console.log('');

  const formatResult = formatter.format(sourceCode, 'example.ts');

  console.log('Format Result:');
  console.log(`  Changed: ${formatResult.changed ? 'Yes' : 'No'}`);
  console.log('');

  if (formatResult.changed) {
    console.log('FORMATTED CODE:');
    console.log('─'.repeat(60));
    console.log(formatResult.formatted);
    console.log('─'.repeat(60) + '\n');
  }

  // Format different file types
  const jsonCode = '{"name":"example","version":"1.0.0","dependencies":{}}';
  const htmlCode = '<div><p>Hello</p><span>World</span></div>';
  const cssCode = 'body{margin:0;padding:0;font-size:16px}';

  console.log('Formatting different file types:\n');

  const jsonFormatted = formatter.format(jsonCode, 'package.json');
  console.log('JSON:');
  console.log(jsonFormatted.formatted);
  console.log('');

  const htmlFormatted = formatter.format(htmlCode, 'index.html');
  console.log('HTML:');
  console.log(htmlFormatted.formatted);
  console.log('');

  const cssFormatted = formatter.format(cssCode, 'styles.css');
  console.log('CSS:');
  console.log(cssFormatted.formatted);
  console.log('\n');

  // ===========================
  // TYPE CHECKING
  // ===========================
  console.log('3. TYPE CHECKING\n');

  const typeChecker = new ElideTypeChecker({
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noImplicitReturns: true
  });

  console.log('Type checker configuration:');
  const typeConfig = typeChecker.getConfig();
  console.log(`  Strict Mode:           ${typeConfig.strict}`);
  console.log(`  No Implicit Any:       ${typeConfig.noImplicitAny}`);
  console.log(`  Strict Null Checks:    ${typeConfig.strictNullChecks}`);
  console.log(`  No Unused Locals:      ${typeConfig.noUnusedLocals}`);
  console.log('');

  const typeCheckResult = await typeChecker.checkFile('example.ts', sourceCode);

  console.log('Type Check Results:');
  console.log(`  Errors:   ${typeCheckResult.errors.length}`);
  console.log(`  Warnings: ${typeCheckResult.warnings.length}`);
  console.log('');

  if (typeCheckResult.errors.length > 0) {
    console.log('Type Errors:');
    for (const error of typeCheckResult.errors) {
      console.log(`  ✗ Line ${error.line} - ${error.message} [TS${error.code}]`);
    }
    console.log('');
  }

  if (typeCheckResult.warnings.length > 0) {
    console.log('Type Warnings:');
    for (const warning of typeCheckResult.warnings) {
      console.log(`  ⚠ Line ${warning.line} - ${warning.message} [TS${warning.code}]`);
    }
    console.log('');
  }

  // ===========================
  // SUMMARY
  // ===========================
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Lint Errors:      ${lintResult.errorCount}`);
  console.log(`Lint Warnings:    ${lintResult.warningCount}`);
  console.log(`Fixable Issues:   ${lintResult.fixableErrorCount + lintResult.fixableWarningCount}`);
  console.log(`Format Changed:   ${formatResult.changed ? 'Yes' : 'No'}`);
  console.log(`Type Errors:      ${typeCheckResult.errors.length}`);
  console.log(`Type Warnings:    ${typeCheckResult.warnings.length}`);
  console.log('='.repeat(60) + '\n');

  // Rule documentation
  console.log('RULE DOCUMENTATION:\n');
  const rules = linter.getRules();
  console.log(`Available Rules: ${rules.length}\n`);

  for (const rule of rules.slice(0, 5)) {
    const doc = linter.getRuleDoc(rule);
    if (doc) {
      console.log(`${rule}:`);
      console.log(`  Type:        ${doc.type}`);
      console.log(`  Category:    ${doc.docs.category}`);
      console.log(`  Recommended: ${doc.docs.recommended}`);
      console.log(`  Description: ${doc.docs.description}`);
      console.log('');
    }
  }
}

main().catch(console.error);
