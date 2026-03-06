// 测试 census.list 文本解析器
const testInput = `rolex (RoleX)
  nuwa (女娲, nvwa) — individual-manager, organization-manager, position-manager

火花堆栈人工智能有限公司
  Node全栈工程师 — Node全栈工程师岗位
  测试工程师 — 测试工程师岗位
  AI系统架构师 — AI系统架构师岗位
  UI设计师 — UI设计师岗位
  产品经理 — 产品经理岗位

---
📅 2026-03-05 12:01:08
📊 Token usage: ~69 tokens
Powered by PromptX v2.1.0 | deepractice.ai`

function parseCensusOutput(text) {
  const result = {
    roles: [],
    organizations: []
  }

  if (!text || typeof text !== 'string') {
    return result
  }

  const lines = text.split('\n').filter(l => l.trim() && !l.includes('---') && !l.includes('📅') && !l.includes('📊') && !l.includes('Powered by'))

  let currentOrg = null

  for (const line of lines) {
    const trimmed = line.trim()

    // 跳过空行
    if (!trimmed) continue

    // 检测组织行（没有缩进，可能包含括号）
    if (!line.startsWith(' ')) {
      // 这是一个组织名称
      currentOrg = trimmed
      if (!result.organizations.find(o => o.name === currentOrg)) {
        result.organizations.push({
          name: currentOrg,
          members: [],
          positions: []
        })
      }
    }
    // 检测缩进行（角色或职位）
    else if (line.startsWith('  ') && currentOrg) {
      const match = trimmed.match(/^([^\s—]+)(?:\s*\([^)]+\))?\s*—\s*(.+)$/)
      if (match) {
        const name = match[1].trim()
        const description = match[2].trim()

        // 判断是角色还是职位
        // 如果描述包含多个逗号分隔的职位，或者包含 "manager" 等关键词，则是角色
        // 否则是职位定义
        const isRole = description.includes(',') ||
                      description.includes('manager') ||
                      description.includes('individual') ||
                      description.includes('organization') ||
                      description.includes('position')

        if (isRole) {
          // 这是一个角色
          const positions = description.split(',').map(p => p.trim())

          // 添加到 roles 列表
          result.roles.push({
            name: name,
            org: currentOrg,
            position: positions[0]
          })

          // 添加到组织的成员列表
          const org = result.organizations.find(o => o.name === currentOrg)
          if (org) {
            org.members.push({
              name: name,
              position: positions[0]
            })
          }
        } else {
          // 这是一个职位定义
          const org = result.organizations.find(o => o.name === currentOrg)
          if (org) {
            org.positions.push({
              name: name,
              description: description
            })
          }
        }
      }
    }
  }

  return result
}

// 测试
const result = parseCensusOutput(testInput)
console.log('解析结果：')
console.log(JSON.stringify(result, null, 2))

console.log('\n组织列表：')
result.organizations.forEach(org => {
  console.log(`- ${org.name}`)
  if (org.members && org.members.length > 0) {
    console.log(`  成员 (${org.members.length}):`)
    org.members.forEach(m => {
      console.log(`    - ${m.name} [${m.position}]`)
    })
  }
  if (org.positions && org.positions.length > 0) {
    console.log(`  职位 (${org.positions.length}):`)
    org.positions.forEach(p => {
      console.log(`    - ${p.name}: ${p.description}`)
    })
  }
})

console.log('\n角色列表：')
result.roles.forEach(role => {
  console.log(`- ${role.name}${role.org ? ` (${role.org} - ${role.position})` : ''}`)
})
