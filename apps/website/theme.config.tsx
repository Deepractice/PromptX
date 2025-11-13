import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">
        <span className="text-primary-600">Prompt</span>
        <span className="text-creative-600">X</span>
      </span>
    </div>
  ),
  project: {
    link: 'https://github.com/Deepractice/PromptX',
  },
  chat: {
    link: 'https://discord.gg/rdmPr54K',
  },
  docsRepositoryBase: 'https://github.com/Deepractice/PromptX/tree/main/apps/website',
  footer: {
    content: (
      <span>
        MIT {new Date().getFullYear()} ©{' '}
        <a href="https://deepractice.ai" target="_blank" rel="noopener noreferrer">
          Deepractice
        </a>
        .
      </span>
    ),
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – PromptX',
    };
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="PromptX - AI Agent Context Platform" />
      <meta
        property="og:description"
        content="Let AI have professional roles, tools & memory. Built on MCP protocol."
      />
      <link rel="icon" href="/favicon.ico" />
    </>
  ),
  primaryHue: {
    dark: 210, // primary blue
    light: 210, // primary blue
  },
  primarySaturation: {
    dark: 80,
    light: 80,
  },
  sidebar: {
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return <div className="text-xs font-semibold uppercase text-gray-500">{title}</div>;
      }
      return <>{title}</>;
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  editLink: {
    text: 'Edit this page on GitHub →',
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback',
  },
  navigation: {
    prev: true,
    next: true,
  },
  darkMode: false,
  nextThemes: {
    defaultTheme: 'light',
  },
  navbar: {
    extraContent: (
      <a
        href="/download"
        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700"
      >
        Download
      </a>
    ),
  },
};

export default config;
