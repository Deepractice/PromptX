'use client';

import React, { useState } from 'react';

const demoScenarios = [
  {
    id: 'role',
    label: 'Activate AI Role',
    description: 'See how AI roles transform the conversation',
    demo: {
      title: 'Activating Nuwa Role',
      steps: [
        'Step 1: Call promptx_action with role="nuwa"',
        'Step 2: Nuwa role loads personality, knowledge, and memory',
        'Step 3: AI responds as Nuwa with specialized capabilities',
      ],
    },
  },
  {
    id: 'memory',
    label: 'Query Memory',
    description: 'Explore semantic memory networks',
    demo: {
      title: 'DMN Memory Exploration',
      steps: [
        'Step 1: Call promptx_recall with query=null (DMN mode)',
        'Step 2: System activates core hub nodes',
        'Step 3: Spreading activation reveals connected concepts',
      ],
    },
  },
  {
    id: 'tool',
    label: 'Use Tool',
    description: 'Execute tools via ToolX runtime',
    demo: {
      title: 'PDF Reading with ToolX',
      steps: [
        'Step 1: Call promptx_toolx with tool://pdf-reader',
        'Step 2: ToolX loads and validates the tool',
        'Step 3: Tool executes in sandboxed environment',
      ],
    },
  },
];

export function PlaygroundDemo() {
  const [selected, setSelected] = useState(demoScenarios[0]);

  return (
    <div className="my-8">
      {/* Scenario Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {demoScenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => setSelected(scenario)}
            className={`flex-1 rounded-lg border p-4 text-left transition-all ${
              selected.id === scenario.id
                ? 'border-creative-500 bg-creative-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="mb-1 font-bold text-white">{scenario.label}</div>
            <div className="text-sm text-slate-400">{scenario.description}</div>
          </button>
        ))}
      </div>

      {/* Demo Display */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 className="mb-4 text-lg font-bold text-white">{selected.demo.title}</h3>
        <div className="space-y-3">
          {selected.demo.steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-creative-500 to-generate-500 text-xs font-bold text-white">
                {idx + 1}
              </div>
              <div className="text-slate-300">{step}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="mb-2 text-xs font-semibold text-slate-400">Want to try it yourself?</div>
          <p className="text-sm text-slate-300">
            Install PromptX Desktop or integrate with Claude/Cursor to experience these features in
            real conversations.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href="/docs/quick-start"
              className="rounded-lg bg-gradient-to-r from-creative-500 to-generate-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
            >
              Quick Start Guide →
            </a>
            <a
              href="/download"
              className="rounded-lg border border-rational-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rational-500/10"
            >
              Download App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
