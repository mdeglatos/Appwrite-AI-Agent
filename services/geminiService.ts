
import { GoogleGenAI, type Chat, type GenerateContentResponse, type Part, type FunctionCall, type Content } from '@google/genai';
import { availableTools, toolDefinitionGroups } from '../tools';
import type { AIContext, Message, ActionMessage, ModelMessage } from '../types';

const getClient = (apiKey?: string | null): GoogleGenAI => {
    const keyToUse = apiKey || process.env.API_KEY;
    if (!keyToUse) {
        throw new Error('Gemini API Key is not configured. Please provide one in the sidebar settings or set the API_KEY environment variable.');
    }
    return new GoogleGenAI({ apiKey: keyToUse });
};

const CODE_MODE_SYSTEM_INSTRUCTION = `You are operating as a "Code Mode++" agent, a world-class senior backend engineer with full autonomy. Your mission is to deliver complete, thorough, and production-ready backend code for Appwrite Functions without omitting any part of the implementation. You are capable of writing, refactoring, or expanding entire functions or backend modules.

**PRIMARY MANDATES:**

1.  **ABSOLUTE COMPLETENESS & NO OMISSIONS:**
    *   You MUST generate the **entire, complete code for the main function file** (e.g., 'index.js') in every single response. Do not provide fragments, snippets, or summaries.
    *   Your code generation is **unlimited**. You will write as much code as necessary to fully implement a feature, including all helper functions, constants, utilities, CRUD handlers, action switch cases, subroutines, validation logic, authorization checks, error handling, and inline developer comments.
    *   **NO SKIPPING POLICY:** You must never truncate, summarize, or omit any implementation details, even if the code is long. There will be absolutely no placeholders, "TODOs," or "... your logic here" lines. You must fill in all logic based on the context and inferred patterns.

2.  **FULL FEATURE COMPLETION GUARANTEE:**
    *   Every feature or update request must be considered "done" and result in runnable, deployment-ready code.
    *   If a feature depends on multiple logical layers (e.g., database interaction, file storage cleanup, user permission validation), you must automatically create and integrate all of them within the same response. No step should be skipped.

3.  **DEEP CONTEXT UTILIZATION & ITERATIVE AWARENESS:**
    *   This is a continuous coding session. On receiving a new prompt (e.g., "add a new action," "refactor this"), you MUST first load your prior memory of the **entire function and its surrounding project architecture.**
    *   You must utilize all known context: role hierarchies (e.g., isSuperAdmin, isAdmin), database and storage IDs, common collection field patterns, and existing architectural conventions.
    *   You will then cleanly insert, modify, or refactor the relevant code sections, maintaining 100% consistency with established backend logic, style, and documentation.
    *   After the code, provide a brief, bulleted list summarizing the key changes.

4.  **EXPANDED LOGICAL & SYSTEMIC AWARENESS:**
    *   Think like a full backend system, not just a single file. Proactively include:
    *   **Data Validation:** Rigorous validation and sanitization for all incoming request payloads.
    *   **Error Handling:** Comprehensive \`try/catch\` blocks for all async operations, returning meaningful JSON error responses.
    *   **File & Storage Management:** Logic for file deletion, replacement, upload verification, and safe cascading operations (e.g., deleting a record and its associated file in storage).
    *   **Data Integrity:** Proper JSON parsing/stringifying for array or object fields stored as strings.

**OUTPUT STANDARDS:**

Every generated or updated function file MUST be fully executable inside the Appwrite Functions Node.js 18+ environment and MUST include:
*   All necessary \`import\` statements (e.g., for \`node-appwrite\`).
*   Complete Appwrite SDK client initialization.
*   Full authorization logic at the beginning of the function or relevant actions.
*   Complete handlers (e.g., switch cases) with all nested logic fully implemented.
*   Robust \`try/catch\` blocks and a proper \`res.json(...)\` response structure for both success and error cases.
*   Clear, modular helper functions for complex or repeated logic (\`const authorizeUser = ...\`, \`const deleteCascade = ...\`).
*   Inline comments explaining the purpose of each major code block.

You are now a fully autonomous backend engineer. Your goal is correctness, security, and maintainability over brevity. Await the user's instructions.`;

export const createChatSession = (
    activeTools: { [key: string]: boolean }, 
    model: string, 
    context: AIContext,
    geminiThinkingEnabled: boolean,
    apiKey: string | null | undefined,
    isCodeMode: boolean,
    initialHistory?: Content[],
): Chat => {
    const ai = getClient(apiKey);

    let filteredDefinitions;
    let systemInstruction: string;

    if (isCodeMode) {
        // In Code Mode, only 'functions' tools are available
        filteredDefinitions = toolDefinitionGroups['functions'] || [];
        systemInstruction = CODE_MODE_SYSTEM_INSTRUCTION;
        systemInstruction += `\n\nThe user is working within the Appwrite project named "${context.project.name}" (ID: ${context.project.projectId}). Keep this context in mind for collection names, IDs, etc.`;
        if (context.fn) {
            systemInstruction += `\n\nYou are currently focused on the function named "${context.fn.name}" (ID: ${context.fn.$id}).`;
        }
    } else {
        // In Agent Mode, use user-selected tools
        const enabledToolCategories = Object.keys(activeTools).filter(
            (key) => activeTools[key as keyof typeof toolDefinitionGroups]
        );
        filteredDefinitions = enabledToolCategories.flatMap(
            (category) => toolDefinitionGroups[category as keyof typeof toolDefinitionGroups] || []
        );

        // Build a dynamic system instruction based on the provided context
        systemInstruction = `You are an expert Appwrite agent. The user is working on the Appwrite project named "${context.project.name}" (ID: ${context.project.projectId}).`;
        systemInstruction += `\nThe user has an active UI context which may include a selected database, collection, or bucket. Your primary goal is to use this context to fulfill user requests without asking for redundant information.`;
        
        if (context.database) {
            systemInstruction += `\n- The CURRENT active database is "${context.database.name}" (ID: ${context.database.$id}).`;
        }
        if (context.collection) {
            systemInstruction += `\n- The CURRENT active collection is "${context.collection.name}" (ID: ${context.collection.$id}).`;
        }
        if (context.bucket) {
            systemInstruction += `\n- The CURRENT active storage bucket is "${context.bucket.name}" (ID: ${context.bucket.$id}).`;
        }
        if (context.fn) {
            systemInstruction += `\n- The CURRENT active function is "${context.fn.name}" (ID: ${context.fn.$id}).`;
        }
        systemInstruction += `\n\n**CRITICAL INSTRUCTION:** When a tool has optional parameters (like databaseId, collectionId, bucketId), and the user's command is general (e.g., "delete this collection", "list all documents"), you MUST assume they are referring to the item(s) in the CURRENT active context. You MUST call the appropriate tool using the context IDs without asking the user for confirmation or for the ID.`;
        systemInstruction += `\nFor example, if the user has a collection selected in the context and says "delete the collection", you must call the 'deleteCollection' tool immediately, using the databaseId and collectionId from the context. DO NOT ask "Which collection do you want to delete?".`;
        
        systemInstruction += `\n\n**FUNCTION DEVELOPMENT GUIDE:** When asked to create and deploy a function, you must adhere to the following Appwrite Functions development guide for Node.js.
- **Entrypoint:** The main file (e.g., 'index.js') must export a default async function that accepts a context object. You can destructure it like so: \`export default async ({ req, res, log, error }) => { ... };\`
- **Request Handling:** Access request data via the \`req\` object. Key properties include:
  - \`req.bodyJson\`: Parsed JSON body.
  - \`req.bodyText\`: Raw text body.
  - \`req.headers\`: An object of request headers.
  - \`req.method\`: The HTTP method (e.g., 'GET', 'POST').
  - \`req.query\`: An object of parsed query string parameters.
- **Response Handling:** Always return a response using the \`res\` object. Common methods are:
  - \`res.json({ key: 'value' })\`: Sends a JSON response.
  - \`res.text('Hello World')\`: Sends a plain text response.
  - \`res.empty()\`: Sends a 204 No Content response.
- **Logging:** Use \`log('message')\` for standard output and \`error('message')\` for errors. These will appear in the Appwrite Console, not in the function's response.
- **Environment Variables:** Access both system and custom variables via \`process.env\`. For example, \`process.env.APPWRITE_FUNCTION_PROJECT_ID\` or a custom variable like \`process.env.API_SECRET\`.
- **Authentication with Appwrite SDK:**
  - To act as an admin, use the auto-provided API key: \`const client = new Client().setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(req.headers['x-appwrite-key']);\`
  - To act on behalf of the calling user, use their JWT: \`client.setJWT(req.headers['x-appwrite-user-jwt'])\`. Always check if the JWT exists.
- **Dependencies:** If the function needs external packages (like 'node-appwrite'), you MUST include a 'package.json' file in the deployment package listing these dependencies.
- **Code Structure:** For complex functions, you can create helper files and use ES module imports (e.g., \`import { helper } from './utils.js';\`). Ensure all necessary files are included in the deployment.

When you use the \`createAndDeployFunction\` tool, you MUST generate all necessary files, including \`package.json\` if there are dependencies, and pass them in the 'files' argument.
Example \`package.json\`:
\`\`\`json
{
  "name": "my-function",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "type": "module",
  "scripts": { "test": "echo \\"Error: no test specified\\" && exit 1" },
  "dependencies": { "node-appwrite": "^12.0.1" }
}
\`\`\`
Note the \`"type": "module"\` which is required for using ES module syntax (import/export).`;
    }

    // Define base chat configuration
    const chatConfig: {
        systemInstruction: string;
        tools?: any[];
        thinkingConfig?: { thinkingBudget: number };
    } = {
        systemInstruction: systemInstruction,
        tools: filteredDefinitions.length > 0 ? [{ functionDeclarations: filteredDefinitions }] : undefined,
    };

    // Disable thinking if the model is flash and the user has opted out
    if (model === 'gemini-2.5-flash' && !geminiThinkingEnabled) {
        chatConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    return ai.chats.create({
      model: model,
      config: chatConfig,
      history: initialHistory,
    });
};


export const runAI = async (
    chat: Chat,
    prompt: string,
    context: AIContext,
    logCallback: (log: string) => void,
    updateChat: (message: Message) => void,
    files: File[] = [],
    onCodeGenerated?: (files: { name: string; content: string }[]) => void
): Promise<void> => {
    logCallback(`Starting AI run with prompt: "${prompt}"`);
    if (files.length > 0) {
        const fileNames = files.map(f => `${f.name} (${f.type}, ${f.size} bytes)`).join(', ');
        logCallback(`Files attached: ${fileNames}`);
    }
    logCallback(`Targeting Appwrite project: "${context.project.name}" (${context.project.projectId})`);

    // Guard against empty submission
    if (!prompt.trim() && files.length === 0) {
        updateChat({ id: crypto.randomUUID(), role: 'model', content: "Please provide a prompt or a file to continue." });
        return;
    }

    let userMessageText = prompt.trim();
    if (files.length > 0) {
        const fileDescriptions = files.map(file => `**${file.name}** (${file.type})`).join(', ');
        const fileDescription = `The user has attached ${files.length} file(s): ${fileDescriptions}.`;
        
        let systemNote = `\n\n[System note: You have access to these files. To deploy function code, use 'packageAndDeployFunction' with the names of the source files. To upload a pre-made .tar.gz archive, use 'createDeployment'. For other files, use 'writeFile'. You do not need to ask for their content.`;

        if (files.length > 1) {
             const fileNames = files.map(f => `"${f.name}"`).join(', ');
             systemNote += ` When calling a file-based tool, you MUST specify the correct 'fileName' or 'fileNames' argument. Available files: ${fileNames}.`;
        }
        systemNote += `]`;
        
        const systemInstruction = `\n\n${fileDescription}${systemNote}`;
        
        if (userMessageText) {
            userMessageText += systemInstruction;
        } else {
            userMessageText = `${fileDescription} Please determine what to do with them, or call a tool to process them.${systemNote}`;
        }
    }

    // 1. Send the user's prompt to the model
    logCallback(`Sending to AI: ${JSON.stringify({ message: userMessageText }, null, 2)}`);
    let result: GenerateContentResponse = await chat.sendMessage({ message: userMessageText });

    // 2. Loop until the model stops sending function calls
    while (true) {
        const text = result.text;
        const functionCalls = result.functionCalls;

        // 2a. If the model returns text, display it. This can happen with or without a tool call.
        if (text) {
            logCallback(`AI intermediate response: ${text}`);
            const modelMessage: ModelMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: text,
            };
            updateChat(modelMessage);
        }
        
        // 2b. If there are no more function calls, we are done.
        if (!functionCalls || functionCalls.length === 0) {
            logCallback('No more tool calls. AI run finished.');
            break; // Exit loop
        }

        // 3. We have function calls to execute.
        logCallback(`Model wants to call tools: ${JSON.stringify(functionCalls.map(c => c.name), null, 2)}`);

        // Create an ActionMessage in loading state and add it to the chat
        const actionMessageId = crypto.randomUUID();
        const loadingActionMessage: ActionMessage = {
            id: actionMessageId,
            role: 'action',
            toolCalls: functionCalls,
            isLoading: true,
        };
        updateChat(loadingActionMessage);


        // 4. Execute the tool calls
        const toolCallPromises = functionCalls.map(async (toolCall) => {
            const toolName = toolCall.name as keyof typeof availableTools;
            const toolToCall = availableTools[toolName];

            // If the AI is generating code, send it back to the UI to update the editor.
            if (toolName === 'createAndDeployFunction' && onCodeGenerated) {
                const codeFiles = (toolCall.args as any).files;
                if (codeFiles && Array.isArray(codeFiles)) {
                    onCodeGenerated(codeFiles);
                }
            }

            if (!toolToCall) {
                logCallback(`Error: Unknown tool referenced by the model: ${toolCall.name}`);
                return {
                    functionResponse: {
                        name: toolCall.name,
                        response: { error: `Tool ${toolCall.name} not found.` },
                    },
                };
            }
            
            // Clone args and inject file(s) if needed for specific tools
            const finalArgs = { ...toolCall.args };
            if (toolName === 'writeFile' || toolName === 'createDeployment') {
                let fileToUpload: File | undefined = undefined;
                const targetFileName = (finalArgs as any).fileName;

                if (targetFileName) {
                    fileToUpload = files.find(f => f.name === targetFileName);
                } else if (files.length === 1) {
                    fileToUpload = files[0];
                }
                
                if (toolName === 'writeFile') {
                    (finalArgs as any).fileToUpload = fileToUpload;
                } else if (toolName === 'createDeployment') {
                    (finalArgs as any).codeFile = fileToUpload;
                }
            } else if (toolName === 'packageAndDeployFunction') {
                const targetFileNames = (finalArgs as any).fileNames as string[] | undefined;
                
                if (!targetFileNames || targetFileNames.length === 0) {
                    // If model doesn't specify filenames, but files are attached, assume all attached files.
                    if (files.length > 0) {
                        console.log('No fileNames provided, using all attached files for packaging.');
                        (finalArgs as any).filesToPackage = files;
                    }
                } else {
                    const filesToPackage = files.filter(f => targetFileNames.includes(f.name));
                    if (filesToPackage.length !== targetFileNames.length) {
                        const missing = targetFileNames.filter(name => !files.some(f => f.name === name));
                        logCallback(`Error: packageAndDeployFunction missing files: ${missing.join(', ')}`);
                        return {
                            functionResponse: {
                                name: toolCall.name,
                                response: { error: `Could not find the following files attached to the message: ${missing.join(', ')}. Available files are: ${files.map(f=>f.name).join(', ')}` },
                            },
                        };
                    }
                    (finalArgs as any).filesToPackage = filesToPackage;
                }
            }


            // Execute the tool
            logCallback(`Executing tool: ${toolName} with args: ${JSON.stringify(toolCall.args, null, 2)}`);
            const toolResult = await (toolToCall as any)(context, finalArgs);
            logCallback(`Tool execution result for ${toolName}: ${JSON.stringify(toolResult, null, 2)}`);

            return {
                functionResponse: {
                    name: toolCall.name,
                    response: toolResult,
                },
            };
        });

        const toolResponses: Part[] = await Promise.all(toolCallPromises);

        // 5. Update the ActionMessage with the results
        const completedActionMessage: ActionMessage = {
            ...loadingActionMessage,
            isLoading: false,
            toolResults: toolResponses,
        };
        updateChat(completedActionMessage);


        // 6. Send all tool results back to the model and continue the loop
        logCallback(`Sending tool results to AI: ${JSON.stringify(toolResponses, null, 2)}`);
        
        // Add a text part to provide context to the model about the tool results.
        // This is intended to help the Gemini API correctly process the function responses and avoid potential errors.
        const messageWithContext: Part[] = [
            { text: "The requested tool calls have been executed. Here are their results. Please analyze these and formulate the next response." },
            ...toolResponses
        ];

        result = await chat.sendMessage({ message: messageWithContext });
    }
};
