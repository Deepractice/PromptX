import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold bg-gradient-warm-purple bg-clip-text text-transparent">
        PromptX
      </span>
    </div>
  ),
  project: {
    link: 'https://github.com/Deepractice/PromptX',
  },
  chat: {
    link: 'https://discord.gg/promptx',
  },
  docsRepositoryBase: 'https://github.com/Deepractice/PromptX/tree/main/apps/website',
  footer: {
    text: (
      <div className="flex w-full flex-col items-center sm:items-start">
        <p className="text-sm">
          © {new Date().getFullYear()} Deepractice. Built with{' '}
          <span className="text-creative-500">passion</span> and{' '}
          <span className="text-rational-500">precision</span>.
        </p>
      </div>
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
        content="Let AI have professional memory and roles. Built on MCP protocol."
      />
      <link rel="icon" href="/favicon.ico" />
    </>
  ),
  primaryHue: {
    dark: 25, // orange hue
    light: 195, // sky blue hue
  },
  primarySaturation: {
    dark: 95,
    light: 95,
  },
  sidebar: {
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return <div className="text-xs font-semibold text-rational-400">{title}</div>;
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
  darkMode: true,
  nextThemes: {
    defaultTheme: 'dark',
  },
};

export default config;
