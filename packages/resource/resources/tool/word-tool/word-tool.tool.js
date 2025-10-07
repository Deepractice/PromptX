/**
 * Word Tool - Word 文档读写工具
 * 
 * 战略意义：
 * 1. AI 文档理解：让 AI 能够读取和理解 Word 文档内容
 * 2. 内容生成能力：让 AI 能够创建结构化的 Word 文档
 * 3. 图片提取支持：完整提取文档中的图片资源
 * 4. 格式保留：读取时转换为 Markdown 保留文档结构
 * 
 * 设计理念：
 * - read：提取文本和图片，转换为 AI 友好的格式
 * - write：从结构化数据生成专业 Word 文档
 * - 智能缓存：避免重复解析同一文档
 * 
 * 生态定位：
 * 对标 pdf-reader，为 AI 提供 Word 文档处理能力
 * 与其他文档工具（pdf-reader、excel-tool）形成完整的办公文档生态
 */

module.exports = {
  getDependencies() {
    return {
      'mammoth': '^1.8.0',  // 读取 docx
      'docx': '^9.5.0',     // 写入 docx
      'pizzip': '^3.2.0'    // 修改 docx
    };
  },

  getMetadata() {
    return {
      id: 'word-tool',
      name: 'Word Tool',
      description: 'Word 文档读写修改工具，支持文本提取、图片提取、文档生成和文本替换',
      version: '1.0.0',
      author: '鲁班'
    };
  },

  getSchema() {
    return {
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['read', 'write', 'modify'],
            description: '操作类型：read（读取文档）、write（创建文档）或 modify（修改文档）'
          },
          
          // read 参数
          docPath: {
            type: 'string',
            description: 'Word 文档的绝对路径（read 时必需）',
            minLength: 1
          },
          extractImages: {
            type: 'boolean',
            description: '是否提取图片（read 时可选，默认 true）',
            default: true
          },
          format: {
            type: 'string',
            enum: ['markdown', 'html', 'text'],
            description: '输出格式（read 时可选，默认 markdown）',
            default: 'markdown'
          },
          forceRefresh: {
            type: 'boolean',
            description: '强制重新解析，忽略缓存（read 时可选，默认 false）',
            default: false
          },
          
          // write 参数
          outputPath: {
            type: 'string',
            description: '输出文档路径（write 时必需）',
            minLength: 1
          },
          content: {
            type: 'object',
            description: '文档内容（write 时必需）',
            properties: {
              title: {
                type: 'string',
                description: '文档标题'
              },
              sections: {
                type: 'array',
                description: '文档章节列表',
                items: {
                  type: 'object',
                  properties: {
                    heading: {
                      type: 'string',
                      description: '章节标题'
                    },
                    level: {
                      type: 'number',
                      description: '标题级别（1-6）',
                      minimum: 1,
                      maximum: 6
                    },
                    paragraphs: {
                      type: 'array',
                      description: '段落文本列表',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          },

          // modify 参数
          replacements: {
            type: 'array',
            description: '文本替换规则列表（modify 时必需）',
            items: {
              type: 'object',
              properties: {
                find: {
                  type: 'string',
                  description: '要查找的文本（支持正则表达式）',
                  minLength: 1
                },
                replace: {
                  type: 'string',
                  description: '替换后的文本'
                },
                useRegex: {
                  type: 'boolean',
                  description: '是否使用正则表达式（默认 false）',
                  default: false
                }
              },
              required: ['find', 'replace']
            },
            minItems: 1
          }
        },
        required: ['action']
      }
    };
  },

  getBridges() {
    return {
      'word:read': {
        real: async (args, api) => {
          api.logger.info('[Bridge] Reading Word document with mammoth');
          const mammoth = await api.importx('mammoth');
          
          if (args.format === 'markdown') {
            return await mammoth.convertToMarkdown({ path: args.docPath }, args.options || {});
          } else if (args.format === 'html') {
            return await mammoth.convertToHtml({ path: args.docPath }, args.options || {});
          } else {
            return await mammoth.extractRawText({ path: args.docPath });
          }
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] Mock reading Word document');
          return {
            value: '# Mock Document\n\nThis is mock content from a Word document.\n\n## Section 1\n\nParagraph text here.',
            messages: []
          };
        }
      },

      'word:write': {
        real: async (args, api) => {
          api.logger.info('[Bridge] Writing Word document with docx');
          const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await api.importx('docx');
          
          const children = [];
          
          // 添加标题
          if (args.content.title) {
            children.push(
              new Paragraph({
                text: args.content.title,
                heading: HeadingLevel.HEADING_1
              })
            );
            children.push(new Paragraph({ text: '' })); // 空行
          }
          
          // 添加章节
          if (args.content.sections) {
            for (const section of args.content.sections) {
              // 章节标题
              if (section.heading) {
                const headingLevel = `HEADING_${section.level || 2}`;
                children.push(
                  new Paragraph({
                    text: section.heading,
                    heading: HeadingLevel[headingLevel] || HeadingLevel.HEADING_2
                  })
                );
              }
              
              // 章节段落
              if (section.paragraphs) {
                for (const para of section.paragraphs) {
                  children.push(
                    new Paragraph({
                      children: [new TextRun(para)]
                    })
                  );
                }
              }
              
              children.push(new Paragraph({ text: '' })); // 章节后空行
            }
          }
          
          const doc = new Document({
            sections: [{
              properties: {},
              children: children
            }]
          });
          
          return await Packer.toBuffer(doc);
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] Mock writing Word document');
          return Buffer.from('mock-docx-binary-data');
        }
      },

      'word:modify': {
        real: async (args, api) => {
          api.logger.info('[Bridge] Modifying Word document with PizZip');
          const PizZip = await api.importx('pizzip');

          // 解压 docx
          const zip = new PizZip(args.docBuffer, { binary: true });

          // 读取 document.xml
          let docXml = zip.file('word/document.xml').asText();

          // 应用所有替换规则
          for (const rule of args.replacements) {
            if (rule.useRegex) {
              const regex = new RegExp(rule.find, 'g');
              docXml = docXml.replace(regex, rule.replace);
            } else {
              // 简单文本替换
              const regex = new RegExp(rule.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
              docXml = docXml.replace(regex, rule.replace);
            }
          }

          // 更新 zip
          zip.file('word/document.xml', docXml);

          // 生成新的 docx
          return zip.generate({
            type: 'nodebuffer',
            compression: 'DEFLATE'
          });
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] Mock modifying Word document');
          return Buffer.from('mock-modified-docx-data');
        }
      },

      'fs:readFile': {
        real: async (args, api) => {
          api.logger.info(`[Bridge] Reading file: ${args.path}`);
          const fs = await api.importx('fs');
          return await fs.promises.readFile(args.path);
        },
        mock: async (args, api) => {
          api.logger.debug(`[Mock] Mock reading file: ${args.path}`);
          return Buffer.from('mock-docx-binary-data');
        }
      },

      'fs:writeFile': {
        real: async (args, api) => {
          api.logger.info(`[Bridge] Writing file: ${args.path}`);
          const fs = await api.importx('fs');
          await fs.promises.writeFile(args.path, args.data);
        },
        mock: async (args, api) => {
          api.logger.debug(`[Mock] Mock writing file: ${args.path}`);
        }
      },

      'fs:mkdir': {
        real: async (args, api) => {
          api.logger.info(`[Bridge] Creating directory: ${args.path}`);
          const fs = await api.importx('fs');
          await fs.promises.mkdir(args.path, { recursive: true });
        },
        mock: async (args, api) => {
          api.logger.debug(`[Mock] Mock creating directory: ${args.path}`);
        }
      },

      'crypto:hash': {
        real: async (args, api) => {
          const crypto = await api.importx('crypto');
          const hash = crypto.createHash('md5');
          hash.update(args.data);
          return hash.digest('hex');
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] Generating mock hash');
          return 'mock-hash-' + Date.now();
        }
      },

      'path:join': {
        real: async (args, api) => {
          const path = await api.importx('path');
          return path.join(...args.parts);
        },
        mock: async (args, api) => {
          return args.parts.join('/');
        }
      }
    };
  },

  getBridgeErrors() {
    return {
      'word:read': [
        {
          code: 'INVALID_DOCX',
          match: /not a valid zip file|End of central directory/i,
          solution: '检查文件是否是有效的 .docx 文档',
          retryable: false
        }
      ],
      'fs:readFile': [
        {
          code: 'FILE_NOT_FOUND',
          match: /ENOENT/,
          solution: '检查文件路径是否正确',
          retryable: false
        }
      ]
    };
  },

  async execute(params) {
    const { api } = this;
    const { action } = params;

    try {
      if (action === 'read') {
        return await this.handleRead(params);
      } else if (action === 'write') {
        return await this.handleWrite(params);
      } else if (action === 'modify') {
        return await this.handleModify(params);
      } else {
        throw new Error(`未知的操作类型: ${action}`);
      }
    } catch (error) {
      api.logger.error('Word 文档处理失败', error);
      throw error;
    }
  },

  async handleRead(params) {
    const { api } = this;
    const { docPath, extractImages = true, format = 'markdown', forceRefresh = false } = params;

    api.logger.info('开始读取 Word 文档', { docPath, extractImages, format, forceRefresh });

    // 读取文档文件
    const docBuffer = await api.bridge.execute('fs:readFile', { path: docPath });
    api.logger.info('文档文件读取成功', { size: docBuffer.length });

    // 生成文档 hash
    const docHash = await api.bridge.execute('crypto:hash', { data: docBuffer });

    // 获取工具信息，构建文档数据目录
    const toolInfo = api.getInfo();
    const docDir = await api.bridge.execute('path:join', {
      parts: [toolInfo.sandboxPath, 'docs', docHash]
    });

    api.logger.info('文档数据目录', { docDir });

    // 检查缓存
    const allDocs = api.storage.getItem('docs') || {};
    let docMetadata = allDocs[docHash];

    if (!docMetadata || forceRefresh) {
      api.logger.info('首次处理此文档，解析内容');

      // 创建文档目录
      await api.bridge.execute('fs:mkdir', { path: docDir });

      // 配置图片提取
      let imageCount = 0;
      const images = [];
      const convertImageOptions = extractImages ? {
        convertImage: async (element) => {
          const imageBuffer = await element.read('base64');
          const imgType = element.contentType.split('/').pop();
          const imgName = `image-${imageCount}.${imgType}`;
          const imgPath = await api.bridge.execute('path:join', {
            parts: [docDir, imgName]
          });

          // 保存图片
          await api.bridge.execute('fs:writeFile', {
            path: imgPath,
            data: Buffer.from(imageBuffer, 'base64')
          });

          images.push({
            index: imageCount,
            path: imgPath,
            type: imgType
          });

          imageCount++;
          return { src: imgPath };
        }
      } : {};

      // 读取文档内容
      const result = await api.bridge.execute('word:read', {
        docPath,
        format,
        options: convertImageOptions
      });

      // 缓存元信息
      docMetadata = {
        docHash,
        docPath,
        format,
        imageCount,
        hasImages: imageCount > 0,
        createdAt: Date.now()
      };

      allDocs[docHash] = docMetadata;
      api.storage.setItem('docs', allDocs);

      api.logger.info('文档解析完成', {
        imageCount,
        contentLength: result.value.length
      });

      return {
        success: true,
        metadata: {
          docHash,
          format,
          imageCount,
          hasImages: imageCount > 0
        },
        content: {
          text: result.value,
          images,
          imagesDirectory: docDir
        },
        cache: {
          fromCache: false
        }
      };

    } else {
      api.logger.info('使用缓存的文档数据');

      // 从缓存读取（重新解析文本，图片路径从文件系统读取）
      const result = await api.bridge.execute('word:read', {
        docPath,
        format
      });

      return {
        success: true,
        metadata: {
          docHash: docMetadata.docHash,
          format: docMetadata.format,
          imageCount: docMetadata.imageCount,
          hasImages: docMetadata.hasImages
        },
        content: {
          text: result.value,
          imagesDirectory: docDir
        },
        cache: {
          fromCache: true
        }
      };
    }
  },

  async handleWrite(params) {
    const { api } = this;
    const { outputPath, content } = params;

    if (!outputPath) {
      throw new Error('write 操作需要提供 outputPath 参数');
    }

    if (!content) {
      throw new Error('write 操作需要提供 content 参数');
    }

    api.logger.info('开始创建 Word 文档', { outputPath });

    // 生成文档
    const buffer = await api.bridge.execute('word:write', { content });

    // 保存文件
    await api.bridge.execute('fs:writeFile', {
      path: outputPath,
      data: buffer
    });

    api.logger.info('Word 文档创建成功', { outputPath, size: buffer.length });

    return {
      success: true,
      outputPath,
      size: buffer.length,
      message: 'Word 文档创建成功'
    };
  },

  async handleModify(params) {
    const { api } = this;
    const { docPath, outputPath, replacements } = params;

    if (!docPath) {
      throw new Error('modify 操作需要提供 docPath 参数');
    }

    if (!replacements || replacements.length === 0) {
      throw new Error('modify 操作需要提供 replacements 参数');
    }

    const finalOutputPath = outputPath || docPath; // 不提供 outputPath 则覆盖原文件

    api.logger.info('开始修改 Word 文档', {
      docPath,
      outputPath: finalOutputPath,
      replacementCount: replacements.length
    });

    // 读取原文档
    const docBuffer = await api.bridge.execute('fs:readFile', { path: docPath });
    api.logger.info('文档文件读取成功', { size: docBuffer.length });

    // 修改文档
    const modifiedBuffer = await api.bridge.execute('word:modify', {
      docBuffer,
      replacements
    });

    api.logger.info('文档修改完成', { newSize: modifiedBuffer.length });

    // 保存修改后的文档
    await api.bridge.execute('fs:writeFile', {
      path: finalOutputPath,
      data: modifiedBuffer
    });

    api.logger.info('修改后的文档已保存', { path: finalOutputPath });

    return {
      success: true,
      inputPath: docPath,
      outputPath: finalOutputPath,
      replacementCount: replacements.length,
      size: modifiedBuffer.length,
      message: '文档修改成功'
    };
  }
};
