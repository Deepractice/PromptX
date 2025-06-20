const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'dacp.config.json'), 'utf8'));
const PORT = process.env.PORT || config.deployment.port || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Load all actions
const actions = {};
const actionsDir = path.join(__dirname, 'actions');

// Dynamically load all action modules
if (fs.existsSync(actionsDir)) {
  fs.readdirSync(actionsDir).forEach(file => {
    if (file.endsWith('.js')) {
      const actionName = file.replace('.js', '');
      actions[actionName] = require(path.join(actionsDir, file));
      console.log(`Loaded action: ${actionName}`);
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: config.service.name,
    version: config.service.version,
    uptime: process.uptime()
  });
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: config.service,
    capabilities: config.capabilities,
    available_actions: Object.keys(actions)
  });
});

// Main DACP endpoint
app.post('/dacp', async (req, res) => {
  const startTime = Date.now();
  const { service_id, action, parameters, request_id } = req.body;

  // Generate request_id if not provided
  const reqId = request_id || `req_${Date.now()}`;

  try {
    // Validate service_id
    if (service_id !== config.service.id) {
      return res.status(400).json({
        request_id: reqId,
        success: false,
        error: {
          code: 'INVALID_SERVICE',
          message: `Service ${service_id} not found. This is ${config.service.id}`
        }
      });
    }

    // Validate action
    if (!action) {
      return res.status(400).json({
        request_id: reqId,
        success: false,
        error: {
          code: 'MISSING_ACTION',
          message: 'Action is required'
        }
      });
    }

    // Find action handler
    let handler = null;
    
    // Try to find by module name first
    for (const [moduleName, module] of Object.entries(actions)) {
      if (module[action] && typeof module[action] === 'function') {
        handler = module[action];
        break;
      }
    }
    
    // If not found, try exact module match
    if (!handler && actions[action]) {
      handler = actions[action];
    }

    if (!handler) {
      return res.status(400).json({
        request_id: reqId,
        success: false,
        error: {
          code: 'UNKNOWN_ACTION',
          message: `Action ${action} is not supported`
        }
      });
    }

    // Execute action
    const result = await handler(parameters);

    // Return DACP standard response
    res.json({
      request_id: reqId,
      success: true,
      data: {
        execution_result: result,
        evaluation: {
          constraint_compliance: true,
          rule_adherence: true,
          guideline_alignment: true
        },
        applied_guidelines: [
          'DACP protocol standard',
          'Service-specific best practices'
        ],
        performance_metrics: {
          execution_time: `${Date.now() - startTime}ms`,
          resource_usage: 'minimal'
        }
      }
    });

  } catch (error) {
    console.error('DACP execution error:', error);
    res.status(500).json({
      request_id: reqId,
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error.message
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ${config.service.name} v${config.service.version}`);
  console.log(`📍 Running at http://localhost:${PORT}`);
  console.log(`🔧 Available actions: ${Object.keys(actions).join(', ')}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});