export interface PropOptions {
  type?: any;
  required?: boolean;
  default?: any;
  validator?: (value: any) => boolean;
}
