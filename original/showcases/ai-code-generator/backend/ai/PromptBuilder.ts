/**
 * Prompt Builder
 *
 * Builds optimized prompts for AI code generation
 * Uses prompt engineering best practices
 */

import { GenerateRequest } from './AIEngine';

export class PromptBuilder {
  /**
   * Build system prompt for AI
   */
  buildSystemPrompt(language: string, framework?: string): string {
    const frameworkInfo = framework ? ` with ${framework}` : '';

    return `You are an expert software engineer specializing in ${language}${frameworkInfo}.
Your task is to generate high-quality, production-ready code based on user requirements.

Guidelines:
1. Write clean, well-structured, and maintainable code
2. Follow best practices and design patterns for ${language}${frameworkInfo}
3. Include appropriate comments and documentation
4. Handle errors gracefully
5. Make code reusable and modular
6. Use modern syntax and features
7. Include type safety when applicable
8. Consider performance and scalability

Output format:
- Start with a brief explanation of your approach
- Provide the code in markdown code blocks
- Use filenames in comments (e.g., \`\`\`typescript // App.tsx)
- List any dependencies needed
- Suggest potential improvements or next steps

Example response structure:
\`\`\`
I'll create a [description of what you're building].

\`\`\`${language} // filename.ext
[your code here]
\`\`\`

Dependencies:
- package-name: ^version

Suggestions:
- Add feature X
- Improve performance with Y
\`\`\``;
  }

  /**
   * Build user prompt for AI
   */
  buildUserPrompt(request: GenerateRequest): string {
    let prompt = `Generate ${request.language}${request.framework ? ` ${request.framework}` : ''} code for the following:\n\n`;
    prompt += request.prompt;

    // Add context if available
    if (request.context) {
      if (request.context.previousCode) {
        prompt += '\n\nExisting code to build upon:\n```\n';
        prompt += request.context.previousCode;
        prompt += '\n```';
      }

      if (request.context.conversation && request.context.conversation.length > 0) {
        prompt += '\n\nPrevious conversation context:\n';
        for (const msg of request.context.conversation.slice(-3)) {
          prompt += `${msg.role}: ${msg.content}\n`;
        }
      }
    }

    // Add specific instructions based on language/framework
    const instructions = this.getLanguageSpecificInstructions(request.language, request.framework);
    if (instructions) {
      prompt += '\n\nAdditional requirements:\n' + instructions;
    }

    return prompt;
  }

  /**
   * Get language-specific instructions
   */
  private getLanguageSpecificInstructions(language: string, framework?: string): string {
    const instructions: Record<string, string> = {
      typescript: '- Use strict TypeScript with proper types\n- Avoid `any` types\n- Use interfaces for object shapes',
      javascript: '- Use modern ES6+ syntax\n- Use const/let instead of var\n- Use arrow functions where appropriate',
      react: '- Use functional components with hooks\n- Follow React best practices\n- Use proper prop types or TypeScript interfaces',
      vue: '- Use Vue 3 Composition API\n- Follow Vue style guide\n- Use proper TypeScript types if applicable',
      python: '- Follow PEP 8 style guide\n- Use type hints\n- Include docstrings for functions',
      ruby: '- Follow Ruby style guide\n- Use meaningful variable names\n- Include yard documentation',
      java: '- Follow Java conventions\n- Use proper access modifiers\n- Include Javadoc comments',
    };

    const langInstructions = instructions[language.toLowerCase()] || '';
    const frameworkInstructions = framework ? instructions[framework.toLowerCase()] || '' : '';

    return [langInstructions, frameworkInstructions].filter(Boolean).join('\n');
  }

  /**
   * Build prompt for code refinement
   */
  buildRefinementPrompt(originalCode: string, refinementRequest: string): string {
    return `Refine the following code based on this request: ${refinementRequest}

Original code:
\`\`\`
${originalCode}
\`\`\`

Please:
1. Make the requested changes
2. Maintain the existing structure where possible
3. Explain what was changed and why
4. Suggest any additional improvements`;
  }

  /**
   * Build prompt for code explanation
   */
  buildExplanationPrompt(code: string): string {
    return `Explain the following code in detail:

\`\`\`
${code}
\`\`\`

Include:
1. Overall purpose and functionality
2. Key components and their roles
3. Important algorithms or patterns used
4. Potential improvements or concerns`;
  }

  /**
   * Build prompt for debugging
   */
  buildDebugPrompt(code: string, error: string): string {
    return `Debug the following code that produces this error:

Error:
\`\`\`
${error}
\`\`\`

Code:
\`\`\`
${code}
\`\`\`

Please:
1. Identify the cause of the error
2. Provide the corrected code
3. Explain what was wrong and how you fixed it`;
  }
}
