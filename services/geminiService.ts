

import { GoogleGenAI, type Chat, type GenerateContentResponse, type Part, type FunctionCall } from '@google/genai';
import { availableTools, toolDefinitionGroups } from '../tools';
import type { AIContext, Message, ActionMessage, ModelMessage } from '../types';

const getClient = (apiKey?: string | null): GoogleGenAI => {
    const keyToUse = apiKey || process.env.API_KEY;
    if (!keyToUse) {
        throw new Error('Gemini API Key is not configured. Please provide one in the sidebar settings or set the API_KEY environment variable.');
    }
    return new GoogleGenAI({ apiKey: keyToUse });
};

export const createChatSession = (
    activeTools: { [key: string]: boolean }, 
    model: string, 
    context: AIContext,
    geminiThinkingEnabled: boolean,
    apiKey?: string | null
): Chat => {
    const ai = getClient(apiKey);
    const enabledToolCategories = Object.keys(activeTools).filter(
        (key) => activeTools[key as keyof typeof toolDefinitionGroups]
    );

    const filteredDefinitions = enabledToolCategories.flatMap(
        (category) => toolDefinitionGroups[category as keyof typeof toolDefinitionGroups] || []
    );
    
    // Build a dynamic system instruction based on the provided context
    let systemInstruction = `You are an expert Appwrite agent. The user is working on the Appwrite project named "${context.project.name}" (ID: ${context.project.projectId}).`;
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
    });
};


export const runAI = async (
    chat: Chat,
    prompt: string,
    context: AIContext,
    logCallback: (log: string) => void,
    updateChat: (message: Message) => void,
    files: File[] = []
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