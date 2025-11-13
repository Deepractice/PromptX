import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AppleIcon, WindowsIcon, LinuxIcon } from '../components/OSIcons';
import { useEffect, useState } from 'react';

type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

export default function Download() {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('unknown');
  const latestVersion = '1.27.1';

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      setDetectedPlatform('mac');
    } else if (userAgent.includes('win')) {
      setDetectedPlatform('windows');
    } else if (userAgent.includes('linux')) {
      setDetectedPlatform('linux');
    }
  }, []);

  const downloads = {
    mac: {
      primary: {
        arm64: {
          name: 'macOS (Apple Silicon)',
          url: `https://promptx.deepractice.ai/download/latest/promptx-desktop-mac-arm64.dmg`,
        },
        x64: {
          name: 'macOS (Intel)',
          url: `https://promptx.deepractice.ai/download/latest/promptx-desktop-mac-x64.dmg`,
        },
      },
    },
    windows: {
      primary: {
        name: 'Windows 64-bit',
        url: `https://promptx.deepractice.ai/download/latest/promptx-desktop-win32-x64-setup.exe`,
      },
    },
    linux: {
      note: 'Multiple formats available',
    },
  };

  const getRecommendedDownload = () => {
    if (detectedPlatform === 'mac') {
      return {
        title: 'Download for macOS',
        subtitle: 'Choose your chip type',
        items: [downloads.mac.primary.arm64, downloads.mac.primary.x64],
      };
    } else if (detectedPlatform === 'windows') {
      return {
        title: 'Download for Windows',
        subtitle: '64-bit installer',
        items: [downloads.windows.primary],
      };
    }
    return null;
  };

  const recommended = getRecommendedDownload();

  return (
    <>
      <Head>
        <title>Download PromptX - AI Agent Context Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Download PromptX desktop application for macOS, Windows, and Linux. Install the AI Agent Context Platform and enhance your AI interactions."
        />
      </Head>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="border-b border-gray-200 bg-gradient-to-b from-background to-background-light py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-4 text-5xl font-bold text-primary-800">
              Download PromptX
            </h1>
            <p className="mb-2 text-lg text-gray-600">
              Latest version: <span className="font-semibold">{latestVersion}</span>
            </p>
            <p className="text-gray-500">
              Free and open source • Available for macOS, Windows, and Linux
            </p>
          </div>
        </div>

        {/* Recommended Download Section */}
        {recommended && (
          <div className="border-b border-gray-200 bg-white py-12">
            <div className="container mx-auto max-w-4xl px-4">
              <div className="rounded-2xl border-2 border-primary-500 bg-primary-50 p-8">
                <div className="mb-6 text-center">
                  <div className="mb-2 inline-block rounded-full bg-primary-100 px-4 py-1 text-sm font-semibold text-primary-700">
                    Recommended for your system
                  </div>
                  <h2 className="text-2xl font-bold text-primary-800">
                    {recommended.title}
                  </h2>
                  <p className="text-gray-600">{recommended.subtitle}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {recommended.items.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      className="flex min-w-[200px] items-center justify-center gap-3 rounded-lg bg-primary-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl"
                    >
                      <span>{item.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Platforms Section */}
        <div className="py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-primary-800">
              All Platforms
            </h2>

            <div className="grid gap-8 md:grid-cols-3">
              {/* macOS Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                <div className="mb-4 text-gray-700">
                  <AppleIcon className="h-16 w-16" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-primary-800">macOS</h3>
                <p className="mb-6 text-sm text-gray-600">
                  macOS 10.15 (Catalina) or later
                </p>
                <div className="space-y-3">
                  <a
                    href={downloads.mac.primary.arm64.url}
                    className="block rounded-lg bg-primary-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-primary-700"
                  >
                    Apple Silicon (.dmg)
                  </a>
                  <a
                    href={downloads.mac.primary.x64.url}
                    className="block rounded-lg border-2 border-primary-600 px-4 py-3 text-center font-semibold text-primary-600 transition-colors hover:bg-primary-50"
                  >
                    Intel (.dmg)
                  </a>
                </div>
              </div>

              {/* Windows Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                <div className="mb-4 text-gray-700">
                  <WindowsIcon className="h-16 w-16" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-primary-800">Windows</h3>
                <p className="mb-6 text-sm text-gray-600">
                  Windows 10 or later (64-bit)
                </p>
                <div className="space-y-3">
                  <a
                    href={downloads.windows.primary.url}
                    className="block rounded-lg bg-primary-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-primary-700"
                  >
                    Download Installer (.exe)
                  </a>
                  <a
                    href={`https://promptx.deepractice.ai/download/${latestVersion}/`}
                    className="block rounded-lg border-2 border-gray-300 px-4 py-3 text-center font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Other Versions
                  </a>
                </div>
              </div>

              {/* Linux Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                <div className="mb-4 text-gray-700">
                  <LinuxIcon className="h-16 w-16" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-primary-800">Linux</h3>
                <p className="mb-6 text-sm text-gray-600">
                  Multiple formats available
                </p>
                <div className="space-y-3">
                  <a
                    href={`https://promptx.deepractice.ai/download/${latestVersion}/`}
                    className="block rounded-lg bg-primary-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-primary-700"
                  >
                    View All Formats
                  </a>
                  <p className="text-center text-sm text-gray-500">
                    .deb, .rpm, AppImage
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="border-t border-gray-200 bg-background-light py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="mb-8 text-center text-3xl font-bold text-primary-800">
              Quick Start
            </h2>
            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-primary-800">Install PromptX</h3>
                </div>
                <p className="text-gray-600">
                  Download and install the desktop application for your operating system.
                  The app will automatically start the MCP server on port 5203.
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-primary-800">
                    Configure Your AI Application
                  </h3>
                </div>
                <p className="mb-3 text-gray-600">
                  Add the following configuration to your Claude Desktop or Cursor settings:
                </p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
{`{
  "mcpServers": {
    "promptx": {
      "type": "streamable-http",
      "url": "http://127.0.0.1:5203/mcp"
    }
  }
}`}
                </pre>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-primary-800">Start Using PromptX</h3>
                </div>
                <p className="text-gray-600">
                  Open your AI application and try saying "Show me available experts" or
                  "Activate Nuwa" to get started!
                </p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <a
                href="/docs/quick-start"
                className="inline-block rounded-lg border-2 border-primary-600 px-8 py-3 font-semibold text-primary-600 transition-colors hover:bg-primary-50"
              >
                View Full Documentation →
              </a>
            </div>
          </div>
        </div>

        {/* Release Notes */}
        <div className="border-t border-gray-200 bg-background-light py-16">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="mb-4 text-2xl font-bold text-primary-800">
              Release Notes & Previous Versions
            </h2>
            <p className="mb-6 text-gray-600">
              View changelog and download previous releases on GitHub
            </p>
            <a
              href="https://github.com/Deepractice/PromptX/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg border-2 border-gray-700 bg-gray-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
