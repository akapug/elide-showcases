/**
 * Query operators
 */

export const Op = {
  eq: Symbol('eq'),
  ne: Symbol('ne'),
  gte: Symbol('gte'),
  gt: Symbol('gt'),
  lte: Symbol('lte'),
  lt: Symbol('lt'),
  not: Symbol('not'),
  is: Symbol('is'),
  in: Symbol('in'),
  notIn: Symbol('notIn'),
  like: Symbol('like'),
  notLike: Symbol('notLike'),
  iLike: Symbol('iLike'),
  notILike: Symbol('notILike'),
  startsWith: Symbol('startsWith'),
  endsWith: Symbol('endsWith'),
  substring: Symbol('substring'),
  regexp: Symbol('regexp'),
  notRegexp: Symbol('notRegexp'),
  iRegexp: Symbol('iRegexp'),
  notIRegexp: Symbol('notIRegexp'),
  between: Symbol('between'),
  notBetween: Symbol('notBetween'),
  overlap: Symbol('overlap'),
  contains: Symbol('contains'),
  contained: Symbol('contained'),
  adjacent: Symbol('adjacent'),
  strictLeft: Symbol('strictLeft'),
  strictRight: Symbol('strictRight'),
  noExtendRight: Symbol('noExtendRight'),
  noExtendLeft: Symbol('noExtendLeft'),
  and: Symbol('and'),
  or: Symbol('or'),
  any: Symbol('any'),
  all: Symbol('all'),
  values: Symbol('values'),
  col: Symbol('col'),
  placeholder: Symbol('placeholder'),
  join: Symbol('join'),
  match: Symbol('match')
};

export type Operators = typeof Op;
