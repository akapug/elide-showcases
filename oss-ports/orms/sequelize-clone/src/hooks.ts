/**
 * Hooks system
 */

export class Hooks {
  private listeners: Map<string, Function[]> = new Map();

  addListener(hookType: string, fn: Function): void {
    if (!this.listeners.has(hookType)) {
      this.listeners.set(hookType, []);
    }
    this.listeners.get(hookType)!.push(fn);
  }

  async runBeforeValidate(instance: any, options?: any): Promise<void> {
    await this.run('beforeValidate', instance, options);
  }

  async runAfterValidate(instance: any, options?: any): Promise<void> {
    await this.run('afterValidate', instance, options);
  }

  async runBeforeCreate(instance: any, options?: any): Promise<void> {
    await this.run('beforeCreate', instance, options);
  }

  async runAfterCreate(instance: any, options?: any): Promise<void> {
    await this.run('afterCreate', instance, options);
  }

  async runBeforeUpdate(instance: any, options?: any): Promise<void> {
    await this.run('beforeUpdate', instance, options);
  }

  async runAfterUpdate(instance: any, options?: any): Promise<void> {
    await this.run('afterUpdate', instance, options);
  }

  async runBeforeDestroy(instance: any, options?: any): Promise<void> {
    await this.run('beforeDestroy', instance, options);
  }

  async runAfterDestroy(instance: any, options?: any): Promise<void> {
    await this.run('afterDestroy', instance, options);
  }

  async runBeforeSave(instance: any, options?: any): Promise<void> {
    await this.run('beforeSave', instance, options);
  }

  async runAfterSave(instance: any, options?: any): Promise<void> {
    await this.run('afterSave', instance, options);
  }

  async runBeforeBulkCreate(instances: any[], options?: any): Promise<void> {
    await this.run('beforeBulkCreate', instances, options);
  }

  async runAfterBulkCreate(instances: any[], options?: any): Promise<void> {
    await this.run('afterBulkCreate', instances, options);
  }

  async runBeforeBulkUpdate(options?: any): Promise<void> {
    await this.run('beforeBulkUpdate', options);
  }

  async runAfterBulkUpdate(options?: any): Promise<void> {
    await this.run('afterBulkUpdate', options);
  }

  async runBeforeBulkDestroy(options?: any): Promise<void> {
    await this.run('beforeBulkDestroy', options);
  }

  async runAfterBulkDestroy(options?: any): Promise<void> {
    await this.run('afterBulkDestroy', options);
  }

  private async run(hookType: string, ...args: any[]): Promise<void> {
    const fns = this.listeners.get(hookType) || [];
    for (const fn of fns) {
      await fn(...args);
    }
  }
}
