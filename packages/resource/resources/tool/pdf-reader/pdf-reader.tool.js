/**
 * PDF Reader - 纯 Node.js 实现的 PDF 分页阅读工具（带智能缓存）
 * 
 * 战略意义：
 * 1. 按需阅读：像人类读书一样，指定页码按需读取
 * 2. 智能缓存：已解析的页面不重复处理，节省算力
 * 3. 性能优化：避免大 PDF 一次性加载导致宕机
 * 4. Token 优化：只返回需要的页面内容，不浪费上下文
 * 
 * 设计理念：
 * - 不传 pages：只返回 PDF 元信息（总页数、标题等）
 * - 传 pages：提取指定页的文本和图片
 * - 图片存储在 toolbox 目录，统一管理
 * - 使用 storage 缓存解析状态，避免重复解析
 * 
 * 生态定位：
 * 为 AI 提供高效的 PDF 分页阅读能力
 * 与 Claude Code 的 Read 工具无缝配合
 */

module.exports = {
  getDependencies() {
    return {
      'pdf-parse': '^2.1.10'
    };
  },

  getMetadata() {
    return {
      id: 'pdf-reader',
      name: 'PDF Reader',
      description: 'PDF 分页阅读工具，支持按页码提取文本和图片，智能缓存避免重复解析',
      version: '2.1.0',
      author: '鲁班'
    };
  },

  getSchema() {
    return {
      parameters: {
        type: 'object',
        properties: {
          pdfPath: {
            type: 'string',
            description: 'PDF 文件的绝对路径',
            minLength: 1
          },
          pages: {
            oneOf: [
              { type: 'number', minimum: 1 },
              { type: 'array', items: { type: 'number', minimum: 1 } }
            ],
            description: '要读取的页码（可选）。不传则只返回 PDF 元信息；传数字读取单页；传数组读取多页'
          },
          extractImages: {
            type: 'boolean',
            description: '是否提取图片（默认 true）',
            default: true
          },
          forceRefresh: {
            type: 'boolean',
            description: '强制重新解析，忽略缓存（默认 false）',
            default: false
          }
        },
        required: ['pdfPath']
      }
    };
  },

  getBridges() {
    return {
      'pdf:parse': {
        real: async (args, api) => {
          api.logger.info('[Bridge] Parsing PDF with pdf-parse');
          const { PDFParse } = await api.importx('pdf-parse');
          const parser = new PDFParse({ data: args.buffer });
          return parser;
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] Creating mock PDF parser');
          return {
            getText: async () => ({
              text: 'Mock PDF full content\nPage 1 content here\nPage 2 content here\nPage 3 content here',
              total: 3,
              info: {
                Title: 'Mock PDF Document',
                Author: 'Test Author'
              },
              metadata: null,
              version: '1.0'
            }),
            getImage: async () => ({
              pages: [
                {
                  pageNumber: 1,
                  images: [
                    {
                      fileName: 'img-0',
                      data: Buffer.from('fake-image-data-page-1'),
                      width: 800,
                      height: 600
                    }
                  ]
                },
                {
                  pageNumber: 2,
                  images: [
                    {
                      fileName: 'img-0',
                      data: Buffer.from('fake-image-data-page-2'),
                      width: 1024,
                      height: 768
                    }
                  ]
                },
                {
                  pageNumber: 3,
                  images: []
                }
              ]
            })
          };
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
          return Buffer.from('mock-pdf-binary-data');
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

      'fs:exists': {
        real: async (args, api) => {
          const fs = await api.importx('fs');
          try {
            await fs.promises.access(args.path);
            return true;
          } catch {
            return false;
          }
        },
        mock: async (args, api) => {
          api.logger.debug(`[Mock] Checking file exists: ${args.path}`);
          return false; // Mock 总是返回不存在，这样会走解析流程
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
      'pdf:parse': [
        {
          code: 'INVALID_PDF',
          match: /Invalid PDF/i,
          solution: '检查 PDF 文件是否损坏',
          retryable: false
        }
      ],
      'fs:readFile': [
        {
          code: 'FILE_NOT_FOUND',
          match: /ENOENT/,
          solution: '检查 PDF 文件路径是否正确',
          retryable: false
        }
      ]
    };
  },

  async execute(params) {
    const { api } = this;
    const { pdfPath, pages, extractImages = true, forceRefresh = false } = params;

    try {
      api.logger.info('开始处理 PDF', { pdfPath, pages, extractImages, forceRefresh });

      // 1. 读取 PDF 文件
      const pdfBuffer = await api.bridge.execute('fs:readFile', { path: pdfPath });
      api.logger.info('PDF 文件读取成功', { size: pdfBuffer.length });

      // 2. 生成 PDF hash
      const pdfHash = await api.bridge.execute('crypto:hash', { data: pdfBuffer });

      // 3. 获取工具信息，构建 PDF 数据目录
      const toolInfo = api.getInfo();
      const pdfDir = await api.bridge.execute('path:join', {
        parts: [toolInfo.sandboxPath, 'pdfs', pdfHash]
      });

      api.logger.info('PDF 数据目录', { pdfDir });

      // 4. 检查 storage 中的 PDF 元信息缓存
      const allPdfs = api.storage.getItem('pdfs') || {};
      let pdfMetadata = allPdfs[pdfHash];

      api.logger.info('Storage 读取结果', {
        hasPdfs: !!allPdfs,
        pdfKeys: Object.keys(allPdfs),
        hasPdfMetadata: !!pdfMetadata,
        cachedPages: pdfMetadata ? Object.keys(pdfMetadata.parsedPages || {}) : []
      });

      if (!pdfMetadata || forceRefresh) {
        // 首次处理此 PDF，解析基本信息
        api.logger.info('首次处理此 PDF，解析元信息');
        const parser = await api.bridge.execute('pdf:parse', { buffer: pdfBuffer });
        const basicInfo = await parser.getText();
        const totalPages = basicInfo.total;

        pdfMetadata = {
          totalPages: totalPages,
          title: basicInfo.info?.Title || null,
          author: basicInfo.info?.Author || null,
          pdfHash: pdfHash,
          pdfPath: pdfPath,
          createdAt: Date.now(),
          parsedPages: {}
        };

        allPdfs[pdfHash] = pdfMetadata;
        api.storage.setItem('pdfs', allPdfs);
        api.logger.info('PDF 元信息已缓存', { totalPages });
      } else {
        api.logger.info('使用缓存的 PDF 元信息', {
          totalPages: pdfMetadata.totalPages,
          cachedPages: Object.keys(pdfMetadata.parsedPages || {}).length
        });
      }

      const totalPages = pdfMetadata.totalPages;

      // 5. 如果没有传 pages，只返回元信息
      if (pages === undefined || pages === null) {
        return {
          success: true,
          metadata: {
            totalPages: pdfMetadata.totalPages,
            title: pdfMetadata.title,
            author: pdfMetadata.author,
            cachedPages: Object.keys(pdfMetadata.parsedPages || {}).length
          },
          message: '使用 pages 参数指定要读取的页码，例如：pages: 1 或 pages: [1,2,3]'
        };
      }

      // 6. 标准化 pages 为数组
      const pageNumbers = Array.isArray(pages) ? pages : [pages];

      // 验证页码范围
      for (const pageNum of pageNumbers) {
        if (pageNum < 1 || pageNum > totalPages) {
          throw new Error(`页码 ${pageNum} 超出范围（总页数：${totalPages}）`);
        }
      }

      api.logger.info('准备读取指定页面', { pageNumbers });

      // 7. 创建 PDF 数据目录
      await api.bridge.execute('fs:mkdir', { path: pdfDir });

      // 8. 提取指定页面的内容（使用缓存）
      const pagesContent = [];
      const allImages = [];
      let fullText = '';
      let cacheHits = 0;
      let cacheMisses = 0;

      // 只在有 cache miss 时才解析整个 PDF
      let imageResult = null;
      let textLines = null;

      for (const pageNum of pageNumbers) {
        api.logger.info(`处理第 ${pageNum} 页`);

        // 检查缓存
        const pageCache = pdfMetadata.parsedPages?.[pageNum];
        const shouldUseCache = pageCache && !forceRefresh;

        if (shouldUseCache && extractImages) {
          // 验证缓存的图片文件是否存在
          api.logger.info(`检查第 ${pageNum} 页缓存`, {
            hasPageCache: !!pageCache,
            imageCount: pageCache?.imageCount
          });

          let allImagesExist = true;
          for (let i = 0; i < (pageCache.imageCount || 0); i++) {
            const imgPath = await api.bridge.execute('path:join', {
              parts: [pdfDir, `page-${pageNum}-img-${i}.png`]
            });
            const exists = await api.bridge.execute('fs:exists', { path: imgPath });

            api.logger.info(`图片文件检查`, { imgPath, exists });

            if (!exists) {
              allImagesExist = false;
              api.logger.warn(`缓存的图片不存在: ${imgPath}`);
              break;
            }
          }

          if (allImagesExist) {
            // 使用缓存
            cacheHits++;
            api.logger.info(`第 ${pageNum} 页使用缓存`, { imageCount: pageCache.imageCount });

            const pageImages = [];
            for (let i = 0; i < (pageCache.imageCount || 0); i++) {
              const imgPath = await api.bridge.execute('path:join', {
                parts: [pdfDir, `page-${pageNum}-img-${i}.png`]
              });

              pageImages.push({
                page: pageNum,
                index: i,
                path: imgPath,
                width: null,
                height: null
              });
              allImages.push(pageImages[pageImages.length - 1]);
            }

            pagesContent.push({
              page: pageNum,
              hasImages: pageImages.length > 0,
              imageCount: pageImages.length,
              images: pageImages,
              fromCache: true
            });

            // 文本部分需要重新提取（因为文本没有缓存文件）
            if (!textLines) {
              const parser = await api.bridge.execute('pdf:parse', { buffer: pdfBuffer });
              const basicInfo = await parser.getText();
              textLines = basicInfo.text.split('\n');
            }

            const estimatedLinesPerPage = Math.ceil(textLines.length / totalPages);
            const startLine = (pageNum - 1) * estimatedLinesPerPage;
            const endLine = pageNum * estimatedLinesPerPage;
            const pageText = textLines.slice(startLine, endLine).join('\n');
            fullText += `\n=== 第 ${pageNum} 页 ===\n${pageText}\n`;

            continue;
          }
        }

        // 缓存未命中，需要解析
        cacheMisses++;
        api.logger.info(`第 ${pageNum} 页缓存未命中，开始解析`);

        // 延迟解析：只在第一次 cache miss 时解析整个 PDF
        if (!imageResult) {
          const parser = await api.bridge.execute('pdf:parse', { buffer: pdfBuffer });
          imageResult = await parser.getImage();

          const basicInfo = await parser.getText();
          textLines = basicInfo.text.split('\n');

          api.logger.info('PDF 解析完成');
        }

        // 从 imageResult 中找到对应页面
        const pageData = imageResult.pages.find(p => p.pageNumber === pageNum);

        if (!pageData) {
          api.logger.warn(`第 ${pageNum} 页没有找到数据`);
          continue;
        }

        const pageImages = [];

        // 处理该页的图片
        if (extractImages && pageData.images && pageData.images.length > 0) {
          for (let i = 0; i < pageData.images.length; i++) {
            const img = pageData.images[i];
            const imgFileName = `page-${pageNum}-img-${i}.png`;
            const imgPath = await api.bridge.execute('path:join', {
              parts: [pdfDir, imgFileName]
            });

            // 保存图片
            await api.bridge.execute('fs:writeFile', {
              path: imgPath,
              data: img.data
            });

            const imageInfo = {
              page: pageNum,
              index: i,
              path: imgPath,
              width: img.width || null,
              height: img.height || null
            };

            pageImages.push(imageInfo);
            allImages.push(imageInfo);
          }

          api.logger.info(`第 ${pageNum} 页图片处理完成`, {
            imageCount: pageImages.length
          });
        }

        // 缓存页面信息
        // 重新从 storage 读取以确保数据最新
        const currentPdfs = api.storage.getItem('pdfs') || {};
        const currentMetadata = currentPdfs[pdfHash] || pdfMetadata;

        if (!currentMetadata.parsedPages) {
          currentMetadata.parsedPages = {};
        }
        currentMetadata.parsedPages[pageNum] = {
          timestamp: Date.now(),
          imageCount: pageImages.length,
          hasText: true
        };

        currentPdfs[pdfHash] = currentMetadata;
        api.storage.setItem('pdfs', currentPdfs);

        // 更新本地引用
        pdfMetadata = currentMetadata;

        pagesContent.push({
          page: pageNum,
          hasImages: pageImages.length > 0,
          imageCount: pageImages.length,
          images: pageImages,
          fromCache: false
        });

        // 提取文本
        const estimatedLinesPerPage = Math.ceil(textLines.length / totalPages);
        const startLine = (pageNum - 1) * estimatedLinesPerPage;
        const endLine = pageNum * estimatedLinesPerPage;
        const pageText = textLines.slice(startLine, endLine).join('\n');
        fullText += `\n=== 第 ${pageNum} 页 ===\n${pageText}\n`;
      }

      // 9. 构建返回结果
      const result = {
        success: true,
        metadata: {
          totalPages: totalPages,
          title: pdfMetadata.title,
          author: pdfMetadata.author,
          requestedPages: pageNumbers
        },
        content: {
          text: fullText.trim(),
          pages: pagesContent,
          hasImages: allImages.length > 0,
          imageCount: allImages.length,
          imagesDirectory: pdfDir
        },
        cache: {
          hits: cacheHits,
          misses: cacheMisses,
          totalCachedPages: Object.keys(pdfMetadata.parsedPages || {}).length
        }
      };

      api.logger.info('PDF 分页读取完成', {
        readPages: pageNumbers.length,
        totalImages: allImages.length,
        cacheHits,
        cacheMisses
      });

      return result;

    } catch (error) {
      api.logger.error('PDF 处理失败', error);
      throw error;
    }
  }
};
