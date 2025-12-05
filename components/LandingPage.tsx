
import React from 'react';
import { 
    RiRobot2Line, RiFlashlightLine, RiDatabase2Line, RiRocketLine, 
    RiShieldCheckLine, RiCodeSSlashLine, RiArrowRightLine, RiLayoutMasonryLine, 
    RiShareForwardLine, RiTerminalBoxLine, RiCpuLine, RiGlobalLine
} from 'react-icons/ri';
import { CheckIcon } from './Icons';

interface LandingPageProps {
    onGetStarted: () => void;
}

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) => (
    <div className="group relative p-6 bg-gray-900/40 border border-gray-800 rounded-2xl hover:bg-gray-900/60 transition-all duration-300 hover:-translate-y-1 hover:border-gray-700 h-full">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}></div>
        <div className="relative z-10">
            <div className="w-12 h-12 mb-4 rounded-xl bg-gray-800/80 flex items-center justify-center text-2xl shadow-inner border border-gray-700/50">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-100 mb-2 font-sans">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

const SectionHeader = ({ badge, title, description }: { badge: string, title: string, description: string }) => (
    <div className="text-center mb-16 max-w-3xl mx-auto">
        <span className="inline-block py-1 px-3 rounded-full bg-gray-800/50 border border-gray-700 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">{badge}</span>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">{title}</h2>
        <p className="text-lg text-gray-400 leading-relaxed">{description}</p>
    </div>
);

const FeaturePoint = ({ text }: { text: string }) => (
    <div className="flex items-start gap-3 mb-4">
        <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
            <CheckIcon size={10} />
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans overflow-x-hidden scroll-smooth">
            
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-cyan-600 to-purple-600 rounded-lg text-white shadow-lg shadow-cyan-900/20">
                            <RiRobot2Line size={18} />
                        </div>
                        <span className="font-bold text-lg tracking-tight">DV <span className="text-gray-500 font-normal">Backend Studio</span></span>
                    </div>
                    <button 
                        onClick={onGetStarted}
                        className="px-5 py-2 text-xs font-bold bg-white text-gray-950 rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    >
                        Launch Studio
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/80 border border-cyan-500/30 text-cyan-400 text-[10px] uppercase font-bold tracking-wider mb-8 animate-fade-in shadow-lg shadow-cyan-900/10">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                        Powered by Google Gemini 2.5
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-100 to-gray-500 mb-8 tracking-tight leading-[1.1] animate-slide-up">
                        Your Infrastructure <br />
                        <span className="text-white">Is Listening.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up font-light" style={{ animationDelay: '0.1s' }}>
                        The first AI-Native IDE for Appwrite. Chat with your database, generate cloud functions, and deploy backends without leaving your browser.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <button 
                            onClick={onGetStarted}
                            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full text-white font-bold text-sm hover:shadow-[0_0_30px_rgba(8,145,178,0.4)] transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            Start Building Free
                            <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a 
                            href="#features"
                            className="px-8 py-4 bg-gray-900/50 border border-gray-800 rounded-full text-gray-300 font-medium text-sm hover:bg-gray-800 hover:text-white transition-colors w-full sm:w-auto justify-center backdrop-blur-sm"
                        >
                            See How It Works
                        </a>
                    </div>
                </div>
            </section>

            {/* Feature Cluster 1: The AI Architect */}
            <section id="features" className="py-24 px-6 bg-gray-950/50 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="relative rounded-2xl bg-gray-900 border border-gray-800 p-2 shadow-2xl">
                                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-20"></div>
                                <div className="relative bg-gray-950 rounded-xl overflow-hidden">
                                    {/* Mock Chat Interface */}
                                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900/50">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-2 font-mono">agent.tsx — Active Session</span>
                                    </div>
                                    <div className="p-6 space-y-6 font-mono text-sm">
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded bg-gray-800 flex-shrink-0 flex items-center justify-center text-gray-400"><RiArrowRightLine/></div>
                                            <div className="text-cyan-100">
                                                Create a collection for 'Blog Posts' with a title, content, and a relationship to the 'Users' collection for the author.
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded bg-cyan-900/30 flex-shrink-0 flex items-center justify-center text-cyan-400"><RiRobot2Line/></div>
                                            <div className="text-gray-300">
                                                <div className="text-xs text-gray-500 mb-2">Thinking... Analyzed 'Users' collection ID: 65a...2b</div>
                                                <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg mb-2 text-green-400">
                                                    ✔ Executed: createCollection('Blog Posts')<br/>
                                                    ✔ Executed: createStringAttribute('title')<br/>
                                                    ✔ Executed: createStringAttribute('content')<br/>
                                                    ✔ Executed: createRelationshipAttribute('Users', 'oneToMany')
                                                </div>
                                                Done. The collection is ready. Would you like me to seed it with sample data?
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <span className="text-cyan-400 font-bold tracking-wider uppercase text-xs mb-2 block">Feature Cluster 01</span>
                            <h2 className="text-4xl font-bold text-white mb-6">The AI Architect</h2>
                            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                                Stop clicking through endless dashboard menus. Our AI agent understands your Appwrite project structure intimately. It doesn't guess—it acts.
                            </p>
                            <div className="space-y-2">
                                <FeaturePoint text="Context-Aware: Knows your database IDs, function names, and bucket configurations." />
                                <FeaturePoint text="Intelligent Tooling: Executes real API calls to create databases, update permissions, and manage users." />
                                <FeaturePoint text="Deep Thinking: Powered by Gemini 2.5 with 'Thinking' mode for complex architectural decisions." />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Cluster 2: Serverless Engineering Suite */}
            <section className="py-24 px-6 bg-gray-900/20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-purple-400 font-bold tracking-wider uppercase text-xs mb-2 block">Feature Cluster 02</span>
                            <h2 className="text-4xl font-bold text-white mb-6">Serverless Engineering Suite</h2>
                            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                                A complete Integrated Development Environment in your browser. Generate, edit, and deploy Appwrite Cloud Functions without touching a CLI.
                            </p>
                            <div className="space-y-2">
                                <FeaturePoint text="In-Browser IDE: View and edit multiple files (index.js, package.json) in a VS Code-like interface." />
                                <FeaturePoint text="One-Shot Deployment: The AI packages your code into a .tar.gz archive and deploys it instantly." />
                                <FeaturePoint text="Live Logs: Watch build logs and execution outputs in real-time streams." />
                            </div>
                        </div>
                        <div>
                            <div className="relative rounded-2xl bg-[#0d1117] border border-gray-800 p-2 shadow-2xl">
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20"></div>
                                <div className="relative bg-[#0d1117] rounded-xl overflow-hidden font-mono text-sm">
                                    <div className="flex border-b border-gray-800">
                                        <div className="px-4 py-2 bg-gray-800 text-gray-200 border-r border-gray-800 text-xs">index.js</div>
                                        <div className="px-4 py-2 text-gray-500 text-xs">package.json</div>
                                    </div>
                                    <div className="p-6 text-gray-300 overflow-x-auto">
                                        <span className="text-purple-400">export default</span> <span className="text-cyan-400">async</span> (&#123; req, res, log &#125;) =&gt; &#123;<br/>
                                        &nbsp;&nbsp;<span className="text-gray-500">// AI Generated Image Resizer</span><br/>
                                        &nbsp;&nbsp;<span className="text-purple-400">const</span> client = <span className="text-blue-400">new</span> Client();<br/>
                                        &nbsp;&nbsp;<span className="text-purple-400">const</span> storage = <span className="text-blue-400">new</span> Storage(client);<br/>
                                        <br/>
                                        &nbsp;&nbsp;<span className="text-purple-400">if</span> (req.method === <span className="text-green-400">'POST'</span>) &#123;<br/>
                                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-yellow-400">log</span>(<span className="text-green-400">'Processing image...'</span>);<br/>
                                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gray-500">/* ... complex logic ... */</span><br/>
                                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> res.json(&#123; status: <span className="text-green-400">'ok'</span> &#125;);<br/>
                                        &nbsp;&nbsp;&#125;<br/>
                                        &#125;;
                                    </div>
                                    <div className="bg-gray-900 border-t border-gray-800 p-3 flex justify-between items-center">
                                        <div className="text-xs text-green-400 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Build Succeeded</div>
                                        <div className="text-xs text-gray-500">Deployed 2m ago</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Cluster 3: Studio & Migration */}
            <section className="py-24 px-6 bg-gray-950/50 border-t border-white/5">
                <SectionHeader 
                    badge="Total Control" 
                    title="Visual Studio Dashboard" 
                    description="Sometimes you need to click buttons. We built a beautiful, dark-mode GUI for complete manual control over your project resources." 
                />
                
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 bg-gray-900/40 border border-gray-800 rounded-3xl hover:border-gray-700 transition-colors">
                        <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-400 mb-6"><RiLayoutMasonryLine size={24}/></div>
                        <h3 className="text-xl font-bold text-white mb-3">Complete CRUD</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            A table-based interface to manage Users, Teams, Databases, Documents, and Storage Buckets manually. Edit JSON documents with validation.
                        </p>
                    </div>
                    <div className="p-8 bg-gray-900/40 border border-gray-800 rounded-3xl hover:border-gray-700 transition-colors">
                        <div className="w-12 h-12 bg-yellow-900/20 rounded-xl flex items-center justify-center text-yellow-400 mb-6"><RiShareForwardLine size={24}/></div>
                        <h3 className="text-xl font-bold text-white mb-3">Migration Engine</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Scan a source project and replicate its schema, data, functions, and users to a destination project. Perfect for Staging to Production workflows.
                        </p>
                    </div>
                    <div className="p-8 bg-gray-900/40 border border-gray-800 rounded-3xl hover:border-gray-700 transition-colors">
                        <div className="w-12 h-12 bg-red-900/20 rounded-xl flex items-center justify-center text-red-400 mb-6"><RiTerminalBoxLine size={24}/></div>
                        <h3 className="text-xl font-bold text-white mb-3">Advanced Querying</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Filter, search, and paginate through thousands of documents or execution logs instantly using Appwrite's native query syntax.
                        </p>
                    </div>
                </div>
            </section>

            {/* Feature Cluster 4: Privacy & Security */}
            <section className="py-24 px-6 bg-gradient-to-b from-gray-900 to-gray-950">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 mx-auto bg-green-900/20 rounded-2xl flex items-center justify-center text-green-400 mb-8 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <RiShieldCheckLine size={32}/>
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-6">Your Keys. Your Browser. Your Data.</h2>
                    <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                        We built DV Backend Studio with a <strong>client-side first</strong> architecture. There is no middleman server processing your commands.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                        <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl flex items-start gap-4">
                            <RiCpuLine className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <h4 className="font-bold text-gray-200 mb-1">Local Execution</h4>
                                <p className="text-sm text-gray-500">The application code runs entirely within your web browser session.</p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl flex items-start gap-4">
                            <RiGlobalLine className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <h4 className="font-bold text-gray-200 mb-1">Direct Connection</h4>
                                <p className="text-sm text-gray-500">API requests go directly from your IP to your Appwrite endpoint and Google Gemini.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Detailed Feature Grid (Bento Style) - Keeping the original idea but refined */}
            <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">Everything you need</h2>
                    <p className="text-gray-400">A comprehensive toolkit for the modern backend developer.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard 
                        icon={<RiRobot2Line />}
                        title="Gemini 2.5 Agent"
                        description="Uses the latest 'Flash' and 'Pro' models with tool calling capabilities."
                        color="from-cyan-500/20 to-blue-500/20"
                    />
                    <FeatureCard 
                        icon={<RiCodeSSlashLine />}
                        title="Code Generation"
                        description="Generates complete, production-ready Cloud Functions."
                        color="from-purple-500/20 to-pink-500/20"
                    />
                    <FeatureCard 
                        icon={<RiDatabase2Line />}
                        title="Schema Management"
                        description="Create databases and collections using natural language."
                        color="from-red-500/20 to-orange-500/20"
                    />
                    <FeatureCard 
                        icon={<RiRocketLine />}
                        title="Auto-Deployment"
                        description="Packages and uploads code instantly. No CLI required."
                        color="from-green-500/20 to-emerald-500/20"
                    />
                    <FeatureCard 
                        icon={<RiShareForwardLine />}
                        title="Project Migration"
                        description="Visual wizard to copy resources between projects."
                        color="from-yellow-500/20 to-amber-500/20"
                    />
                    <FeatureCard 
                        icon={<RiShieldCheckLine />}
                        title="Secure by Design"
                        description="Client-side only. Your keys never leave your device."
                        color="from-gray-500/20 to-slate-500/20"
                    />
                    <FeatureCard 
                        icon={<RiLayoutMasonryLine />}
                        title="Multi-Project"
                        description="Manage Dev, Staging, and Prod in one browser tab."
                        color="from-indigo-500/20 to-blue-500/20"
                    />
                    <FeatureCard 
                        icon={<RiFlashlightLine />}
                        title="Real-time Logs"
                        description="Stream function logs and agent reasoning steps."
                        color="from-teal-500/20 to-cyan-500/20"
                    />
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 border-t border-white/5 bg-gray-950">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Ready to upgrade your workflow?</h2>
                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                        Join the future of backend development. Connect your own API keys and start building in seconds.
                    </p>
                    <button 
                        onClick={onGetStarted}
                        className="px-12 py-5 bg-white text-gray-950 rounded-full font-bold text-lg hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                    >
                        Enter Studio
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-sm text-gray-600 border-t border-white/5 bg-gray-950">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p>&copy; {new Date().getFullYear()} DV Backend Studio. All rights reserved.</p>
                    <div className="flex gap-8 items-center">
                        <span className="hover:text-gray-400 transition-colors cursor-pointer">Built with Appwrite</span>
                        <span className="hover:text-gray-400 transition-colors cursor-pointer">Powered by Gemini</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
