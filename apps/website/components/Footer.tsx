import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 inline-block">
              <span className="text-2xl font-bold">
                <span className="text-primary-600">Prompt</span>
                <span className="text-creative-600">X</span>
              </span>
            </Link>
            <p className="text-sm text-gray-600">
              Professional AI Roles, Tools & Memory built on MCP protocol.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-semibold text-primary-800">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-gray-600 hover:text-primary-600">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs/quick-start" className="text-gray-600 hover:text-primary-600">
                  Quick Start
                </Link>
              </li>
              <li>
                <Link href="/download" className="text-gray-600 hover:text-primary-600">
                  Download
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Deepractice/PromptX/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600"
                >
                  Releases
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 font-semibold text-primary-800">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/Deepractice/PromptX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Deepractice/PromptX/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600"
                >
                  Issues
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/promptx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600"
                >
                  Community
                </a>
              </li>
              <li>
                <a
                  href="https://deepractice.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold text-primary-800">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://deepractice.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600"
                >
                  About Deepractice
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/deepractice_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Deepractice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600"
                >
                  GitHub Org
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Deepractice. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a
                href="https://github.com/Deepractice/PromptX/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary-600"
              >
                MIT License
              </a>
              <Link href="/privacy" className="text-gray-600 hover:text-primary-600">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-primary-600">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
