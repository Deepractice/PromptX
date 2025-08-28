import { exec } from 'child_process'
import { promisify } from 'util'
import type { Role, ActivationResult } from '../domain/Role'
import type { ActivationAdapter } from '../application/RoleService'

const execAsync = promisify(exec)

/**
 * PromptX Activation Adapter - 基础设施层实现
 * 通过调用PromptX CLI激活角色
 */
export class PromptXActivationAdapter implements ActivationAdapter {
  async activate(role: Role): Promise<ActivationResult> {
    try {
      // 调用promptx action命令激活角色
      const { stdout } = await execAsync(`promptx action ${role.id}`)
      
      // 检查输出判断是否成功
      const success = stdout.includes('角色已激活') || 
                     stdout.includes('role activated') ||
                     stdout.includes('角色激活完成')
      
      return {
        success,
        roleId: role.id,
        message: success ? `Successfully activated ${role.name}` : 'Activation failed',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        roleId: role.id,
        message: `Failed to activate: ${(error as Error).message}`,
        timestamp: new Date()
      }
    }
  }
}