/**
 * Elide Code Analyzer
 * Dead code detection, complexity analysis, and duplicate finder
 */

export interface AnalysisResult {
  deadCode: DeadCodeReport[];
  complexity: ComplexityReport[];
  duplicates: DuplicateReport[];
  metrics: CodeMetrics;
}

export interface DeadCodeReport {
  file: string;
  line: number;
  type: 'function' | 'variable' | 'import' | 'class';
  name: string;
  reason: string;
}

export interface ComplexityReport {
  file: string;
  function: string;
  complexity: number;
  line: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

export interface DuplicateReport {
  files: string[];
  lines: number[];
  code: string;
  size: number;
}

export interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  totalFunctions: number;
  totalClasses: number;
  averageComplexity: number;
  maintainabilityIndex: number;
}

/**
 * Code Analyzer for Elide
 */
export class ElideCodeAnalyzer {
  /**
   * Analyze codebase
   */
  async analyze(files: Array<{ path: string; content: string }>): Promise<AnalysisResult> {
    console.log(`[Analyzer] Analyzing ${files.length} files...`);

    const deadCode = this.detectDeadCode(files);
    const complexity = this.analyzeComplexity(files);
    const duplicates = this.findDuplicates(files);
    const metrics = this.calculateMetrics(files);

    return {
      deadCode,
      complexity,
      duplicates,
      metrics
    };
  }

  /**
   * Detect dead code
   */
  private detectDeadCode(files: Array<{ path: string; content: string }>): DeadCodeReport[] {
    const report: DeadCodeReport[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');

      // Detect unused imports
      const imports = this.extractImports(file.content);
      const usedIdentifiers = this.extractUsedIdentifiers(file.content);

      for (const imp of imports) {
        if (!usedIdentifiers.has(imp.name)) {
          report.push({
            file: file.path,
            line: imp.line,
            type: 'import',
            name: imp.name,
            reason: 'Imported but never used'
          });
        }
      }

      // Detect unused functions
      const functions = this.extractFunctions(file.content);
      for (const func of functions) {
        if (!this.isFunctionCalled(func.name, file.content, files)) {
          report.push({
            file: file.path,
            line: func.line,
            type: 'function',
            name: func.name,
            reason: 'Function defined but never called'
          });
        }
      }

      // Detect unused variables
      const variables = this.extractVariables(file.content);
      for (const varDecl of variables) {
        if (!this.isVariableUsed(varDecl.name, file.content)) {
          report.push({
            file: file.path,
            line: varDecl.line,
            type: 'variable',
            name: varDecl.name,
            reason: 'Variable declared but never used'
          });
        }
      }

      // Detect unreachable code
      const unreachable = this.findUnreachableCode(file.content);
      for (const block of unreachable) {
        report.push({
          file: file.path,
          line: block.line,
          type: 'function',
          name: '(unreachable)',
          reason: 'Code after return/throw statement'
        });
      }
    }

    return report;
  }

  /**
   * Analyze code complexity
   */
  private analyzeComplexity(files: Array<{ path: string; content: string }>): ComplexityReport[] {
    const report: ComplexityReport[] = [];

    for (const file of files) {
      const functions = this.extractFunctions(file.content);

      for (const func of functions) {
        const complexity = this.calculateCyclomaticComplexity(func.body);

        let severity: 'low' | 'medium' | 'high' | 'critical';
        let suggestion: string;

        if (complexity <= 10) {
          severity = 'low';
          suggestion = 'Complexity is acceptable';
        } else if (complexity <= 20) {
          severity = 'medium';
          suggestion = 'Consider refactoring to reduce complexity';
        } else if (complexity <= 30) {
          severity = 'high';
          suggestion = 'High complexity - refactoring recommended';
        } else {
          severity = 'critical';
          suggestion = 'Critical complexity - refactoring required';
        }

        if (complexity > 10) {
          report.push({
            file: file.path,
            function: func.name,
            complexity,
            line: func.line,
            severity,
            suggestion
          });
        }
      }
    }

    return report.sort((a, b) => b.complexity - a.complexity);
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateCyclomaticComplexity(code: string): number {
    let complexity = 1; // Base complexity

    // Count decision points
    const patterns = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /&&/g,
      /\|\|/g,
      /\?/g
    ];

    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Find duplicate code
   */
  private findDuplicates(files: Array<{ path: string; content: string }>): DuplicateReport[] {
    const report: DuplicateReport[] = [];
    const minDuplicateSize = 5; // Minimum lines for duplicate detection

    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const duplicates = this.findDuplicatesBetweenFiles(
          files[i],
          files[j],
          minDuplicateSize
        );
        report.push(...duplicates);
      }
    }

    return report;
  }

  /**
   * Find duplicates between two files
   */
  private findDuplicatesBetweenFiles(
    file1: { path: string; content: string },
    file2: { path: string; content: string },
    minSize: number
  ): DuplicateReport[] {
    const report: DuplicateReport[] = [];
    const lines1 = file1.content.split('\n');
    const lines2 = file2.content.split('\n');

    for (let i = 0; i < lines1.length - minSize; i++) {
      for (let j = 0; j < lines2.length - minSize; j++) {
        const match = this.findLongestMatch(lines1, i, lines2, j);

        if (match.length >= minSize) {
          report.push({
            files: [file1.path, file2.path],
            lines: [i + 1, j + 1],
            code: match.join('\n'),
            size: match.length
          });
        }
      }
    }

    return report;
  }

  /**
   * Find longest matching sequence
   */
  private findLongestMatch(
    lines1: string[],
    start1: number,
    lines2: string[],
    start2: number
  ): string[] {
    const match: string[] = [];
    let i = start1;
    let j = start2;

    while (
      i < lines1.length &&
      j < lines2.length &&
      lines1[i].trim() === lines2[j].trim() &&
      lines1[i].trim() !== ''
    ) {
      match.push(lines1[i]);
      i++;
      j++;
    }

    return match;
  }

  /**
   * Calculate code metrics
   */
  private calculateMetrics(files: Array<{ path: string; content: string }>): CodeMetrics {
    let totalLines = 0;
    let totalFunctions = 0;
    let totalClasses = 0;
    let totalComplexity = 0;

    for (const file of files) {
      totalLines += file.content.split('\n').length;
      const functions = this.extractFunctions(file.content);
      totalFunctions += functions.length;

      for (const func of functions) {
        totalComplexity += this.calculateCyclomaticComplexity(func.body);
      }

      totalClasses += (file.content.match(/\bclass\s+\w+/g) || []).length;
    }

    const averageComplexity = totalFunctions > 0 ? totalComplexity / totalFunctions : 0;

    // Calculate maintainability index (simplified)
    const maintainabilityIndex = Math.max(
      0,
      100 - averageComplexity * 5 - Math.log(totalLines) * 2
    );

    return {
      totalFiles: files.length,
      totalLines,
      totalFunctions,
      totalClasses,
      averageComplexity,
      maintainabilityIndex
    };
  }

  /**
   * Extract imports from code
   */
  private extractImports(code: string): Array<{ name: string; line: number }> {
    const imports: Array<{ name: string; line: number }> = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/import\s+(\w+)/);
      if (match) {
        imports.push({ name: match[1], line: i + 1 });
      }
    }

    return imports;
  }

  /**
   * Extract used identifiers
   */
  private extractUsedIdentifiers(code: string): Set<string> {
    const identifiers = new Set<string>();
    const matches = code.match(/\b[a-zA-Z_]\w*\b/g);

    if (matches) {
      for (const match of matches) {
        identifiers.add(match);
      }
    }

    return identifiers;
  }

  /**
   * Extract functions from code
   */
  private extractFunctions(code: string): Array<{ name: string; line: number; body: string }> {
    const functions: Array<{ name: string; line: number; body: string }> = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/function\s+(\w+)\s*\(/);

      if (match) {
        const body = this.extractFunctionBody(lines, i);
        functions.push({
          name: match[1],
          line: i + 1,
          body
        });
      }
    }

    return functions;
  }

  /**
   * Extract function body
   */
  private extractFunctionBody(lines: string[], startLine: number): string {
    let braceCount = 0;
    let body = '';
    let started = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === '{') {
          braceCount++;
          started = true;
        } else if (char === '}') {
          braceCount--;
        }
      }

      if (started) {
        body += line + '\n';
      }

      if (started && braceCount === 0) {
        break;
      }
    }

    return body;
  }

  /**
   * Extract variables from code
   */
  private extractVariables(code: string): Array<{ name: string; line: number }> {
    const variables: Array<{ name: string; line: number }> = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/(?:const|let|var)\s+(\w+)/);

      if (match) {
        variables.push({ name: match[1], line: i + 1 });
      }
    }

    return variables;
  }

  /**
   * Check if function is called
   */
  private isFunctionCalled(
    name: string,
    fileContent: string,
    allFiles: Array<{ path: string; content: string }>
  ): boolean {
    // Check in current file
    const pattern = new RegExp(`\\b${name}\\s*\\(`, 'g');
    const matches = fileContent.match(pattern);

    if (matches && matches.length > 1) {
      return true; // More than just the definition
    }

    // Check in other files
    for (const file of allFiles) {
      if (file.content.match(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if variable is used
   */
  private isVariableUsed(name: string, code: string): boolean {
    const pattern = new RegExp(`\\b${name}\\b`, 'g');
    const matches = code.match(pattern);

    return matches ? matches.length > 1 : false; // More than just the declaration
  }

  /**
   * Find unreachable code
   */
  private findUnreachableCode(code: string): Array<{ line: number }> {
    const unreachable: Array<{ line: number }> = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();

      if (line.startsWith('return ') || line.startsWith('throw ')) {
        // Check if next line is not a closing brace
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('//')) {
          unreachable.push({ line: i + 2 });
        }
      }
    }

    return unreachable;
  }
}

export default ElideCodeAnalyzer;
