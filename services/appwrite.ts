import { Client, Account, ID, AppwriteException, Query, Permission, Role } from 'appwrite';
import { Client as NodeClient, Databases, Storage, Functions } from 'node-appwrite';
import type { AppwriteProject } from '../types';
import { appwriteConfig } from '../config';

// Main client for user authentication, connected to the app's own backend.
export const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

export const account = new Account(client);


/**
 * Creates a temporary, admin-level Appwrite client for a specific user-defined project.
 * This client is configured with the project's endpoint, ID, and a server-side API key,
 * allowing it to perform administrative actions. This uses the node-appwrite SDK.
 * @param project - The Appwrite project to connect to.
 * @returns An authenticated node-appwrite client instance.
 */
function createProjectAdminClient(project: AppwriteProject): NodeClient {
    if (!project || !project.endpoint || !project.projectId || !project.apiKey) {
        throw new Error('Appwrite project configuration is missing or incomplete.');
    }
    
    const client = new NodeClient();
    client
        .setEndpoint(project.endpoint)
        .setProject(project.projectId)
        .setKey(project.apiKey);
    return client;
}

/**
 * Returns an Appwrite Databases service instance configured for a specific project.
 * @param project - The Appwrite project to interact with.
 * @returns A Databases service instance from the node-appwrite SDK.
 */
export function getSdkDatabases(project: AppwriteProject): Databases {
    const client = createProjectAdminClient(project);
    return new Databases(client);
}

/**
 * Returns an Appwrite Storage service instance configured for a specific project.
 * @param project - The Appwrite project to interact with.
 * @returns A Storage service instance from the node-appwrite SDK.
 */
export function getSdkStorage(project: AppwriteProject): Storage {
    const client = createProjectAdminClient(project);
    return new Storage(client);
}

/**
 * Returns an Appwrite Functions service instance configured for a specific project.
 * @param project - The Appwrite project to interact with.
 * @returns A Functions service instance from the node-appwrite SDK.
 */
export function getSdkFunctions(project: AppwriteProject): Functions {
    const client = createProjectAdminClient(project);
    return new Functions(client);
}


// Re-export key Appwrite modules for convenience in other parts of the app.
// These are from the web-sdk but are generally compatible.
export { ID, Query, Permission, Role, AppwriteException };