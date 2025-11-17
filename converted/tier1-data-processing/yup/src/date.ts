/**
 * Date Schema Implementation
 * Date validation with range checking
 */

import { Schema } from './mixed';
import { Message } from './errors';
import { Reference } from './ref';

export class DateSchema extends Schema<Date> {
  constructor() {
    super('date');
  }

  protected _cast(value: any, options: any): any {
    value = super._cast(value, options);

    if (value === null && this._nullable) return null;
    if (value === undefined && this._optional) return undefined;

    if (value instanceof Date) return value;

    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }

    return value;
  }

  min(min: Date | string | Reference, message?: Message): this {
    return this.test({
      name: 'min',
      message: message || '${path} must be later than ${min}',
      params: { min },
      test: (value, context) => {
        if (!value) return true;

        const minDate = Reference.isRef(min)
          ? min.getValue(context.parent, context.options.context)
          : new Date(min);

        return value >= minDate;
      },
    });
  }

  max(max: Date | string | Reference, message?: Message): this {
    return this.test({
      name: 'max',
      message: message || '${path} must be earlier than ${max}',
      params: { max },
      test: (value, context) => {
        if (!value) return true;

        const maxDate = Reference.isRef(max)
          ? max.getValue(context.parent, context.options.context)
          : new Date(max);

        return value <= maxDate;
      },
    });
  }
}

export function date(): DateSchema {
  return new DateSchema();
}
