/**
 * Type utilities
 */

export type Generated<T> = T;
export type Selectable<T> = T;
export type Insertable<T> = Omit<T, keyof { [K in keyof T as T[K] extends Generated<any> ? K : never]: any }>;
export type Updateable<T> = Partial<Insertable<T>>;
