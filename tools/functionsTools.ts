
import { getSdkFunctions, Query } from '../services/appwrite';
import type { AIContext } from '../types';
import { Type, type FunctionDeclaration } from '@google/genai';

async function listFunctionExecutions(context: AIContext, { functionId, limit = 100 }: { functionId: string, limit?: number }) {
    const finalLimit = Math.min(limit, 100);
    try {
        const functions = getSdkFunctions(context.project);
        return await functions.listExecutions(functionId, [Query.limit(finalLimit)]);
    } catch (error) {
        if (error instanceof Error) { return { error: `Appwrite API Error: ${error.message}` }; }
        return { error: 'An unknown error occurred while listing executions.' };
    }
}

export const functionsFunctions = {
    listFunctionExecutions,
};

export const functionsToolDefinitions: FunctionDeclaration[] = [
    {
        name: 'listFunctionExecutions',
        description: 'Get a list of all the function\'s executions (logs).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                functionId: { type: Type.STRING, description: 'Function ID.' },
                limit: { type: Type.INTEGER, description: 'Optional. The maximum number of executions to return. Default is 100. Maximum is 100.' },
            },
            required: ['functionId']
        }
    }
];
