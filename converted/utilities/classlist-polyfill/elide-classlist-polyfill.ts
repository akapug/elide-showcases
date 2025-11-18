/**
 * classList Polyfill
 *
 * Polyfill for Element.classList API.
 * **POLYGLOT SHOWCASE**: classList for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/classlist-polyfill (~50K+ downloads/week)
 */

export class ClassListPolyfill {
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  get length(): number {
    return this.getClasses().length;
  }

  private getClasses(): string[] {
    const className = this.element.className || '';
    return className.trim().split(/\s+/).filter(c => c.length > 0);
  }

  private setClasses(classes: string[]): void {
    this.element.className = classes.join(' ');
  }

  add(...tokens: string[]): void {
    const classes = this.getClasses();
    tokens.forEach(token => {
      if (!classes.includes(token)) {
        classes.push(token);
      }
    });
    this.setClasses(classes);
  }

  remove(...tokens: string[]): void {
    const classes = this.getClasses().filter(c => !tokens.includes(c));
    this.setClasses(classes);
  }

  contains(token: string): boolean {
    return this.getClasses().includes(token);
  }

  toggle(token: string, force?: boolean): boolean {
    const hasClass = this.contains(token);
    
    if (force === undefined) {
      force = !hasClass;
    }
    
    if (force) {
      this.add(token);
    } else {
      this.remove(token);
    }
    
    return force;
  }

  replace(oldToken: string, newToken: string): boolean {
    if (!this.contains(oldToken)) return false;
    this.remove(oldToken);
    this.add(newToken);
    return true;
  }

  item(index: number): string | null {
    const classes = this.getClasses();
    return classes[index] || null;
  }
}

export default ClassListPolyfill;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📝 classList Polyfill (POLYGLOT!)\n");
  
  console.log('classList polyfill loaded');
  console.log('Manipulate CSS classes easily');
  console.log();
  console.log('Example usage:');
  console.log('  element.classList.add("active")');
  console.log('  element.classList.remove("inactive")');
  console.log('  element.classList.toggle("visible")');
  console.log("\n  ✓ ~50K+ downloads/week!");
}
