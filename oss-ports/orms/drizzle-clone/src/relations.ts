/**
 * Relations API
 */

export function relations(table: any, callback: (helpers: any) => any) {
  const helpers = {
    one: (target: any, config?: any) => ({ type: 'one', target, ...config }),
    many: (target: any, config?: any) => ({ type: 'many', target, ...config })
  };

  return callback(helpers);
}
