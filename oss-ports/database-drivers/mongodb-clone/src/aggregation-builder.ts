/**
 * MongoDB Aggregation Pipeline Builder
 */

import * as types from './types';

export class AggregationBuilder {
  private pipeline: types.Document[] = [];

  match(conditions: types.Document): this {
    this.pipeline.push({ $match: conditions });
    return this;
  }

  group(groupSpec: types.Document): this {
    this.pipeline.push({ $group: groupSpec });
    return this;
  }

  sort(sortSpec: types.Sort): this {
    this.pipeline.push({ $sort: sortSpec });
    return this;
  }

  project(projectionSpec: types.Document): this {
    this.pipeline.push({ $project: projectionSpec });
    return this;
  }

  limit(value: number): this {
    this.pipeline.push({ $limit: value });
    return this;
  }

  skip(value: number): this {
    this.pipeline.push({ $skip: value });
    return this;
  }

  unwind(path: string, options?: types.Document): this {
    if (options) {
      this.pipeline.push({ $unwind: { path, ...options } });
    } else {
      this.pipeline.push({ $unwind: path });
    }
    return this;
  }

  lookup(options: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
  }): this {
    this.pipeline.push({ $lookup: options });
    return this;
  }

  addFields(fields: types.Document): this {
    this.pipeline.push({ $addFields: fields });
    return this;
  }

  replaceRoot(newRoot: types.Document): this {
    this.pipeline.push({ $replaceRoot: newRoot });
    return this;
  }

  facet(facets: Record<string, types.Document[]>): this {
    this.pipeline.push({ $facet: facets });
    return this;
  }

  bucket(options: {
    groupBy: any;
    boundaries: any[];
    default?: string;
    output?: types.Document;
  }): this {
    this.pipeline.push({ $bucket: options });
    return this;
  }

  bucketAuto(options: {
    groupBy: any;
    buckets: number;
    output?: types.Document;
    granularity?: string;
  }): this {
    this.pipeline.push({ $bucketAuto: options });
    return this;
  }

  count(field: string): this {
    this.pipeline.push({ $count: field });
    return this;
  }

  sample(size: number): this {
    this.pipeline.push({ $sample: { size } });
    return this;
  }

  sortByCount(expression: any): this {
    this.pipeline.push({ $sortByCount: expression });
    return this;
  }

  redact(expression: any): this {
    this.pipeline.push({ $redact: expression });
    return this;
  }

  out(collection: string): this {
    this.pipeline.push({ $out: collection });
    return this;
  }

  merge(options: types.Document): this {
    this.pipeline.push({ $merge: options });
    return this;
  }

  graphLookup(options: {
    from: string;
    startWith: any;
    connectFromField: string;
    connectToField: string;
    as: string;
    maxDepth?: number;
    depthField?: string;
    restrictSearchWithMatch?: types.Document;
  }): this {
    this.pipeline.push({ $graphLookup: options });
    return this;
  }

  build(): types.Document[] {
    return this.pipeline;
  }

  clear(): this {
    this.pipeline = [];
    return this;
  }

  clone(): AggregationBuilder {
    const builder = new AggregationBuilder();
    builder.pipeline = [...this.pipeline];
    return builder;
  }
}
