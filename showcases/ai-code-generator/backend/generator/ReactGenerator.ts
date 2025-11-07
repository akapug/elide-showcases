/**
 * React Code Generator
 *
 * Specialized generator for React applications
 */

import { logger } from '../utils/logger';

export interface ReactGeneratorOptions {
  typescript?: boolean;
  hooks?: boolean;
  stateManagement?: 'useState' | 'useReducer' | 'context' | 'redux';
  styling?: 'css' | 'scss' | 'styled-components' | 'tailwind';
}

export class ReactGenerator {
  /**
   * Generate React component
   */
  generateComponent(
    name: string,
    props: Record<string, string>,
    options: ReactGeneratorOptions = {}
  ): string {
    const {
      typescript = true,
      hooks = true,
      stateManagement = 'useState',
      styling = 'css',
    } = options;

    if (hooks) {
      return this.generateFunctionalComponent(name, props, typescript, stateManagement, styling);
    } else {
      return this.generateClassComponent(name, props, typescript);
    }
  }

  /**
   * Generate functional component
   */
  private generateFunctionalComponent(
    name: string,
    props: Record<string, string>,
    typescript: boolean,
    stateManagement: string,
    styling: string
  ): string {
    const ext = typescript ? 'tsx' : 'jsx';
    const imports = this.generateImports(stateManagement, styling, typescript);
    const propsInterface = typescript ? this.generatePropsInterface(name, props) : '';
    const propsType = typescript ? `: React.FC<${name}Props>` : '';
    const state = this.generateState(stateManagement);
    const styles = this.generateStyleImport(name, styling);

    return `${imports}
${styles}
${propsInterface}
const ${name}${propsType} = ({ ${Object.keys(props).join(', ')} }) => {
${state}

  return (
    <div className="${this.toKebabCase(name)}">
      <h1>${name} Component</h1>
      {/* Add your component logic here */}
    </div>
  );
};

export default ${name};
`;
  }

  /**
   * Generate class component
   */
  private generateClassComponent(
    name: string,
    props: Record<string, string>,
    typescript: boolean
  ): string {
    const propsInterface = typescript ? this.generatePropsInterface(name, props) : '';
    const stateInterface = typescript ? this.generateStateInterface(name) : '';
    const propsType = typescript ? `<${name}Props, ${name}State>` : '';

    return `import React, { Component } from 'react';

${propsInterface}
${stateInterface}
class ${name} extends Component${propsType} {
  constructor(props${typescript ? `: ${name}Props` : ''}) {
    super(props);
    this.state = {
      // Initialize state here
    };
  }

  componentDidMount() {
    // Lifecycle method
  }

  render() {
    return (
      <div className="${this.toKebabCase(name)}">
        <h1>${name} Component</h1>
        {/* Add your component logic here */}
      </div>
    );
  }
}

export default ${name};
`;
  }

  /**
   * Generate imports
   */
  private generateImports(
    stateManagement: string,
    styling: string,
    typescript: boolean
  ): string {
    let imports = "import React";

    // Add hooks
    const hooks = [];
    if (stateManagement === 'useState') hooks.push('useState');
    if (stateManagement === 'useReducer') hooks.push('useReducer');
    if (stateManagement === 'context') hooks.push('useContext');

    if (hooks.length > 0) {
      imports += `, { ${hooks.join(', ')} }`;
    }

    imports += " from 'react';";

    // Add styling imports
    if (styling === 'styled-components') {
      imports += "\nimport styled from 'styled-components';";
    }

    return imports;
  }

  /**
   * Generate props interface
   */
  private generatePropsInterface(name: string, props: Record<string, string>): string {
    if (Object.keys(props).length === 0) {
      return `interface ${name}Props {}`;
    }

    const propsStr = Object.entries(props)
      .map(([key, type]) => `  ${key}: ${type};`)
      .join('\n');

    return `interface ${name}Props {\n${propsStr}\n}`;
  }

  /**
   * Generate state interface
   */
  private generateStateInterface(name: string): string {
    return `interface ${name}State {\n  // Add state types here\n}`;
  }

  /**
   * Generate state management code
   */
  private generateState(stateManagement: string): string {
    switch (stateManagement) {
      case 'useState':
        return '  const [state, setState] = useState({});';
      case 'useReducer':
        return `  const [state, dispatch] = useReducer(reducer, initialState);`;
      case 'context':
        return '  const context = useContext(MyContext);';
      default:
        return '';
    }
  }

  /**
   * Generate style import
   */
  private generateStyleImport(name: string, styling: string): string {
    if (styling === 'css') {
      return `import './${name}.css';`;
    } else if (styling === 'scss') {
      return `import './${name}.scss';`;
    }
    return '';
  }

  /**
   * Generate corresponding styles
   */
  generateStyles(name: string, styling: string): string {
    const className = this.toKebabCase(name);

    if (styling === 'css' || styling === 'scss') {
      return `.${className} {
  padding: 20px;
}

.${className} h1 {
  color: #333;
  font-size: 24px;
  margin-bottom: 16px;
}
`;
    } else if (styling === 'styled-components') {
      return `import styled from 'styled-components';

export const Container = styled.div\`
  padding: 20px;
\`;

export const Title = styled.h1\`
  color: #333;
  font-size: 24px;
  margin-bottom: 16px;
\`;
`;
    } else if (styling === 'tailwind') {
      return '// Use Tailwind classes directly in JSX';
    }

    return '';
  }

  /**
   * Generate hooks
   */
  generateCustomHook(name: string, dependencies: string[] = []): string {
    return `import { useState, useEffect } from 'react';

export const use${name} = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Add your logic here
    setLoading(false);
  }, [${dependencies.join(', ')}]);

  return { data, loading, error };
};
`;
  }

  /**
   * Generate context
   */
  generateContext(name: string): string {
    return `import React, { createContext, useContext, useState } from 'react';

interface ${name}ContextType {
  // Define context type
}

const ${name}Context = createContext<${name}ContextType | undefined>(undefined);

export const ${name}Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState({});

  const value = {
    state,
    setState,
  };

  return (
    <${name}Context.Provider value={value}>
      {children}
    </${name}Context.Provider>
  );
};

export const use${name} = () => {
  const context = useContext(${name}Context);
  if (context === undefined) {
    throw new Error('use${name} must be used within a ${name}Provider');
  }
  return context;
};
`;
  }

  /**
   * Generate reducer
   */
  generateReducer(name: string, actions: string[]): string {
    const actionTypes = actions.map(a => `  ${a.toUpperCase()} = '${a.toUpperCase()}'`).join(',\n');
    const cases = actions
      .map(
        a => `    case ActionTypes.${a.toUpperCase()}:
      return { ...state };`
      )
      .join('\n');

    return `export enum ActionTypes {
${actionTypes}
}

export interface State {
  // Define state shape
}

export type Action =
${actions.map(a => `  | { type: ActionTypes.${a.toUpperCase()}; payload?: any }`).join('\n')};

export const initialState: State = {
  // Initial state
};

export const ${name.toLowerCase()}Reducer = (state: State, action: Action): State => {
  switch (action.type) {
${cases}
    default:
      return state;
  }
};
`;
  }

  /**
   * Generate form component
   */
  generateForm(name: string, fields: Array<{ name: string; type: string }>): string {
    const stateFields = fields.map(f => `  ${f.name}: '',`).join('\n');
    const inputs = fields
      .map(
        f => `        <input
          type="${f.type}"
          name="${f.name}"
          value={formData.${f.name}}
          onChange={handleChange}
          placeholder="${f.name}"
        />`
      )
      .join('\n');

    return `import React, { useState } from 'react';

interface FormData {
${fields.map(f => `  ${f.name}: string;`).join('\n')}
}

const ${name}: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
${stateFields}
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your submit logic here
  };

  return (
    <form onSubmit={handleSubmit} className="${this.toKebabCase(name)}">
${inputs}
      <button type="submit">Submit</button>
    </form>
  );
};

export default ${name};
`;
  }

  /**
   * Generate list component
   */
  generateList(
    name: string,
    itemType: string,
    itemComponent: string
  ): string {
    return `import React from 'react';
import ${itemComponent} from './${itemComponent}';

interface ${name}Props {
  items: ${itemType}[];
  onItemClick?: (item: ${itemType}) => void;
}

const ${name}: React.FC<${name}Props> = ({ items, onItemClick }) => {
  return (
    <div className="${this.toKebabCase(name)}">
      {items.length === 0 ? (
        <p>No items found</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <${itemComponent}
              key={index}
              item={item}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ${name};
`;
  }

  /**
   * Convert to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
}
