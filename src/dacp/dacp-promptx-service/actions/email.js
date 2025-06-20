/**
 * Email Action Module for DACP PromptX Service
 * 提供邮件发送功能 - 支持Demo模式和真实发送
 */

const nodemailer = require('nodemailer')
const DACPConfigManager = require('../../../lib/utils/DACPConfigManager')

// Email action handler
async function send_email(parameters) {
  const { user_request, context = {} } = parameters;
  
  if (!user_request) {
    throw new Error('user_request is required for send_email action');
  }

  // 解析邮件信息
  const emailData = parseEmailRequest(user_request, context);
  
  // 验证邮件数据
  validateEmailData(emailData);
  
  // 执行发送（Demo模式）
  const result = await executeSendEmail(emailData, context);
  
  return result;
}

// 解析邮件请求
function parseEmailRequest(userRequest, context) {
  // 提取邮箱地址
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emails = userRequest.match(emailRegex) || [];
  
  // 分析请求意图
  let subject = '邮件通知';
  let urgency = context.urgency || 'normal';
  
  if (userRequest.includes('会议')) {
    subject = '会议通知';
    urgency = 'high';
  } else if (userRequest.includes('提醒')) {
    subject = '重要提醒';
    urgency = 'high';
  } else if (userRequest.includes('报告')) {
    subject = '工作报告';
  } else if (userRequest.includes('邀请')) {
    subject = '邀请函';
  }
  
  // 生成专业的邮件内容
  const body = generateProfessionalEmailBody(userRequest, subject, context);
  
  return {
    to: emails[0] || 'demo@example.com',
    subject: subject,
    body: body,
    urgency: urgency,
    originalRequest: userRequest,
    timestamp: new Date().toISOString()
  };
}

// 生成专业的邮件正文
function generateProfessionalEmailBody(userRequest, subject, context) {
  const timestamp = new Date().toLocaleString('zh-CN');
  const recipientType = context.recipient_type || 'colleague';
  
  // 根据收件人类型调整语气
  let greeting = '您好';
  let closing = 'Best regards';
  
  if (recipientType === 'superior') {
    greeting = '尊敬的领导';
    closing = '此致\n敬礼';
  } else if (recipientType === 'client') {
    greeting = '尊敬的客户';
    closing = '谨上';
  }
  
  // 构建邮件内容
  let body = `${greeting}，\n\n`;
  
  // 根据主题类型生成不同的内容结构
  if (subject.includes('会议')) {
    body += `特此通知您关于以下会议安排：\n\n`;
    body += `${userRequest}\n\n`;
    body += `请您准时参加。如有任何问题，请及时与我联系。\n`;
  } else if (subject.includes('提醒')) {
    body += `这是一份重要提醒：\n\n`;
    body += `${userRequest}\n\n`;
    body += `请您知悉并及时处理。\n`;
  } else {
    body += `${userRequest}\n`;
  }
  
  body += `\n${closing}\n`;
  body += `DACP PromptX Service\n`;
  body += `发送时间: ${timestamp}`;
  
  return body;
}

// 验证邮件数据
function validateEmailData(emailData) {
  const errors = [];
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailData.to)) {
    errors.push('Invalid email address format');
  }
  
  // 验证内容
  if (!emailData.subject || emailData.subject.trim().length === 0) {
    errors.push('Email subject cannot be empty');
  }
  
  if (!emailData.body || emailData.body.trim().length === 0) {
    errors.push('Email body cannot be empty');
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
}

// 执行邮件发送
async function executeSendEmail(emailData, context) {
  const configManager = new DACPConfigManager()
  
  // 检查是否有用户配置
  const hasConfig = await configManager.hasActionConfig('send_email')
  
  if (!hasConfig) {
    // 无配置，回退到Demo模式
    return await executeDemoSendEmail(emailData, context)
  }
  
  // 读取配置
  const config = await configManager.readActionConfig('send_email')
  
  // 验证配置
  const validation = configManager.validateEmailConfig(config)
  if (!validation.valid) {
    // 配置无效，抛出友好错误
    const errorMessage = await configManager.generateConfigErrorMessage('send_email', validation)
    throw new Error(errorMessage)
  }
  
  try {
    // 真实邮件发送
    return await executeRealSendEmail(emailData, config, context)
  } catch (error) {
    // 发送失败，提供友好提示
    console.error('邮件发送失败:', error.message)
    throw new Error(`\n📧 邮件发送失败\n\n❌ 错误信息: ${error.message}\n\n💡 可能的解决方案:\n  • 检查邮箱密码是否正确\n  • 确认已启用SMTP服务\n  • 验证网络连接状态\n  • Gmail用户确保使用应用专用密码\n`)
  }
}

// Demo模式发送
async function executeDemoSendEmail(emailData, context) {
  console.log('📧 [DACP Demo] Simulating email send:');
  console.log(`   To: ${emailData.to}`);
  console.log(`   Subject: ${emailData.subject}`);
  console.log(`   Urgency: ${emailData.urgency}`);
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const configManager = new DACPConfigManager()
  const configHint = await configManager.generateConfigErrorMessage('send_email')
  
  return {
    message_id: `demo_msg_${Date.now()}`,
    status: 'demo_sent',
    recipient: emailData.to,
    subject: emailData.subject,
    body: emailData.body,
    sent_at: emailData.timestamp,
    urgency: emailData.urgency,
    demo_mode: true,
    config_hint: configHint,
    execution_metrics: {
      parsing_time: '10ms',
      validation_time: '5ms',
      sending_time: '100ms'
    }
  };
}

// 真实邮件发送
async function executeRealSendEmail(emailData, config, context) {
  const startTime = Date.now()
  
  // 获取提供商配置
  const configManager = new DACPConfigManager()
  const providerConfig = configManager.getProviderConfig(config.provider)
  
  if (!providerConfig) {
    throw new Error(`不支持的邮件服务提供商: ${config.provider}`)
  }
  
  // 创建邮件传输器
  const transporter = nodemailer.createTransport({
    host: providerConfig.smtp,
    port: providerConfig.port,
    secure: providerConfig.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password
    }
  })
  
  // 构建邮件选项
  const mailOptions = {
    from: `"${config.sender.name}" <${config.sender.email}>`,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.body.replace(/\n/g, '<br>'),
    text: emailData.body
  }
  
  // 发送邮件
  const info = await transporter.sendMail(mailOptions)
  const endTime = Date.now()
  
  return {
    message_id: info.messageId,
    status: 'sent',
    recipient: emailData.to,
    subject: emailData.subject,
    body: emailData.body,
    sent_at: new Date().toISOString(),
    urgency: emailData.urgency,
    demo_mode: false,
    provider: config.provider,
    smtp_response: info.response,
    execution_metrics: {
      parsing_time: '10ms',
      validation_time: '5ms',
      sending_time: `${endTime - startTime}ms`
    }
  }
}

// 导出所有email相关的actions
module.exports = {
  send_email
};