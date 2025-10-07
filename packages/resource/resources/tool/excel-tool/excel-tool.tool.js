/**
 * Excel - Excel文件读写操作工具
 * 
 * 战略意义：
 * 1. 数据桥梁价值：打通AI与Excel数据世界的连接
 * 2. 通用性保证：纯行列操作，不对数据格式做任何假设
 * 3. 生态基础设施：为PromptX提供结构化数据处理能力
 * 
 * 设计理念：
 * 采用action统一参数设计，避免过度分层。
 * 基于行列的原子操作，保持最大灵活性。
 * 索引从1开始符合Excel习惯，降低用户认知成本。
 * 
 * 生态定位：
 * 作为数据处理类工具的基础组件，支撑报表生成、数据分析等场景。
 */

module.exports = {
  getDependencies() {
    return {
      'exceljs': '^4.4.0',
      'xlsx-chart': '^0.4.3'
    };
  },

  getMetadata() {
    return {
      id: 'excel-tool',
      name: 'Excel操作工具',
      description: 'Excel文件的读写和修改操作，基于行列的原子操作',
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
            enum: ['read', 'write', 'appendRow', 'updateCell', 'insertColumn', 'createColumnChart', 'createLineChart', 'createPieChart', 'createBarChart'],
            description: '操作类型'
          },
          filePath: {
            type: 'string',
            description: 'Excel文件路径'
          },
          sheet: {
            oneOf: [
              { type: 'string' },
              { type: 'number' }
            ],
            description: 'Sheet名称或索引（从1开始），默认第一个sheet'
          },
          data: {
            description: '操作数据，根据action不同而不同'
          }
        },
        required: ['action', 'filePath'],
        allOf: [
          {
            if: { properties: { action: { const: 'read' } } },
            then: {
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    startRow: { type: 'number', description: '起始行（从1开始）' },
                    endRow: { type: 'number', description: '结束行' },
                    startCol: { type: 'number', description: '起始列（从1开始）' },
                    endCol: { type: 'number', description: '结束列' }
                  },
                  description: '可选的读取范围'
                }
              }
            }
          },
          {
            if: { properties: { action: { const: 'write' } } },
            then: {
              properties: {
                data: {
                  type: 'array',
                  items: { type: 'array' },
                  minItems: 1,
                  description: '二维数组，要写入的数据'
                }
              },
              required: ['data']
            }
          },
          {
            if: { properties: { action: { const: 'appendRow' } } },
            then: {
              properties: {
                data: {
                  type: 'array',
                  minItems: 1,
                  description: '一维数组，要追加的行数据'
                }
              },
              required: ['data']
            }
          },
          {
            if: { properties: { action: { const: 'updateCell' } } },
            then: {
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    row: { type: 'number', minimum: 1, description: '行号（从1开始）' },
                    col: { type: 'number', minimum: 1, description: '列号（从1开始）' },
                    value: { description: '单元格的新值' }
                  },
                  required: ['row', 'col', 'value'],
                  description: '单元格位置和新值'
                }
              },
              required: ['data']
            }
          },
          {
            if: { properties: { action: { const: 'insertColumn' } } },
            then: {
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    position: { type: 'number', minimum: 1, description: '插入的列位置（从1开始）' },
                    values: { type: 'array', description: '列数据数组' }
                  },
                  required: ['position', 'values'],
                  description: '列插入位置和数据'
                }
              },
              required: ['data']
            }
          },
          {
            if: {
              properties: {
                action: {
                  enum: ['createColumnChart', 'createLineChart', 'createPieChart', 'createBarChart']
                }
              }
            },
            then: {
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    sourceFile: { type: 'string', description: '数据源文件路径（可选）' },
                    sheet: {
                      oneOf: [{ type: 'string' }, { type: 'number' }],
                      description: '数据源sheet名称或索引'
                    },
                    dataRange: { type: 'string', description: '数据范围，如 A1:D5' },
                    titles: { type: 'array', items: { type: 'string' }, description: '系列名称数组' },
                    fields: { type: 'array', items: { type: 'string' }, description: '类别名称数组' },
                    values: { type: 'object', description: '数据值对象' },
                    chartTitle: { type: 'string', description: '图表标题' }
                  },
                  description: '图表数据配置'
                }
              },
              required: ['data']
            }
          }
        ]
      }
    };
  },

  getBridges() {
    return {
      'excel:read': {
        real: async (args, api) => {
          api.logger.info('[Bridge] Reading Excel file', { filePath: args.filePath });
          const ExcelJS = await api.importx('exceljs');
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(args.filePath);
          api.logger.info('[Bridge] Excel file loaded');
          return workbook;
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] Creating mock workbook');
          return {
            worksheets: [
              {
                name: 'Sheet1',
                rowCount: 3,
                columnCount: 3,
                getRow: (rowNum) => ({
                  values: ['', 'A' + rowNum, 'B' + rowNum, 'C' + rowNum]
                })
              }
            ],
            getWorksheet: (nameOrIndex) => {
              return {
                name: 'Sheet1',
                rowCount: 3,
                columnCount: 3,
                getRow: (rowNum) => ({
                  values: ['', 'A' + rowNum, 'B' + rowNum, 'C' + rowNum]
                })
              };
            }
          };
        }
      },

      'excel:write': {
        real: async (args, api) => {
          api.logger.info('[Bridge] Writing Excel file', { filePath: args.filePath });
          const ExcelJS = await api.importx('exceljs');
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet(args.sheetName || 'Sheet1');
          
          args.data.forEach(row => {
            worksheet.addRow(row);
          });
          
          await workbook.xlsx.writeFile(args.filePath);
          api.logger.info('[Bridge] Excel file written');
          return args.filePath;
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] Simulating Excel write', { filePath: args.filePath });
          return args.filePath;
        }
      },

      'excel:modify': {
        real: async (args, api) => {
          api.logger.info('[Bridge] Modifying Excel file', { filePath: args.filePath });
          const ExcelJS = await api.importx('exceljs');
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(args.filePath);

          const worksheet = args.sheet
            ? (typeof args.sheet === 'number' ? workbook.worksheets[args.sheet - 1] : workbook.getWorksheet(args.sheet))
            : workbook.worksheets[0];

          api.logger.info('[Bridge] Workbook loaded for modification');
          return { workbook, worksheet, filePath: args.outputPath || args.filePath };
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] Creating mock workbook for modification');
          return {
            workbook: { xlsx: { writeFile: async () => {} } },
            worksheet: {
              addRow: (data) => api.logger.debug('[Mock] Row added', { data }),
              getCell: (row, col) => ({ value: null }),
              spliceColumns: (pos, count, values) => api.logger.debug('[Mock] Column inserted')
            },
            filePath: args.outputPath || args.filePath
          };
        }
      },

      'excel:createChart': {
        real: async (args, api) => {
          api.logger.info('[Bridge] Creating chart', { chartType: args.chartType, outputFile: args.outputFile });
          const XLSXChart = await api.importx('xlsx-chart');
          const xlsxChart = new XLSXChart();

          const chartOpts = {
            file: args.outputFile,
            chart: args.chartType,
            titles: args.titles,
            fields: args.fields,
            data: args.data,
            chartTitle: args.chartTitle
          };

          return new Promise((resolve, reject) => {
            xlsxChart.writeFile(chartOpts, (err) => {
              if (err) {
                api.logger.error('[Bridge] Chart creation failed', err);
                reject(err);
              } else {
                api.logger.info('[Bridge] Chart created successfully');
                resolve(args.outputFile);
              }
            });
          });
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] Simulating chart creation', { chartType: args.chartType });
          return args.outputFile;
        }
      }
    };
  },

  async execute(params) {
    const { api } = this;
    const { action, filePath, sheet, data } = params;

    api.logger.info('Excel operation started', { action, filePath });

    try {
      switch (action) {
        case 'read':
          return await this.handleRead(filePath, sheet, data, api);

        case 'write':
          return await this.handleWrite(filePath, sheet, data, api);

        case 'appendRow':
          return await this.handleAppendRow(filePath, sheet, data, api);

        case 'updateCell':
          return await this.handleUpdateCell(filePath, sheet, data, api);

        case 'insertColumn':
          return await this.handleInsertColumn(filePath, sheet, data, api);

        case 'createColumnChart':
          return await this.handleCreateChart(filePath, 'column', data, sheet, api);

        case 'createLineChart':
          return await this.handleCreateChart(filePath, 'line', data, sheet, api);

        case 'createPieChart':
          return await this.handleCreateChart(filePath, 'pie', data, sheet, api);

        case 'createBarChart':
          return await this.handleCreateChart(filePath, 'bar', data, sheet, api);

        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      api.logger.error('Excel operation failed', error);
      throw error;
    }
  },

  async handleRead(filePath, sheetNameOrIndex, rangeData, api) {
    const workbook = await api.bridge.execute('excel:read', { filePath });
    
    const worksheet = sheetNameOrIndex
      ? (typeof sheetNameOrIndex === 'number' ? workbook.worksheets[sheetNameOrIndex - 1] : workbook.getWorksheet(sheetNameOrIndex))
      : workbook.worksheets[0];

    if (!worksheet) {
      throw new Error('Worksheet not found');
    }

    const startRow = rangeData?.startRow || 1;
    const endRow = rangeData?.endRow || worksheet.rowCount;
    const startCol = rangeData?.startCol || 1;
    const endCol = rangeData?.endCol || worksheet.columnCount;

    const result = [];
    for (let i = startRow; i <= endRow; i++) {
      const row = worksheet.getRow(i);
      const rowData = [];
      for (let j = startCol; j <= endCol; j++) {
        rowData.push(row.values[j]);
      }
      result.push(rowData);
    }

    api.logger.info('Read completed', { rows: result.length });

    return {
      success: true,
      data: result,
      meta: {
        rows: result.length,
        cols: endCol - startCol + 1,
        sheetName: worksheet.name
      }
    };
  },

  async handleWrite(filePath, sheetName, data, api) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty 2D array');
    }

    const outputPath = await api.bridge.execute('excel:write', {
      filePath,
      sheetName: sheetName || 'Sheet1',
      data
    });

    api.logger.info('Write completed', { filePath: outputPath });

    return {
      success: true,
      filePath: outputPath
    };
  },

  async handleAppendRow(filePath, sheetNameOrIndex, rowData, api) {
    if (!Array.isArray(rowData)) {
      throw new Error('Row data must be an array');
    }

    const { workbook, worksheet, filePath: outputPath } = await api.bridge.execute('excel:modify', {
      filePath,
      sheet: sheetNameOrIndex
    });

    worksheet.addRow(rowData);
    await workbook.xlsx.writeFile(outputPath);

    api.logger.info('Row appended', { filePath: outputPath });

    return {
      success: true,
      filePath: outputPath
    };
  },

  async handleUpdateCell(filePath, sheetNameOrIndex, cellData, api) {
    if (!cellData || !cellData.row || !cellData.col) {
      throw new Error('Cell data must include row and col');
    }

    const { workbook, worksheet, filePath: outputPath } = await api.bridge.execute('excel:modify', {
      filePath,
      sheet: sheetNameOrIndex
    });

    worksheet.getCell(cellData.row, cellData.col).value = cellData.value;
    await workbook.xlsx.writeFile(outputPath);

    api.logger.info('Cell updated', { row: cellData.row, col: cellData.col });

    return {
      success: true,
      filePath: outputPath
    };
  },

  async handleInsertColumn(filePath, sheetNameOrIndex, columnData, api) {
    if (!columnData || !columnData.position || !Array.isArray(columnData.values)) {
      throw new Error('Column data must include position and values array');
    }

    const { workbook, worksheet, filePath: outputPath } = await api.bridge.execute('excel:modify', {
      filePath,
      sheet: sheetNameOrIndex
    });

    worksheet.spliceColumns(columnData.position, 0, columnData.values);
    await workbook.xlsx.writeFile(outputPath);

    api.logger.info('Column inserted', { position: columnData.position });

    return {
      success: true,
      filePath: outputPath
    };
  },

  async handleCreateChart(outputFilePath, chartType, chartData, sheetParam, api) {
    api.logger.info('Creating chart', { chartType, outputFilePath });

    let titles, fields, values;

    // 如果提供了 sourceFile，从现有文件读取数据
    if (chartData.sourceFile) {
      api.logger.info('Reading data from source file', { sourceFile: chartData.sourceFile });

      const workbook = await api.bridge.execute('excel:read', { filePath: chartData.sourceFile });
      const worksheet = sheetParam || chartData.sheet
        ? (typeof (sheetParam || chartData.sheet) === 'number'
          ? workbook.worksheets[(sheetParam || chartData.sheet) - 1]
          : workbook.getWorksheet(sheetParam || chartData.sheet))
        : workbook.worksheets[0];

      if (!worksheet) {
        throw new Error('Worksheet not found in source file');
      }

      // 解析数据范围（如 A1:D4）
      const range = chartData.dataRange || `A1:${String.fromCharCode(64 + worksheet.columnCount)}${worksheet.rowCount}`;
      const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);

      if (!match) {
        throw new Error('Invalid dataRange format. Expected format: A1:D5');
      }

      const startCol = match[1].charCodeAt(0) - 64;
      const startRow = parseInt(match[2]);
      const endCol = match[3].charCodeAt(0) - 64;
      const endRow = parseInt(match[4]);

      // 读取数据
      const rows = [];
      for (let i = startRow; i <= endRow; i++) {
        const row = worksheet.getRow(i);
        const rowData = [];
        for (let j = startCol; j <= endCol; j++) {
          rowData.push(row.values[j]);
        }
        rows.push(rowData);
      }

      // 第一行是表头（titles），第一列是类别（fields）
      titles = rows[0].slice(1); // 跳过第一个单元格
      fields = rows.slice(1).map(row => row[0]);

      // 构建 values 对象
      values = {};
      titles.forEach((title, titleIndex) => {
        values[title] = {};
        rows.slice(1).forEach((row, rowIndex) => {
          values[title][fields[rowIndex]] = row[titleIndex + 1];
        });
      });

      api.logger.info('Data extracted from source file', { titles, fields });
    } else {
      // 直接使用提供的数据
      titles = chartData.titles;
      fields = chartData.fields;
      values = chartData.values;
    }

    // 验证必要数据
    if (!titles || !fields || !values) {
      throw new Error('Missing required chart data: titles, fields, or values');
    }

    // 调用 Bridge 创建图表
    const result = await api.bridge.execute('excel:createChart', {
      outputFile: outputFilePath,
      chartType: chartType,
      titles: titles,
      fields: fields,
      data: values,
      chartTitle: chartData.chartTitle
    });

    api.logger.info('Chart created', { filePath: result });

    return {
      success: true,
      filePath: result,
      chartType: chartType
    };
  },

  getBusinessErrors() {
    return [
      {
        code: 'FILE_NOT_FOUND',
        description: 'Excel文件不存在',
        match: /ENOENT|no such file/i,
        solution: '检查文件路径是否正确',
        retryable: false
      },
      {
        code: 'INVALID_EXCEL',
        description: '无效的Excel文件格式',
        match: /corrupt|invalid|parse error/i,
        solution: '确认文件是有效的Excel文件（.xlsx）',
        retryable: false
      },
      {
        code: 'SHEET_NOT_FOUND',
        description: 'Sheet不存在',
        match: /worksheet not found/i,
        solution: '检查sheet名称或索引是否正确',
        retryable: false
      },
      {
        code: 'CHART_CREATION_FAILED',
        description: '图表创建失败',
        match: /chart|xlsx-chart/i,
        solution: '检查图表数据格式是否正确',
        retryable: false
      }
    ];
  }
};
