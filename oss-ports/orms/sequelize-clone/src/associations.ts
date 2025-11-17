/**
 * Association types
 */

export class Association {
  constructor(public source: any, public target: any, public options: any) {}
}

export class HasOne extends Association {
  associationType = 'HasOne';
}

export class HasMany extends Association {
  associationType = 'HasMany';
}

export class BelongsTo extends Association {
  associationType = 'BelongsTo';
}

export class BelongsToMany extends Association {
  associationType = 'BelongsToMany';
}
