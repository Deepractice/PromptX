#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const v8 = require('v8');

async function debugSemantic() {
  const semanticPath = path.join(process.env.HOME, '.promptx/cognition/sean/semantic.bin');
  
  console.log('检查语义网络文件:', semanticPath);
  
  if (await fs.pathExists(semanticPath)) {
    const buffer = await fs.readFile(semanticPath);
    const data = v8.deserialize(buffer);
    
    console.log('\n=== 语义网络内容 ===');
    console.log('名称:', data.name);
    console.log('Schema 数量:', data.schemas ? data.schemas.length : 0);
    
    if (data.schemas && data.schemas.length > 0) {
      console.log('\n=== Schemas 详情 ===');
      data.schemas.forEach((schema, index) => {
        console.log(`\nSchema ${index + 1}: ${schema.name}`);
        console.log('  Cues 数量:', schema.cues ? schema.cues.length : 0);
        console.log('  外部连接:', schema.externalConnections);
        if (schema.cues && schema.cues.length > 0) {
          console.log('  Cues:');
          schema.cues.forEach(cue => {
            console.log(`    - ${cue.word} (连接: ${cue.connections.join(', ')})`);
          });
        }
      });
    }
    
    console.log('\n=== 原始数据结构 ===');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('文件不存在');
  }
}

debugSemantic().catch(console.error);