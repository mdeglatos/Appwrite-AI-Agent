
import type { FunctionDeclaration } from '@google/genai';
import { databaseFunctions, databaseToolDefinitions } from './databaseTools';
import { storageFunctions, storageToolDefinitions } from './storageTools';
import { functionsFunctions, functionsToolDefinitions } from './functionsTools';

// Combine all tool functions into a single object.
export const availableTools = {
  ...databaseFunctions,
  ...storageFunctions,
  ...functionsFunctions,
};

// Group tool definitions by category for dynamic loading.
export const toolDefinitionGroups: { [key: string]: FunctionDeclaration[] } = {
  database: databaseToolDefinitions,
  storage: storageToolDefinitions,
  functions: functionsToolDefinitions,
};
