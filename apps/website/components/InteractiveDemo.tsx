'use client';

import React, { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const scenarios = [
  {
    id: 'activate-nuwa',
    title: 'Activate Nuwa (AI Role Creator)',
    steps: [
      {
        user: 'action nuwa',
        assistant:
          '✅ Nuwa role activated!\n\nHi! I\'m Nuwa (女娲), the AI role creator expert. I can help you design and create custom AI roles with personality, knowledge, and memory.\n\nWhat kind of role would you like to create?',
      },
    ],
  },
  {
    id: 'recall-memory',
    title: 'Query Cognitive Memory',
    steps: [
      {
        user: 'recall assistant null',
        assistant:
          '🧠 DMN Mode Activated - Memory Network Overview:\n\n📊 Core Hubs:\n- PromptX (38 connections)\n- MCP Protocol (25 connections)\n- Cognitive Memory (42 connections)\n- AI Roles (31 connections)\n\n🔗 Related Concepts:\nToolX, DPML, Nextra, Spreading Activation, Engrams...\n\nWhat would you like to explore?',
      },
    ],
  },
  {
    id: 'use-tool',
    title: 'Use ToolX Tool',
    steps: [
      {
        user: 'toolx tool://pdf-reader extract /path/to/doc.pdf',
        assistant:
          '📄 PDF Reader Activated\n\n✅ Extracted 15 pages from doc.pdf\n\nContent includes:\n- Introduction to MCP\n- Architecture Overview\n- Integration Guide\n\nWould you like me to summarize the content?',
      },
    ],
  },
];

export function InteractiveDemo() {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runScenario = async () => {
    setIsRunning(true);
    setMessages([]);
    setCurrentStep(0);

    for (let i = 0; i < selectedScenario.steps.length; i++) {
      const step = selectedScenario.steps[i];

      // Show user message
      setMessages((prev) => [...prev, { role: 'user', content: step.user }]);
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Show assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: step.assistant }]);
      setCurrentStep(i + 1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
  };

  return (
    <div className="my-8 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
      {/* Scenario Selector */}
      <div className="border-b border-slate-700 bg-slate-800 p-4">
        <div className="mb-2 text-sm font-semibold text-slate-400">Choose a scenario:</div>
        <div className="flex flex-wrap gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => {
                setSelectedScenario(scenario);
                setMessages([]);
                setCurrentStep(0);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedScenario.id === scenario.id
                  ? 'bg-gradient-to-r from-creative-500 to-generate-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {scenario.title}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Display */}
      <div className="min-h-[300px] p-6 font-mono text-sm">
        {messages.length === 0 && (
          <div className="text-slate-500">
            Click "Run Demo" to see {selectedScenario.title} in action...
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-4">
            <div
              className={`mb-1 text-xs font-semibold ${
                msg.role === 'user' ? 'text-rational-400' : 'text-creative-400'
              }`}
            >
              {msg.role === 'user' ? '$ User' : '> PromptX'}
            </div>
            <div className="whitespace-pre-wrap text-slate-200">{msg.content}</div>
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="h-2 w-2 animate-pulse rounded-full bg-creative-500"></div>
            <div className="h-2 w-2 animate-pulse rounded-full bg-creative-500 animation-delay-200"></div>
            <div className="h-2 w-2 animate-pulse rounded-full bg-creative-500 animation-delay-400"></div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="border-t border-slate-700 bg-slate-800 p-4">
        <button
          onClick={runScenario}
          disabled={isRunning}
          className={`rounded-lg px-6 py-2 font-semibold transition-all ${
            isRunning
              ? 'cursor-not-allowed bg-slate-700 text-slate-500'
              : 'bg-gradient-to-r from-creative-500 to-generate-500 text-white hover:scale-105'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Demo'}
        </button>
      </div>
    </div>
  );
}
