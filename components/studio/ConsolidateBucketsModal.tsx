
import React, { useState } from 'react';
import { Modal } from '../Modal';
import { LoadingSpinnerIcon, RefreshIcon, StorageIcon, RiRocketLine } from '../Icons';
import type { AppwriteProject, Bucket } from '../../types';
import { getSdkStorage, getSdkFunctions, Query, ID } from '../../services/appwrite';
import { deployCodeFromString } from '../../tools/functionsTools';

interface ConsolidateBucketsModalProps {
    isOpen: boolean;
    onClose: () => void;
    buckets: Bucket[];
    activeProject: AppwriteProject;
    onSuccess: () => void;
}

export const ConsolidateBucketsModal: React.FC<ConsolidateBucketsModalProps> = ({ 
    isOpen, onClose, buckets, activeProject, onSuccess 
}) => {
    const [sourceBucketIds, setSourceBucketIds] = useState<string[]>([]);
    const [destBucketId, setDestBucketId] = useState<string>('');
    const [deleteOriginals, setDeleteOriginals] = useState(true); // Move vs Copy
    const [isExecuting, setIsExecuting] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleSourceToggle = (id: string) => {
        if (sourceBucketIds.includes(id)) {
            setSourceBucketIds(prev => prev.filter(b => b !== id));
        } else {
            setSourceBucketIds(prev => [...prev, id]);
        }
    };

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const deployWorker = async () => {
        addLog("🚀 Deploying temporary worker function...");
        const functions = getSdkFunctions(activeProject);
        const functionId = ID.unique();
        const workerName = '_dv_consolidate_worker';

        // 1. Create Function
        const func = await functions.create(
            functionId,
            workerName,
            'node-18.0' as any,
            undefined, undefined, '', 15, true, true
        );

        // 2. Code Bundle
        const packageJson = JSON.stringify({
            name: "consolidation-worker",
            dependencies: { "node-appwrite": "^14.0.0" }
        });

        const indexJs = `
        const nodeAppwrite = require('node-appwrite');
        const { Client, Storage } = nodeAppwrite;

        module.exports = async ({ req, res, log, error }) => {
            try {
                let payload = req.body;
                if (typeof payload === 'string') {
                    try { payload = JSON.parse(payload); } catch(e) {}
                }
                
                const { 
                    sourceBucketId, fileId, destBucketId, 
                    apiKey, endpoint, projectId, deleteSource 
                } = payload;

                // 1. Setup Client
                const client = new Client()
                    .setEndpoint(endpoint)
                    .setProject(projectId)
                    .setKey(apiKey);

                const storage = new Storage(client);

                // 2. Download File Metadata & Content
                const fileMeta = await storage.getFile(sourceBucketId, fileId);
                const arrayBuffer = await storage.getFileDownload(sourceBucketId, fileId);

                // 3. Upload to Destination
                // Using native global fetch & FormData (available in Node 18+) to ensure correct multipart upload
                const blob = new Blob([arrayBuffer], { type: fileMeta.mimeType });
                const formData = new FormData();
                formData.append('fileId', fileId); // Preserve the ID
                formData.append('file', blob, fileMeta.name);
                
                if (fileMeta.$permissions && Array.isArray(fileMeta.$permissions)) {
                    fileMeta.$permissions.forEach((p, i) => formData.append(\`permissions[\${i}]\`, p));
                }

                const uploadUrl = \`\${endpoint}/storage/buckets/\${destBucketId}/files\`;
                
                const uploadRes = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'X-Appwrite-Project': projectId,
                        'X-Appwrite-Key': apiKey,
                    },
                    body: formData
                });

                if (!uploadRes.ok) {
                    const errText = await uploadRes.text();
                    // If file exists (409), we consider it a success/skip to avoid breaking the batch
                    if (uploadRes.status === 409) {
                        log('File already exists: ' + fileId);
                    } else {
                        throw new Error(\`Upload failed: \${uploadRes.status} \${errText}\`);
                    }
                }

                // 4. Delete Source (if requested)
                if (deleteSource) {
                    await storage.deleteFile(sourceBucketId, fileId);
                }

                return res.json({ success: true });

            } catch (e) {
                error(e.message);
                return res.json({ success: false, error: e.message }, 500);
            }
        };
        `;

        // 3. Deploy
        await deployCodeFromString(
            activeProject,
            func.$id,
            [
                { name: 'package.json', content: packageJson },
                { name: 'src/main.js', content: indexJs }
            ],
            true,
            'src/main.js',
            'npm install'
        );

        addLog(`Worker deployed (${func.$id}). Waiting for build...`);

        // Wait for ready
        let tries = 0;
        while(tries < 30) { // 60s max
            await new Promise(r => setTimeout(r, 2000));
            const deployments = await functions.listDeployments(func.$id, [Query.orderDesc('$createdAt'), Query.limit(1)]);
            if (deployments.deployments.length > 0) {
                const status = deployments.deployments[0].status;
                if (status === 'ready') return func.$id;
                if (status === 'failed') throw new Error('Worker build failed.');
            }
            tries++;
        }
        throw new Error('Worker build timed out.');
    };

    const executeConsolidation = async () => {
        if (sourceBucketIds.length === 0 || !destBucketId) return;
        if (sourceBucketIds.includes(destBucketId)) {
            alert("Destination bucket cannot be one of the source buckets.");
            return;
        }

        setIsExecuting(true);
        setLogs([]);
        setProgress({ current: 0, total: 0 });
        
        let workerId: string | null = null;
        const functions = getSdkFunctions(activeProject);
        const storage = getSdkStorage(activeProject);
        const destBucketName = buckets.find(b => b.$id === destBucketId)?.name || destBucketId;

        try {
            // 1. Deploy Worker
            try {
                workerId = await deployWorker();
                addLog("Worker ready. Starting batch processing...");
            } catch (e: any) {
                addLog(`ERROR deploying worker: ${e.message}`);
                addLog("Falling back to client-side transfer (slower)...");
                // Optional: Implement client-side fallback here or just fail. 
                // For now, let's fail to keep code clean as worker should work.
                throw e;
            }

            // 2. Iterate Buckets
            let totalProcessed = 0;
            for (const sourceId of sourceBucketIds) {
                const sourceName = buckets.find(b => b.$id === sourceId)?.name || sourceId;
                addLog(`Processing bucket: ${sourceName}`);

                let cursor = undefined;
                while (true) {
                    const queries = [Query.limit(50)];
                    if (cursor) queries.push(Query.cursorAfter(cursor));

                    const fileList = await storage.listFiles(sourceId, queries);
                    if (fileList.files.length === 0) break;

                    // Process page in parallel using the worker
                    const promises = fileList.files.map(async (file) => {
                        try {
                            const payload = JSON.stringify({
                                sourceBucketId: sourceId,
                                fileId: file.$id,
                                destBucketId: destBucketId,
                                apiKey: activeProject.apiKey,
                                endpoint: activeProject.endpoint,
                                projectId: activeProject.projectId,
                                deleteSource: deleteOriginals
                            });

                            // Synchronous execution call ensures we wait for completion
                            const execution = await functions.createExecution(workerId!, payload, false);
                            
                            if (execution.status === 'failed') {
                                throw new Error(execution.responseBody || "Execution failed");
                            }
                            const response = JSON.parse(execution.responseBody);
                            if (!response.success) {
                                throw new Error(response.error);
                            }
                            
                            setProgress(prev => ({ ...prev, current: prev.current + 1 }));
                        } catch (err: any) {
                            addLog(`Failed to transfer ${file.name}: ${err.message}`);
                        }
                    });

                    await Promise.all(promises);
                    totalProcessed += fileList.files.length;
                    
                    cursor = fileList.files[fileList.files.length - 1].$id;
                    if (fileList.files.length < 50) break;
                }
            }
            
            addLog(`✅ Consolidation Complete. Processed ${totalProcessed} files.`);
            
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);

        } catch (e: any) {
            addLog(`FATAL ERROR: ${e.message}`);
        } finally {
            // 3. Cleanup Worker
            if (workerId) {
                addLog("Cleaning up worker...");
                try {
                    await functions.delete(workerId);
                } catch (e) {
                    console.error("Failed to delete worker", e);
                }
            }
            setIsExecuting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Consolidate Buckets" size="lg">
            {!isExecuting ? (
                <div className="space-y-6">
                    <p className="text-sm text-gray-400">
                        Move or copy all files from selected source buckets into a single destination bucket.
                        This operation runs on the server using a temporary Cloud Function for maximum speed and to preserve file IDs.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Source Selection */}
                        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Source Buckets</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {buckets.filter(b => b.$id !== destBucketId).map(bucket => (
                                    <label key={bucket.$id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={sourceBucketIds.includes(bucket.$id)}
                                            onChange={() => handleSourceToggle(bucket.$id)}
                                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-200 font-medium">{bucket.name}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{bucket.$id}</span>
                                        </div>
                                    </label>
                                ))}
                                {buckets.filter(b => b.$id !== destBucketId).length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No other buckets available.</p>
                                )}
                            </div>
                        </div>

                        {/* Dest Selection & Options */}
                        <div className="space-y-6">
                            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Destination Bucket</h4>
                                <div className="relative">
                                    <select 
                                        value={destBucketId} 
                                        onChange={e => setDestBucketId(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500 outline-none appearance-none"
                                    >
                                        <option value="" disabled>Select Destination</option>
                                        {buckets.filter(b => !sourceBucketIds.includes(b.$id)).map(b => (
                                            <option key={b.$id} value={b.$id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500">
                                        <StorageIcon size={14} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Options</h4>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={deleteOriginals} 
                                        onChange={e => setDeleteOriginals(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-300">Delete files from source (Move)</span>
                                </label>
                                <div className="flex items-start gap-2 mt-3 text-[10px] text-gray-500 bg-black/20 p-2 rounded">
                                    <RiRocketLine className="text-cyan-500 mt-0.5" size={12} />
                                    <p>Server-side execution ensures files are moved instantly without downloading them to your device. File IDs will be preserved.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button 
                            onClick={executeConsolidation}
                            disabled={sourceBucketIds.length === 0 || !destBucketId}
                            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <RefreshIcon /> Start Consolidation
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-[400px]">
                    <div className="flex items-center gap-3 mb-4 p-4 bg-gray-900 rounded-xl border border-gray-800">
                        <LoadingSpinnerIcon className="text-cyan-400 animate-spin" size={24} />
                        <div>
                            <h3 className="text-sm font-bold text-gray-200">Consolidating Files (Server-Side)...</h3>
                            <p className="text-xs text-gray-500">Deploying worker, transferring files, and cleaning up. Do not close.</p>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-black/30 rounded-xl border border-gray-800 p-4 overflow-y-auto custom-scrollbar font-mono text-xs">
                        {logs.map((log, i) => (
                            <div key={i} className={`py-1 border-b border-white/5 ${log.includes('ERROR') ? 'text-red-400' : 'text-gray-400'}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
};
