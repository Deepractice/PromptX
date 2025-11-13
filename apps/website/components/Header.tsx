'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            <span className="text-primary-600">Prompt</span>
            <span className="text-creative-600">X</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/docs"
            className="text-gray-700 transition-colors hover:text-primary-600"
          >
            Documentation
          </Link>
          <Link
            href="/docs/quick-start"
            className="text-gray-700 transition-colors hover:text-primary-600"
          >
            Quick Start
          </Link>
          <a
            href="https://github.com/Deepractice/PromptX"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 transition-colors hover:text-primary-600"
          >
            GitHub
          </a>
          <a
            href="https://discord.gg/promptx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 transition-colors hover:text-primary-600"
          >
            Community
          </a>
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link
            href="/docs/quick-start"
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700"
          >
            Get Started →
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6 text-gray-700"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="container mx-auto space-y-1 px-4 py-4">
            <Link
              href="/docs"
              className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Documentation
            </Link>
            <Link
              href="/docs/quick-start"
              className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Quick Start
            </Link>
            <a
              href="https://github.com/Deepractice/PromptX"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/promptx"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Community
            </a>
            <Link
              href="/docs/quick-start"
              className="block rounded-lg bg-primary-600 px-4 py-2 text-center font-semibold text-white hover:bg-primary-700"
            >
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
