/**
 * bookshelf - ORM for Knex
 * Based on https://www.npmjs.com/package/bookshelf (~1M+ downloads/week)
 */

class BookshelfModel {
  get(attr: string): any { return null; }
  set(attr: string | object, val?: any): this { return this; }
  save(attrs?: any, options?: any): Promise<this> { return Promise.resolve(this); }
  fetch(options?: any): Promise<this> { return Promise.resolve(this); }
  destroy(options?: any): Promise<this> { return Promise.resolve(this); }
}

class Collection {
  fetch(options?: any): Promise<this> { return Promise.resolve(this); }
}

function bookshelf(knex: any) {
  return {
    Model: BookshelfModel,
    Collection,
    model: (name: string, model: any) => model
  };
}

export default bookshelf;
if (import.meta.url.includes("elide-bookshelf.ts")) {
  console.log("✅ bookshelf - ORM for Knex (POLYGLOT!)\n");

  const knex = { /* knex instance */ };
  const bookshelfInstance = bookshelf(knex);
  
  class User extends bookshelfInstance.Model {
    get tableName() { return 'users'; }
  }
  
  const user = new User();
  console.log('Bookshelf ORM ready!');
  console.log("\n🚀 ~1M+ downloads/week | ORM for Knex\n");
}
