
import { openDB } from 'idb';

const DB_NAME = 'dv_studio_audit';
const STORE_NAME = 'audit_logs';

export interface AuditLogEntry {
    id?: number;
    timestamp: number;
    projectId: string;
    toolName: string;
    args: string;
    status: 'success' | 'error';
    result?: string;
    duration?: number;
}

export const initAuditDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('projectId', 'projectId');
                store.createIndex('timestamp', 'timestamp');
                store.createIndex('status', 'status');
            }
        },
    });
};

export const logAuditAction = async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    try {
        const db = await initAuditDB();
        await db.add(STORE_NAME, {
            ...entry,
            timestamp: Date.now(),
        });
    } catch (e) {
        console.error("Failed to write to audit log", e);
    }
};

export const getAuditLogs = async (projectId?: string) => {
    try {
        const db = await initAuditDB();
        if (projectId) {
            return db.getAllFromIndex(STORE_NAME, 'projectId', projectId);
        }
        return db.getAll(STORE_NAME);
    } catch (e) {
        console.error("Failed to read audit logs", e);
        return [];
    }
};

export const clearAuditLogs = async () => {
    const db = await initAuditDB();
    await db.clear(STORE_NAME);
};

export const exportLogsToCSV = (logs: AuditLogEntry[]) => {
    const headers = ['Timestamp', 'Project ID', 'Tool', 'Status', 'Duration (ms)', 'Arguments', 'Result'];
    
    // Sort logs by timestamp descending
    const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

    const rows = sortedLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.projectId,
        log.toolName,
        log.status,
        log.duration || '',
        `"${log.args.replace(/"/g, '""')}"`, // Escape quotes for CSV
        `"${(log.result || '').replace(/"/g, '""').substring(0, 5000)}"` // Truncate huge results for CSV safety
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
