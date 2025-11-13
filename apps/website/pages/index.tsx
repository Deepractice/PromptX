import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>PromptX - AI Agent Context Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center md:py-32">
        <h1 className="mb-6 text-5xl font-bold leading-tight md:text-7xl">
          <span className="text-primary-800">Let AI Have</span>
          <br />
          <span className="bg-gradient-to-r from-primary-600 to-creative-600 bg-clip-text text-transparent">
            Professional Roles, Tools & Memory
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
          PromptX is an AI Agent Context Platform built on MCP protocol. Inject professional
          capabilities, cognitive memory systems, and intelligent tools into Claude, Cursor, and
          other AI applications.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/docs/quick-start"
            className="rounded-lg bg-primary-500 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-primary-600 hover:shadow-xl"
          >
            Get Started →
          </a>
          <a
            href="/docs"
            className="rounded-lg border-2 border-primary-500 bg-white px-8 py-3 font-semibold text-primary-500 transition-all hover:bg-primary-50"
          >
            Documentation
          </a>
        </div>
      </div>

      {/* Video Demo Section - slightly darker background */}
      <div className="border-y border-gray-200 bg-background-light py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold text-primary-800">
            See PromptX in Action
          </h2>
          <div className="overflow-hidden rounded-2xl shadow-2xl">
            <div className="relative" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/R6ENaj9i0oE?vq=hd720"
                title="PromptX Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <p className="mt-6 text-center text-gray-600">
            Watch how PromptX transforms AI interactions with memory, roles, and intelligent tools
          </p>
        </div>
      </div>

      {/* AI Roles Section */}
      <div className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-block rounded-full bg-creative-100 px-4 py-1 text-sm font-semibold text-creative-700">
                🎭 AI Roles
              </div>
              <h2 className="mb-6 text-4xl font-bold text-primary-800">
                Professional AI Roles with Personality
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                Not just system prompts. PromptX roles have personality, domain knowledge, personal
                memory, and behavioral principles. They remember conversations and grow with
                experience.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-creative-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">Built-in Expert Roles</strong> - Nuwa
                    (role creator), Luban (tool developer), Sean (product strategist)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-creative-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">Create Custom Roles</strong> - Use Nuwa to
                    design roles for your specific needs
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-creative-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">DPML-Powered</strong> - Structured
                    definition language for consistent behavior
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-creative-400 bg-white p-8 shadow-xl">
              <div className="mb-6 text-6xl">🎭</div>
              <h3 className="mb-4 text-2xl font-bold text-creative-700">Example: Nuwa Role</h3>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-background p-3">
                  <div className="font-semibold text-primary-800">Personality</div>
                  <div className="text-gray-600">Creative, patient, detail-oriented</div>
                </div>
                <div className="rounded-lg bg-background p-3">
                  <div className="font-semibold text-primary-800">Expertise</div>
                  <div className="text-gray-600">AI role design, DPML, cognitive architecture</div>
                </div>
                <div className="rounded-lg bg-background p-3">
                  <div className="font-semibold text-primary-800">Memory</div>
                  <div className="text-gray-600">42 engrams across 8 knowledge domains</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="border-y border-gray-200 bg-background-light py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl border-2 border-primary-400 bg-white p-8 shadow-xl">
                <div className="mb-6 text-6xl">🔧</div>
                <h3 className="mb-4 text-2xl font-bold text-primary-800">Built-in Tools</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-background p-3">
                    <span className="text-lg">📄</span>
                    <span className="font-medium text-gray-700">PDF Reader</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-background p-3">
                    <span className="text-lg">📊</span>
                    <span className="font-medium text-gray-700">Excel Operations</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-background p-3">
                    <span className="text-lg">📝</span>
                    <span className="font-medium text-gray-700">Word Documents</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-background p-3">
                    <span className="text-lg">📁</span>
                    <span className="font-medium text-gray-700">File Management</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="mb-4 inline-block rounded-full bg-primary-100 px-4 py-1 text-sm font-semibold text-primary-700">
                🔧 Tool Ecosystem
              </div>
              <h2 className="mb-6 text-4xl font-bold text-primary-800">
                Extensible Tool Runtime (ToolX)
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                ToolX provides a secure, sandboxed runtime for AI tools. Execute complex operations,
                integrate external services, or create custom tools with Luban.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">Sandboxed Execution</strong> - Secure
                    worker pool with parameter validation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">YAML Configuration</strong> - Simple
                    declarative tool definitions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">Create with Luban</strong> - AI-assisted
                    tool development
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Section */}
      <div className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-block rounded-full bg-primary-100 px-4 py-1 text-sm font-semibold text-primary-700">
                💭 Cognitive Memory
              </div>
              <h2 className="mb-6 text-4xl font-bold text-primary-800">
                Not RAG, But Real AI Memory
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                PromptX implements a cognitive memory system inspired by human memory. Semantic
                networks with spreading activation, DMN mode, and engram-based storage.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">Semantic Networks</strong> - Concepts
                    connected by meaningful relationships
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">Spreading Activation</strong> - Memory
                    recall through network activation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">DMN Mode</strong> - Default Mode Network
                    for exploratory thinking
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary-400 bg-white p-8 shadow-xl">
              <div className="mb-6 text-6xl">💭</div>
              <h3 className="mb-4 text-2xl font-bold text-primary-800">How It Works</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="mb-2 font-semibold text-creative-700">1. Store Engrams</div>
                  <div className="text-gray-600">
                    Complete memory traces, not fragments. Each engram preserves context and
                    semantic structure.
                  </div>
                </div>
                <div>
                  <div className="mb-2 font-semibold text-creative-700">2. Build Networks</div>
                  <div className="text-gray-600">
                    Concepts automatically connect through semantic relationships, forming a rich
                    knowledge graph.
                  </div>
                </div>
                <div>
                  <div className="mb-2 font-semibold text-creative-700">3. Activate & Recall</div>
                  <div className="text-gray-600">
                    Query triggers spreading activation, bringing relevant memories to the surface.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MCP Protocol Section */}
      <div className="border-y border-gray-200 bg-background-light py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl border-2 border-primary-400 bg-white p-8 shadow-xl">
                <div className="mb-6 text-6xl">🔌</div>
                <h3 className="mb-4 text-2xl font-bold text-primary-800">Supported Platforms</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-background p-3">
                    <span className="text-lg">💬</span>
                    <span className="font-medium text-gray-700">Claude Desktop</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-background p-3">
                    <span className="text-lg">⚡</span>
                    <span className="font-medium text-gray-700">Cursor</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-background p-3">
                    <span className="text-lg">🔮</span>
                    <span className="font-medium text-gray-700">Any MCP-enabled AI</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="mb-4 inline-block rounded-full bg-primary-100 px-4 py-1 text-sm font-semibold text-primary-700">
                🔌 MCP Protocol
              </div>
              <h2 className="mb-6 text-4xl font-bold text-primary-800">
                Built on Open Standards
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                PromptX is built on the Model Context Protocol (MCP), an open standard for AI
                context integration. Configure once, use everywhere.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">Universal Compatibility</strong> - Works
                    with any MCP-enabled application
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">Standardized Protocol</strong> - Open
                    specification, not vendor lock-in
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary-500">✓</span>
                  <span className="text-gray-700">
                    <strong className="text-primary-800">Future-Proof</strong> - Ready for new
                    AI applications as they adopt MCP
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - with accent background */}
      <div className="border-t border-gray-200 bg-background-lightest py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-8 text-3xl font-bold text-primary-800">Get Started in 5 Minutes</h2>
          <div className="my-8 flex justify-center gap-4">
            <a
              href="/download"
              className="rounded-lg bg-creative-500 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-creative-600 hover:shadow-xl"
            >
              Download Desktop App
            </a>
            <a
              href="/docs/quick-start"
              className="rounded-lg border-2 border-primary-500 bg-white px-8 py-3 font-semibold text-primary-500 transition-all hover:bg-primary-50"
            >
              Integration Guide →
            </a>
          </div>
          <p className="text-gray-600">
            Compatible with Claude Desktop, Cursor, and any MCP-enabled application
          </p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
