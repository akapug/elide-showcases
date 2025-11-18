/**
 * text-extensions - Text File Extensions List
 *
 * List of text file extensions.
 * **POLYGLOT SHOWCASE**: Text detection across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/text-extensions (~2M+ downloads/week)
 *
 * Package has ~2M+ downloads/week on npm!
 */

export const textExtensions = [
  'ada', 'adb', 'ads', 'applescript', 'as', 'ascx', 'asm', 'asmx', 'asp', 'aspx', 'atom',
  'bas', 'bash', 'bashrc', 'bat', 'bbcolors', 'bdsgroup', 'bdsproj', 'bib', 'bowerrc', 'c',
  'cbl', 'cc', 'cfc', 'cfg', 'cfm', 'cfml', 'cgi', 'clj', 'cljs', 'cls', 'cmake', 'cmd',
  'cnf', 'cob', 'coffee', 'coffeekup', 'conf', 'cpp', 'cpt', 'cpy', 'crt', 'cs', 'csh',
  'cson', 'csproj', 'css', 'csslintrc', 'csv', 'ctl', 'curlrc', 'cxx', 'd', 'dart', 'dfm',
  'diff', 'dof', 'dpk', 'dpr', 'dproj', 'dtd', 'eco', 'editorconfig', 'ejs', 'el', 'elm',
  'emacs', 'eml', 'ent', 'erb', 'erl', 'eslintignore', 'eslintrc', 'ex', 'exs', 'f', 'f03',
  'f77', 'f90', 'f95', 'fish', 'for', 'fpp', 'frm', 'ftn', 'gemrc', 'gemspec', 'gitattributes',
  'gitconfig', 'gitignore', 'gitkeep', 'gitmodules', 'go', 'gpp', 'gradle', 'groovy', 'groupproj',
  'grunit', 'gtmpl', 'gvimrc', 'h', 'haml', 'hbs', 'hgignore', 'hh', 'hpp', 'hrl', 'hs', 'hta',
  'htaccess', 'htc', 'htm', 'html', 'htpasswd', 'hxx', 'iced', 'iml', 'inc', 'ini', 'ino', 'int',
  'irbrc', 'itcl', 'itermcolors', 'itk', 'jade', 'java', 'jhtm', 'jhtml', 'js', 'jscsrc', 'jshintignore',
  'jshintrc', 'json', 'json5', 'jsonld', 'jsp', 'jspx', 'jsx', 'ksh', 'less', 'lhs', 'lisp', 'log',
  'ls', 'lsp', 'lua', 'm', 'mak', 'make', 'makefile', 'man', 'manifest', 'map', 'markdown', 'master',
  'md', 'mdown', 'mdwn', 'mdx', 'metadata', 'mht', 'mhtml', 'mk', 'mkd', 'mkdn', 'mkdown', 'ml', 'mli',
  'mm', 'mxml', 'nfm', 'nfo', 'noon', 'npmignore', 'npmrc', 'nuspec', 'nvmrc', 'ops', 'pas', 'pasm',
  'patch', 'pbxproj', 'pch', 'pem', 'pg', 'php', 'php3', 'php4', 'php5', 'phpt', 'phtml', 'pir', 'pl',
  'pm', 'pmc', 'pod', 'pot', 'pp', 'prettierrc', 'properties', 'props', 'pt', 'pug', 'purs', 'py',
  'pyx', 'r', 'rake', 'rb', 'rbw', 'rc', 'rdoc', 'rdoc_options', 'resx', 'rexx', 'rhtml', 'rjs',
  'rlib', 'ron', 'rs', 'rss', 'rst', 'rtf', 'rvmrc', 'rxml', 's', 'sass', 'scala', 'scm', 'scss',
  'seestyle', 'sh', 'shtml', 'sls', 'spec', 'sql', 'sqlite', 'sqlproj', 'srt', 'ss', 'sss', 'st',
  'strings', 'sty', 'styl', 'stylus', 'sub', 'sublime-build', 'sublime-commands', 'sublime-completions',
  'sublime-keymap', 'sublime-macro', 'sublime-menu', 'sublime-project', 'sublime-settings',
  'sublime-workspace', 'sv', 'svc', 'svg', 'swift', 't', 'tcl', 'tcsh', 'terminal', 'tex', 'text',
  'textile', 'tg', 'tk', 'tmLanguage', 'tmpl', 'tmTheme', 'tpl', 'ts', 'tsv', 'tsx', 'tt', 'tt2',
  'ttml', 'twig', 'txt', 'v', 'vb', 'vbproj', 'vbs', 'vcproj', 'vcxproj', 'vh', 'vhd', 'vhdl',
  'vim', 'viminfo', 'vimrc', 'vue', 'wxml', 'wxss', 'x-php', 'xaml', 'xht', 'xhtml', 'xml', 'xs',
  'xsd', 'xsl', 'xslt', 'y', 'yaml', 'yml', 'zsh', 'zshrc'
];

export function isTextExtension(ext: string): boolean {
  return textExtensions.includes(ext.toLowerCase().replace(/^\./, ''));
}

export default textExtensions;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("📝 text-extensions (POLYGLOT!)\\n");
  console.log("Total text extensions:", textExtensions.length);
  console.log("Sample:", textExtensions.slice(0, 10).join(', '));
  console.log("\\nisTextExtension('ts'):", isTextExtension('ts'));
  console.log("isTextExtension('png'):", isTextExtension('png'));
  console.log("\\n🚀 ~2M+ downloads/week on npm!");
}
