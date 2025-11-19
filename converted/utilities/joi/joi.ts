/**
 * Joi - Object schema validation
 * Based on https://www.npmjs.com/package/joi (~12M downloads/week)
 */

class Schema {
  private type: string;
  private isRequired = false;
  private minVal?: number;
  private maxVal?: number;

  constructor(type: string) {
    this.type = type;
  }

  required(): this {
    this.isRequired = true;
    return this;
  }

  min(value: number): this {
    this.minVal = value;
    return this;
  }

  max(value: number): this {
    this.maxVal = value;
    return this;
  }

  validate(value: any): { error?: string; value: any } {
    if (value === undefined || value === null) {
      if (this.isRequired) {
        return { error: 'Value is required', value };
      }
      return { value };
    }

    switch (this.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { error: 'Must be a string', value };
        }
        if (this.minVal && value.length < this.minVal) {
          return { error: `Min length is ${this.minVal}`, value };
        }
        if (this.maxVal && value.length > this.maxVal) {
          return { error: `Max length is ${this.maxVal}`, value };
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          return { error: 'Must be a number', value };
        }
        if (this.minVal !== undefined && value < this.minVal) {
          return { error: `Min value is ${this.minVal}`, value };
        }
        if (this.maxVal !== undefined && value > this.maxVal) {
          return { error: `Max value is ${this.maxVal}`, value };
        }
        break;
    }

    return { value };
  }
}

export const string = (): Schema => new Schema('string');
export const number = (): Schema => new Schema('number');
export const boolean = (): Schema => new Schema('boolean');

export default { string, number, boolean };

if (import.meta.url.includes("joi.ts")) {
  console.log("✓ Joi - Schema validation for Elide\n");
  const schema = string().required().min(3).max(10);
  console.log(schema.validate('hello'));
  console.log(schema.validate('hi'));
  console.log("\n~12M+ downloads/week on npm!");
}
