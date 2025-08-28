import { getSdkDatabases, ID, Query } from '../services/appwrite';
import type { AIContext } from '../types';
import { Type, type FunctionDeclaration } from '@google/genai';

async function handleApiError(error: unknown) {
    console.error('Appwrite API error in database tool:', error);
    if (error instanceof Error) {
        return { error: `Appwrite API Error: ${error.message}` };
    }
    return { error: 'An unknown error occurred while communicating with the Appwrite API.' };
}

// Document-level functions
async function listDocuments(context: AIContext, { databaseId, collectionId, limit = 100 }: { databaseId?: string, collectionId?: string, limit?: number }) {
  const finalDbId = databaseId || context.database?.$id;
  const finalCollectionId = collectionId || context.collection?.$id;
  if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
  if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };
  
  const finalLimit = Math.min(limit, 100);
  console.log(`Executing listDocuments tool with: db='${finalDbId}', collection='${finalCollectionId}', limit=${finalLimit}`);
  try {
    const databases = getSdkDatabases(context.project);
    return await databases.listDocuments(finalDbId, finalCollectionId, [Query.limit(finalLimit)]);
  } catch (error) {
    return handleApiError(error);
  }
}

async function getDocument(context: AIContext, { databaseId, collectionId, documentId }: { databaseId?: string, collectionId?: string, documentId: string }) {
  const finalDbId = databaseId || context.database?.$id;
  const finalCollectionId = collectionId || context.collection?.$id;
  if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
  if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

  console.log(`Executing getDocument tool for doc '${documentId}'`);
  try {
    const databases = getSdkDatabases(context.project);
    return await databases.getDocument(finalDbId, finalCollectionId, documentId);
  } catch (error) {
    return handleApiError(error);
  }
}

async function createDocument(context: AIContext, { databaseId, collectionId, documentId, data }: { databaseId?: string, collectionId?: string, documentId: string, data: string }) {
  const finalDbId = databaseId || context.database?.$id;
  const finalCollectionId = collectionId || context.collection?.$id;
  if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
  if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

  console.log(`Executing createDocument tool for collection '${finalCollectionId}'`);
  try {
    const parsedData = JSON.parse(data);
    const docId = documentId.toLowerCase() === 'unique()' ? ID.unique() : documentId;
    const databases = getSdkDatabases(context.project);
    return await databases.createDocument(finalDbId, finalCollectionId, docId, parsedData);
  } catch (error) {
    if (error instanceof SyntaxError) {
        return { error: `Invalid JSON format for data: ${error.message}`};
    }
    return handleApiError(error);
  }
}

async function updateDocument(context: AIContext, { databaseId, collectionId, documentId, data }: { databaseId?: string, collectionId?: string, documentId: string, data: string }) {
  const finalDbId = databaseId || context.database?.$id;
  const finalCollectionId = collectionId || context.collection?.$id;
  if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
  if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

  console.log(`Executing updateDocument tool for doc '${documentId}'`);
  try {
    const parsedData = JSON.parse(data);
    const databases = getSdkDatabases(context.project);
    return await databases.updateDocument(finalDbId, finalCollectionId, documentId, parsedData);
  } catch (error) {
     if (error instanceof SyntaxError) {
        return { error: `Invalid JSON format for data: ${error.message}`};
    }
    return handleApiError(error);
  }
}

async function deleteDocument(context: AIContext, { databaseId, collectionId, documentId }: { databaseId?: string, collectionId?: string, documentId: string }) {
  const finalDbId = databaseId || context.database?.$id;
  const finalCollectionId = collectionId || context.collection?.$id;
  if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
  if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

  console.log(`Executing deleteDocument tool for doc '${documentId}'`);
  try {
    const databases = getSdkDatabases(context.project);
    await databases.deleteDocument(finalDbId, finalCollectionId, documentId);
    return { success: `Successfully deleted document ${documentId}`};
  } catch (error) {
    return handleApiError(error);
  }
}

// Database-level functions
async function listDatabases(context: AIContext, { limit = 100 }: { limit?: number }) {
    const finalLimit = Math.min(limit, 100);
    console.log(`Executing listDatabases tool with limit=${finalLimit}`);
    try {
        const databases = getSdkDatabases(context.project);
        return await databases.list([Query.limit(finalLimit)]);
    } catch (error) {
        return handleApiError(error);
    }
}

async function createDatabase(context: AIContext, { databaseId, name }: { databaseId: string, name: string }) {
    console.log(`Executing createDatabase tool with name: '${name}'`);
    try {
        const dbId = databaseId.toLowerCase() === 'unique()' ? ID.unique() : databaseId;
        const databases = getSdkDatabases(context.project);
        return await databases.create(dbId, name);
    } catch (error) {
        return handleApiError(error);
    }
}

async function deleteDatabase(context: AIContext, { databaseId }: { databaseId?: string }) {
    const finalDatabaseId = databaseId || context.database?.$id;
    if (!finalDatabaseId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };

    console.log(`Executing deleteDatabase tool for db '${finalDatabaseId}'`);
    try {
        const databases = getSdkDatabases(context.project);
        await databases.delete(finalDatabaseId);
        return { success: `Successfully deleted database ${finalDatabaseId}`};
    } catch (error) {
        return handleApiError(error);
    }
}

// Collection-level functions
async function listCollections(context: AIContext, { databaseId, limit = 100 }: { databaseId?: string, limit?: number }) {
    const finalDbId = databaseId || context.database?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };

    const finalLimit = Math.min(limit, 100);
    console.log(`Executing listCollections tool for db '${finalDbId}' with limit=${finalLimit}`);
    try {
        const databases = getSdkDatabases(context.project);
        return await databases.listCollections(finalDbId, [Query.limit(finalLimit)]);
    } catch (error) {
        return handleApiError(error);
    }
}

async function createCollection(context: AIContext, { databaseId, collectionId, name, permissions }: { databaseId?: string, collectionId: string, name: string, permissions?: string[] }) {
    const finalDbId = databaseId || context.database?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
    
    console.log(`Executing createCollection tool with name '${name}' in db '${finalDbId}'`);
    try {
        const collId = collectionId.toLowerCase() === 'unique()' ? ID.unique() : collectionId;
        const databases = getSdkDatabases(context.project);
        return await databases.createCollection(finalDbId, collId, name, permissions);
    } catch (error) {
        return handleApiError(error);
    }
}

async function deleteCollection(context: AIContext, { databaseId, collectionId }: { databaseId?: string, collectionId?: string }) {
    const finalDbId = databaseId || context.database?.$id;
    const finalCollectionId = collectionId || context.collection?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
    if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

    console.log(`Executing deleteCollection tool for collection '${finalCollectionId}'`);
    try {
        const databases = getSdkDatabases(context.project);
        await databases.deleteCollection(finalDbId, finalCollectionId);
        return { success: `Successfully deleted collection ${finalCollectionId}` };
    } catch (error) {
        return handleApiError(error);
    }
}

async function setCollectionPermissions(context: AIContext, { databaseId, collectionId, permissions }: { databaseId?: string, collectionId?: string, permissions: string[] }) {
    const finalDbId = databaseId || context.database?.$id;
    const finalCollectionId = collectionId || context.collection?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
    if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

    console.log(`Executing setCollectionPermissions for collection '${finalCollectionId}'`);
    try {
        const databases = getSdkDatabases(context.project);
        // We need the current name to update permissions without changing the name.
        const currentCollection = await databases.getCollection(finalDbId, finalCollectionId);
        return await databases.updateCollection(finalDbId, finalCollectionId, currentCollection.name, permissions);
    } catch (error) {
        return handleApiError(error);
    }
}


// Attribute-level functions
async function createAttribute(
    context: AIContext,
    collectionDetails: { databaseId?: string, collectionId?: string },
    createFn: (db: ReturnType<typeof getSdkDatabases>, dbId: string, collId: string) => Promise<any>
) {
    const finalDbId = collectionDetails.databaseId || context.database?.$id;
    const finalCollectionId = collectionDetails.collectionId || context.collection?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
    if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

    try {
        const databases = getSdkDatabases(context.project);
        return await createFn(databases, finalDbId, finalCollectionId);
    } catch (error) {
        return handleApiError(error);
    }
}

async function listAttributes(context: AIContext, { databaseId, collectionId }: { databaseId?: string, collectionId?: string }) {
    const finalDbId = databaseId || context.database?.$id;
    const finalCollectionId = collectionId || context.collection?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
    if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

    console.log(`Executing listAttributes for collection '${finalCollectionId}'`);
    try {
        const databases = getSdkDatabases(context.project);
        return await databases.listAttributes(finalDbId, finalCollectionId);
    } catch (error) {
        return handleApiError(error);
    }
}

async function deleteAttribute(context: AIContext, { databaseId, collectionId, key }: { databaseId?: string, collectionId?: string, key: string }) {
    const finalDbId = databaseId || context.database?.$id;
    const finalCollectionId = collectionId || context.collection?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
    if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

    console.log(`Executing deleteAttribute for key '${key}' in collection '${finalCollectionId}'`);
    try {
        const databases = getSdkDatabases(context.project);
        await databases.deleteAttribute(finalDbId, finalCollectionId, key);
        return { success: `Successfully deleted attribute with key: ${key}` };
    } catch (error) {
        return handleApiError(error);
    }
}

async function createStringAttribute(context: AIContext, { databaseId, collectionId, key, size, required, 'default': defaultValue, array }: { databaseId?: string, collectionId?: string, key: string, size: number, required: boolean, 'default'?: string, array?: boolean }) {
    console.log(`Executing createStringAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createStringAttribute(dbId, collId, key, size, required, defaultValue, array));
}

async function createIntegerAttribute(context: AIContext, { databaseId, collectionId, key, required, min, max, 'default': defaultValue, array }: { databaseId?: string, collectionId?: string, key: string, required: boolean, min?: number, max?: number, 'default'?: number, array?: boolean }) {
    console.log(`Executing createIntegerAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createIntegerAttribute(dbId, collId, key, required, min, max, defaultValue, array));
}

async function createFloatAttribute(context: AIContext, { databaseId, collectionId, key, required, min, max, 'default': defaultValue, array }: { databaseId?: string, collectionId?: string, key: string, required: boolean, min?: number, max?: number, 'default'?: number, array?: boolean }) {
    console.log(`Executing createFloatAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createFloatAttribute(dbId, collId, key, required, min, max, defaultValue, array));
}

async function createBooleanAttribute(context: AIContext, { databaseId, collectionId, key, required, 'default': defaultValue, array }: { databaseId?: string, collectionId?: string, key: string, required: boolean, 'default'?: boolean, array?: boolean }) {
    console.log(`Executing createBooleanAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createBooleanAttribute(dbId, collId, key, required, defaultValue, array));
}

async function createDatetimeAttribute(context: AIContext, { databaseId, collectionId, key, required, 'default': defaultValue, array }: { databaseId?: string, collectionId?: string, key: string, required: boolean, 'default'?: string, array?: boolean }) {
    console.log(`Executing createDatetimeAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createDatetimeAttribute(dbId, collId, key, required, defaultValue, array));
}

async function createEmailAttribute(context: AIContext, { databaseId, collectionId, key, required, 'default': defaultValue, array }: { databaseId?: string, collectionId?: string, key: string, required: boolean, 'default'?: string, array?: boolean }) {
    console.log(`Executing createEmailAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createEmailAttribute(dbId, collId, key, required, defaultValue, array));
}

async function createIpAttribute(context: AIContext, { databaseId, collectionId, key, required, 'default': defaultValue, array }: { databaseId?: string, collectionId?: string, key: string, required: boolean, 'default'?: string, array?: boolean }) {
    console.log(`Executing createIpAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createIpAttribute(dbId, collId, key, required, defaultValue, array));
}

async function createUrlAttribute(context: AIContext, { databaseId, collectionId, key, required, 'default': defaultValue, array }: { databaseId?: string, collectionId?: string, key: string, required: boolean, 'default'?: string, array?: boolean }) {
    console.log(`Executing createUrlAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createUrlAttribute(dbId, collId, key, required, defaultValue, array));
}

async function createEnumAttribute(context: AIContext, { databaseId, collectionId, key, elements, required, 'default': defaultValue, array }: { databaseId?: string, collectionId?: string, key: string, elements: string[], required: boolean, 'default'?: string, array?: boolean }) {
    console.log(`Executing createEnumAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createEnumAttribute(dbId, collId, key, elements, required, defaultValue, array));
}

async function createRelationshipAttribute(context: AIContext, { databaseId, collectionId, relatedCollectionId, type, twoWay, key, twoWayKey, onDelete }: { databaseId?: string, collectionId?: string, relatedCollectionId: string, type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany', twoWay: boolean, key: string, twoWayKey?: string, onDelete?: 'cascade' | 'restrict' | 'setNull' }) {
    console.log(`Executing createRelationshipAttribute for key '${key}'`);
    return createAttribute(context, { databaseId, collectionId }, (db, dbId, collId) => db.createRelationshipAttribute(dbId, collId, relatedCollectionId, type as any, twoWay, key, twoWayKey, onDelete));
}

// Index-level functions
async function listIndexes(context: AIContext, { databaseId, collectionId }: { databaseId?: string, collectionId?: string }) {
    const finalDbId = databaseId || context.database?.$id;
    const finalCollectionId = collectionId || context.collection?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
    if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

    console.log(`Executing listIndexes for collection '${finalCollectionId}'`);
    try {
        const databases = getSdkDatabases(context.project);
        return await databases.listIndexes(finalDbId, finalCollectionId);
    } catch (error) {
        return handleApiError(error);
    }
}

async function createIndex(context: AIContext, { databaseId, collectionId, key, type, attributes }: { databaseId?: string, collectionId?: string, key: string, type: 'key' | 'fulltext' | 'unique', attributes: string[] }) {
    const finalDbId = databaseId || context.database?.$id;
    const finalCollectionId = collectionId || context.collection?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
    if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

    console.log(`Executing createIndex tool for key '${key}'`);
    try {
        const databases = getSdkDatabases(context.project);
        return await databases.createIndex(finalDbId, finalCollectionId, key, type as any, attributes);
    } catch (error) {
        return handleApiError(error);
    }
}

async function deleteIndex(context: AIContext, { databaseId, collectionId, key }: { databaseId?: string, collectionId?: string, key: string }) {
    const finalDbId = databaseId || context.database?.$id;
    const finalCollectionId = collectionId || context.collection?.$id;
    if (!finalDbId) return { error: 'Database ID is missing. Please provide a databaseId or select a database from the context menu.' };
    if (!finalCollectionId) return { error: 'Collection ID is missing. Please provide a collectionId or select a collection from the context menu.' };

    console.log(`Executing deleteIndex tool for key '${key}'`);
    try {
        const databases = getSdkDatabases(context.project);
        await databases.deleteIndex(finalDbId, finalCollectionId, key);
        return { success: `Successfully deleted index ${key}` };
    } catch (error) {
        return handleApiError(error);
    }
}


export const databaseFunctions = {
  // Documents
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  // Databases
  listDatabases,
  createDatabase,
  deleteDatabase,
  // Collections
  listCollections,
  createCollection,
  deleteCollection,
  setCollectionPermissions,
  // Attributes
  listAttributes,
  deleteAttribute,
  createStringAttribute,
  createIntegerAttribute,
  createFloatAttribute,
  createBooleanAttribute,
  createDatetimeAttribute,
  createEmailAttribute,
  createIpAttribute,
  createUrlAttribute,
  createEnumAttribute,
  createRelationshipAttribute,
  // Indexes
  listIndexes,
  createIndex,
  deleteIndex,
};

export const databaseToolDefinitions: FunctionDeclaration[] = [
  // Document Tools
  {
    name: 'listDocuments',
    description: 'Lists documents in a collection. Uses the active database and collection from the context if IDs are not provided.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
        collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
        limit: { type: Type.INTEGER, description: 'Optional. The maximum number of documents to return. Default is 100. Maximum is 100.' },
      },
      required: [],
    },
  },
  {
    name: 'getDocument',
    description: 'Gets a single document by its ID. Uses the active database and collection from the context if IDs are not provided.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
        collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
        documentId: { type: Type.STRING, description: 'The ID of the document to retrieve.' },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'createDocument',
    description: 'Creates a new document. Uses the active database and collection from the context if IDs are not provided.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
        collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
        documentId: { type: Type.STRING, description: "Unique ID for the document. Use 'unique()' to auto-generate." },
        data: { type: Type.STRING, description: 'A JSON string representing the document data. E.g., \'{"title": "Post", "isPublished": true}\'.',},
      },
      required: ['documentId', 'data'],
    },
  },
  {
      name: 'updateDocument',
      description: 'Updates an existing document. Uses the active database and collection from the context if IDs are not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          documentId: { type: Type.STRING, description: 'The ID of the document to update.' },
          data: { type: Type.STRING, description: 'A JSON string of fields to update. E.g., \'{"isPublished": false}\'.',},
        },
        required: ['documentId', 'data'],
      },
  },
  {
      name: 'deleteDocument',
      description: 'Deletes a document. Uses the active database and collection from the context if IDs are not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          documentId: { type: Type.STRING, description: 'The ID of the document to delete.' },
        },
        required: ['documentId'],
      },
  },
  // Database Tools
  {
      name: 'listDatabases',
      description: 'Lists all databases in the current Appwrite project.',
      parameters: {
        type: Type.OBJECT,
        properties: {
            limit: { type: Type.INTEGER, description: 'Optional. The maximum number of databases to return. Default is 100. Maximum is 100.' },
        },
        required: []
      },
  },
  {
      name: 'createDatabase',
      description: 'Creates a new database.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: "Unique ID for the database. Use 'unique()' to auto-generate." },
          name: { type: Type.STRING, description: 'The name for the new database.' },
        },
        required: ['databaseId', 'name'],
      },
  },
  {
      name: 'deleteDatabase',
      description: 'Deletes a database. Uses the active database from the context if an ID is not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The ID of the database to delete. Defaults to the active context.' },
        },
        required: [],
      },
  },
  // Collection Tools
  {
      name: 'listCollections',
      description: 'Lists all collections within a database. Uses the active database from the context if ID is not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          limit: { type: Type.INTEGER, description: 'Optional. The maximum number of collections to return. Default is 100. Maximum is 100.' },
        },
        required: [],
      },
  },
  {
      name: 'createCollection',
      description: 'Creates a new collection. Uses the active database from the context if ID is not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: "Unique ID. Use 'unique()' to auto-generate." },
          name: { type: Type.STRING, description: 'The name for the new collection.' },
          permissions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional. Array of permission strings. Controls who can access the documents in this collection." },
        },
        required: ['collectionId', 'name'],
      },
  },
  {
      name: 'deleteCollection',
      description: 'Deletes a collection. Uses the active database and collection from the context if IDs are not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The ID of the collection to delete. Defaults to the active context.' },
        },
        required: [],
      },
  },
  {
      name: 'setCollectionPermissions',
      description: 'Sets collection permissions. Uses active context for IDs. WARNING: This overwrites all existing permissions.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          permissions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Array of permission strings. E.g., ["read(\\"any\\")", "create(\\"users\\")"]'
          },
        },
        required: ['permissions'],
      },
  },
  // Attribute Tools
  {
    name: 'listAttributes',
    description: 'Lists attributes for a collection. Uses active context for IDs if not provided.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
        collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
      },
      required: [],
    },
  },
  {
      name: 'deleteAttribute',
      description: 'Deletes an attribute from a collection. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The key of the attribute to delete.' },
        },
        required: ['key'],
      },
  },
  {
      name: 'createStringAttribute',
      description: 'Creates a new string attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the attribute. (e.g., "title")' },
          size: { type: Type.INTEGER, description: 'The size of the string in bytes. (e.g., 255)' },
          required: { type: Type.BOOLEAN, description: 'Is this attribute required?' },
          'default': { type: Type.STRING, description: 'Optional. Default value for the attribute.' },
          array: { type: Type.BOOLEAN, description: 'Optional. Is this attribute an array? Defaults to false.' },
        },
        required: ['key', 'size', 'required'],
      },
  },
  {
      name: 'createIntegerAttribute',
      description: 'Creates a new integer attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the attribute. (e.g., "age")' },
          required: { type: Type.BOOLEAN, description: 'Is this attribute required?' },
          min: { type: Type.INTEGER, description: 'Optional. Minimum value.' },
          max: { type: Type.INTEGER, description: 'Optional. Maximum value.' },
          'default': { type: Type.INTEGER, description: 'Optional. Default value.' },
          array: { type: Type.BOOLEAN, description: 'Optional. Is this attribute an array? Defaults to false.' },
        },
        required: ['key', 'required'],
      },
  },
  {
      name: 'createFloatAttribute',
      description: 'Creates a new float attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the attribute. (e.g., "price")' },
          required: { type: Type.BOOLEAN, description: 'Is this attribute required?' },
          min: { type: Type.NUMBER, description: 'Optional. Minimum value.' },
          max: { type: Type.NUMBER, description: 'Optional. Maximum value.' },
          'default': { type: Type.NUMBER, description: 'Optional. Default value.' },
          array: { type: Type.BOOLEAN, description: 'Optional. Is this attribute an array? Defaults to false.' },
        },
        required: ['key', 'required'],
      },
  },
  {
      name: 'createBooleanAttribute',
      description: 'Creates a new boolean attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the attribute. (e.g., "isPublished")' },
          required: { type: Type.BOOLEAN, description: 'Is this attribute required?' },
          'default': { type: Type.BOOLEAN, description: 'Optional. Default value.' },
          array: { type: Type.BOOLEAN, description: 'Optional. Is this attribute an array? Defaults to false.' },
        },
        required: ['key', 'required'],
      },
  },
  {
      name: 'createDatetimeAttribute',
      description: 'Creates a new datetime attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the attribute. (e.g., "publishedAt")' },
          required: { type: Type.BOOLEAN, description: 'Is this attribute required?' },
          'default': { type: Type.STRING, description: 'Optional. Default value as an ISO 8601 string.' },
          array: { type: Type.BOOLEAN, description: 'Optional. Is this attribute an array? Defaults to false.' },
        },
        required: ['key', 'required'],
      },
  },
  {
      name: 'createEmailAttribute',
      description: 'Creates a new email attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the attribute. (e.g., "userEmail")' },
          required: { type: Type.BOOLEAN, description: 'Is this attribute required?' },
          'default': { type: Type.STRING, description: 'Optional. Default email value.' },
          array: { type: Type.BOOLEAN, description: 'Optional. Is this attribute an array? Defaults to false.' },
        },
        required: ['key', 'required'],
      },
  },
  {
      name: 'createIpAttribute',
      description: 'Creates a new IP address attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the attribute. (e.g., "userIp")' },
          required: { type: Type.BOOLEAN, description: 'Is this attribute required?' },
          'default': { type: Type.STRING, description: 'Optional. Default IP address value.' },
          array: { type: Type.BOOLEAN, description: 'Optional. Is this attribute an array? Defaults to false.' },
        },
        required: ['key', 'required'],
      },
  },
  {
      name: 'createUrlAttribute',
      description: 'Creates a new URL attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the attribute. (e.g., "website")' },
          required: { type: Type.BOOLEAN, description: 'Is this attribute required?' },
          'default': { type: Type.STRING, description: 'Optional. Default URL value.' },
          array: { type: Type.BOOLEAN, description: 'Optional. Is this attribute an array? Defaults to false.' },
        },
        required: ['key', 'required'],
      },
  },
  {
      name: 'createEnumAttribute',
      description: 'Creates a new enum attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the attribute. (e.g., "status")' },
          elements: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Array of enum elements.' },
          required: { type: Type.BOOLEAN, description: 'Is this attribute required?' },
          'default': { type: Type.STRING, description: 'Optional. Default enum value.' },
          array: { type: Type.BOOLEAN, description: 'Optional. Is this attribute an array? Defaults to false.' },
        },
        required: ['key', 'elements', 'required'],
      },
  },
  {
      name: 'createRelationshipAttribute',
      description: 'Creates a new relationship attribute. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          relatedCollectionId: { type: Type.STRING, description: 'The ID of the related collection.' },
          type: { type: Type.STRING, description: 'Relationship type: "oneToOne", "oneToMany", "manyToOne", or "manyToMany".' },
          twoWay: { type: Type.BOOLEAN, description: 'Is the relationship two-way?' },
          key: { type: Type.STRING, description: 'Unique key for this side of the relationship.' },
          twoWayKey: { type: Type.STRING, description: 'Optional. Unique key for the other side of the relationship (required if twoWay is true).' },
          onDelete: { type: Type.STRING, description: 'Optional. Behavior on delete: "cascade", "restrict", or "setNull". Can be "cascade", "restrict", or "setNull". Default is "restrict".' },
        },
        required: ['relatedCollectionId', 'type', 'twoWay', 'key'],
      },
  },
  // Index Tools
  {
    name: 'listIndexes',
    description: 'Lists indexes for a collection. Uses active context for IDs if not provided.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
        collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
      },
      required: [],
    },
  },
  {
      name: 'createIndex',
      description: 'Creates a new index. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The unique key for the index. (e.g., "title_index")' },
          type: { type: Type.STRING, description: 'Type of index: "key", "fulltext", or "unique".' },
          attributes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Array of attribute keys for the index.' },
        },
        required: ['key', 'type', 'attributes'],
      },
  },
  {
      name: 'deleteIndex',
      description: 'Deletes an index. Uses active context for IDs if not provided.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          databaseId: { type: Type.STRING, description: 'Optional. The database ID. Defaults to the active context.' },
          collectionId: { type: Type.STRING, description: 'Optional. The collection ID. Defaults to the active context.' },
          key: { type: Type.STRING, description: 'The key of the index to delete.' },
        },
        required: ['key'],
      },
  },
];