#!/usr/bin/env node
/**
 * MCP Office Server
 *
 * Provides tools to read Office documents (docx, xlsx, pptx, pdf)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs";
import * as path from "node:path";
import mammoth from "mammoth";
import XLSX from "xlsx";

// Encoding description for tool schemas
const ENCODING_DESC = "Character encoding (optional). Common values: utf8 (default), gbk (Chinese Simplified), big5 (Chinese Traditional), utf16le, utf16be, latin1";
const CODEPAGE_DESC = "Character encoding codepage (optional). Common values: 65001 (UTF-8, default), 936 (GBK/Chinese Simplified), 950 (Big5/Chinese Traditional), 1200 (UTF-16LE), 1201 (UTF-16BE)";

// Map encoding names to Node.js buffer encodings
function getBufferEncoding(encoding?: string): BufferEncoding {
  if (!encoding) return "utf8";
  const map: Record<string, BufferEncoding> = {
    "utf8": "utf8",
    "utf-8": "utf8",
    "gbk": "latin1", // Node doesn't support GBK directly, will handle separately
    "gb2312": "latin1",
    "big5": "latin1",
    "utf16le": "utf16le",
    "utf-16le": "utf16le",
    "utf16be": "utf16le", // Will need to swap bytes
    "utf-16be": "utf16le",
    "latin1": "latin1",
    "ascii": "ascii",
  };
  return map[encoding.toLowerCase()] || "utf8";
}

const server = new Server(
  {
    name: "mcp-office",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_docx",
        description: "Read content from a Microsoft Word document (.docx file). Returns the text content of the document.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path to the .docx file",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "read_xlsx",
        description: "Read content from a Microsoft Excel spreadsheet (.xlsx or .xls file). Returns the data as formatted text or JSON.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path to the Excel file",
            },
            sheet: {
              type: "string",
              description: "Sheet name to read (optional, defaults to first sheet)",
            },
            format: {
              type: "string",
              enum: ["text", "json", "csv"],
              description: "Output format: json (default), text, or csv",
            },
            codepage: {
              type: "number",
              description: CODEPAGE_DESC,
            },
          },
          required: ["path"],
        },
      },
      {
        name: "read_pptx",
        description: "Read content from a Microsoft PowerPoint presentation (.pptx file). Returns the text content from all slides.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path to the .pptx file",
            },
            encoding: {
              type: "string",
              description: ENCODING_DESC,
            },
          },
          required: ["path"],
        },
      },
      {
        name: "list_xlsx_sheets",
        description: "List all sheet names in an Excel file",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path to the Excel file",
            },
            codepage: {
              type: "number",
              description: CODEPAGE_DESC,
            },
          },
          required: ["path"],
        },
      },
      {
        name: "read_pdf",
        description: "Read text content from a PDF file. Returns the extracted text from all pages.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path to the PDF file",
            },
          },
          required: ["path"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "read_docx": {
        const filePath = (args as { path: string }).path;
        if (!fs.existsSync(filePath)) {
          return { content: [{ type: "text", text: `Error: File not found: ${filePath}` }] };
        }
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer });
        return { content: [{ type: "text", text: result.value }] };
      }

      case "read_xlsx": {
        const { path: filePath, sheet, format = "json", codepage = 65001 } = args as { path: string; sheet?: string; format?: string; codepage?: number };
        if (!fs.existsSync(filePath)) {
          return { content: [{ type: "text", text: `Error: File not found: ${filePath}` }] };
        }
        // Read file as buffer to handle encoding properly
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer', codepage, raw: false });
        const sheetName = sheet || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          return { content: [{ type: "text", text: `Error: Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(", ")}` }] };
        }

        let output: string;
        if (format === "json") {
          const data = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
          output = JSON.stringify(data, null, 2);
        } else if (format === "csv") {
          output = XLSX.utils.sheet_to_csv(worksheet);
        } else {
          // text format: use csv as fallback
          output = XLSX.utils.sheet_to_csv(worksheet);
        }
        return { content: [{ type: "text", text: `Sheet: ${sheetName}\n\n${output}` }] };
      }

      case "read_pptx": {
        const { path: filePath, encoding = "utf8" } = args as { path: string; encoding?: string };
        if (!fs.existsSync(filePath)) {
          return { content: [{ type: "text", text: `Error: File not found: ${filePath}` }] };
        }
        // PPTX is a ZIP file containing XML
        const AdmZip = (await import("adm-zip")).default;
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();

        const slideTexts: string[] = [];
        const slideEntries = entries
          .filter(e => e.entryName.match(/ppt\/slides\/slide\d+\.xml/))
          .sort((a, b) => {
            const numA = parseInt(a.entryName.match(/slide(\d+)/)?.[1] || "0");
            const numB = parseInt(b.entryName.match(/slide(\d+)/)?.[1] || "0");
            return numA - numB;
          });

        const bufferEncoding = getBufferEncoding(encoding);
        for (const entry of slideEntries) {
          const content = entry.getData().toString(bufferEncoding);
          // Extract text from XML (simple regex approach)
          const texts = content.match(/<a:t>([^<]*)<\/a:t>/g) || [];
          const slideText = texts
            .map(t => t.replace(/<\/?a:t>/g, ""))
            .filter(t => t.trim())
            .join(" ");
          if (slideText) {
            const slideNum = entry.entryName.match(/slide(\d+)/)?.[1];
            slideTexts.push(`--- Slide ${slideNum} ---\n${slideText}`);
          }
        }

        return { content: [{ type: "text", text: slideTexts.join("\n\n") || "No text content found in presentation" }] };
      }

      case "list_xlsx_sheets": {
        const { path: filePath, codepage = 65001 } = args as { path: string; codepage?: number };
        if (!fs.existsSync(filePath)) {
          return { content: [{ type: "text", text: `Error: File not found: ${filePath}` }] };
        }
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer', codepage });
        return { content: [{ type: "text", text: `Sheets in ${path.basename(filePath)}:\n${workbook.SheetNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}` }] };
      }

      case "read_pdf": {
        const filePath = (args as { path: string }).path;
        if (!fs.existsSync(filePath)) {
          return { content: [{ type: "text", text: `Error: File not found: ${filePath}` }] };
        }
        const pdfParse = (await import("pdf-parse")).default;
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return { content: [{ type: "text", text: `PDF: ${path.basename(filePath)}\nPages: ${data.numpages}\n\n${data.text}` }] };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Office Server running on stdio");
}

main().catch(console.error);
