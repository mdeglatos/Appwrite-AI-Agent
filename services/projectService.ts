
import { Databases, ID, Permission, Role, Query } from 'appwrite';
import type { Models } from 'appwrite';
import { appwriteConfig } from '../config';
import { client, account } from './appwrite';
import type { AppwriteProject } from '../types';

// IMPORTANT: Before this service can work, you must set up the following in your Appwrite project:
// 1. A Database with the ID specified in `config.ts` (e.g., "agent-db").
// 2. A Collection inside that database with the ID specified in `config.ts` (e.g., "projects").
// 3. The collection must have the following attributes (and matching keys):
//    - name (string, required)
//    - endpoint (string, required, format: URL)
//    - projectId (string, required)
//    - apiKey (string, required)
//    - userId (string, required)
// 4. Create an index on the 'userId' attribute for efficient querying.

const databases = new Databases(client);

export type NewAppwriteProject = Omit<AppwriteProject, '$id'>;

export async function getProjects(userId: string): Promise<AppwriteProject[]> {
    const response = await databases.listDocuments<Models.Document & AppwriteProject>(
        appwriteConfig.databaseId,
        appwriteConfig.projectsCollectionId,
        [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
    );
    return response.documents;
}

export async function addProject(projectData: NewAppwriteProject, userId: string): Promise<AppwriteProject> {
    const doc = {
        ...projectData,
        userId: userId,
    };

    const response = await databases.createDocument<Models.Document & AppwriteProject>(
        appwriteConfig.databaseId,
        appwriteConfig.projectsCollectionId,
        ID.unique(),
        doc,
        [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
        ]
    );
    return response;
}

export async function deleteProject(docId: string): Promise<void> {
    await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.projectsCollectionId,
        docId
    );
}

export async function setActiveProjectPreference(projectId: string | null) {
    const user = await account.get();
    await account.updatePrefs({ ...user.prefs, activeProjectId: projectId });
}
