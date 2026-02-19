import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Normalize markdown text where providers mistakenly wrap short inline code with single-line triple fences.
 */
function normalizeInlineCodeFences(text: string): string {
  if (!text || typeof text !== "string") return text;
  try {
    return text.replace(/```\s*([^\n\r]+?)\s*```/g, "`$1`");
  } catch {
    return text;
  }
}

/**
 * Code component for markdown with copy functionality
 */
const CodeComponent = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = React.useState(false);
  const raw = Array.isArray(children) ? children.join("") : String(children ?? "");
  const looksMultiline = /[\r\n]/.test(raw);
  const inlineDetected = inline || (node && node.type === "inlineCode");
  const shouldInline = inlineDetected || !looksMultiline;

  if (shouldInline) {
    return (
      <code
        className={`font-mono text-[0.9em] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-900 border border-gray-200 dark:bg-gray-800/60 dark:text-gray-100 dark:border-gray-700 whitespace-pre-wrap break-words ${className || ""}`}
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    const doSet = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard
          .writeText(raw)
          .then(doSet)
          .catch(() => fallbackCopy(raw, doSet));
      } else {
        fallbackCopy(raw, doSet);
      }
    } catch {
      // Fallback copy will be handled if clipboard API fails
    }
  };

  const fallbackCopy = (text: string, callback: () => void) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      // execCommand may fail in some browsers
    }
    document.body.removeChild(ta);
    callback();
  };

  return (
    <div className="relative group my-2">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md bg-gray-700/80 hover:bg-gray-700 text-white"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="bg-gray-900 border border-gray-700/40 rounded-lg p-3 overflow-x-auto">
        <code className={`text-gray-100 text-sm font-mono ${className || ""}`} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

/**
 * Common markdown components with custom styling
 */
const markdownComponents = {
  code: CodeComponent,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  p: ({ children }: any) => <div className="mb-2 last:mb-0">{children}</div>,
};

export interface MarkdownTextProps {
  /**
   * Markdown content to render
   */
  children: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MarkdownText - Renders markdown content with syntax highlighting and custom styling
 *
 * @example
 * ```tsx
 * <MarkdownText>
 *   # Hello World
 *   This is **bold** and this is `code`
 * </MarkdownText>
 * ```
 */
export function MarkdownText({ children, className }: MarkdownTextProps): React.ReactElement {
  const content = normalizeInlineCodeFences(String(children ?? ""));
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
