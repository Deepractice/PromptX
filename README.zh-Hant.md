<div align="center">
  <img src="assets/logo/Creative PromptX Duck Logo 4.svg" alt="PromptX Logo" width="120" height="120"/>
  <h1>PromptX · 領先的AI上下文工程平台</h1>
  <h2>✨ Chat is all you need - 革命性互動設計，讓AI Agent秒變行業專家</h2>
  <p><strong>核心能力：</strong>AI角色創造平台 | 智慧工具開發平台 | 認知記憶系統</p>
  <p>基於MCP協定，一行指令為Claude、Cursor等AI應用注入專業能力</p>

  <!-- Badges -->
  <p>
    <a href=" "><img src="https://img.shields.io/github/stars/Deepractice/PromptX?style=social" alt="Stars"/></a>
    <a href="https://www.npmjs.com/package/@promptx/cli"><img src="https://img.shields.io/npm/v/@promptx/cli?color=orange&logo=npm" alt="npm version"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/PromptX?color=blue" alt="License"/></a>
    <img src="https://komarev.com/ghpvc/?username=PromptX&label=Repository%20views&color=0e75b6&style=flat" alt="Repository Views"/>
  </p>

  <p>
    <a href="README.zh-Hans.md">简体中文</a> | 
    <strong><a href="README.zh-Hant.md">繁體中文</a></strong> | 
    <a href="README.md">English</a> | 
    <a href="https://github.com/Deepractice/PromptX/issues">Issues</a>
  </p>
</div>

---

## 💬 Chat is All you Need - 自然對話，瞬間專業

### ✨ 三步體驗 PromptX 魔力

#### 🔍 **第一步：發現專家**
```
使用者：「我要看看有哪些專家可以用」
AI：    立即展示23個可用角色，從產品經理到架構師應有盡有
```

#### ⚡ **第二步：召喚專家**  
```
使用者：「我需要一個產品經理專家」
AI：    瞬間變身專業產品經理，獲得完整專業知識和工作方法
```

#### 🎯 **第三步：專業對話**
```
使用者：「幫我重新設計產品頁面」
AI：    以專業產品經理身份，提供深度產品策略建議
```

### 🚀 為什麼這是革命性的？

**❌ 傳統方式：**
- 學習複雜指令語法
- 記住各種參數配置
- 擔心說錯話導致失效

**✅ PromptX方式：**
- 像和真人專家聊天一樣自然
- 想怎麼說就怎麼說，AI理解你的意圖
- 專家狀態持續對話期間保持有效

### 💡 核心理念

> **把AI當人，不是軟體**
> 
> 不需要「正確指令」，只需要自然表達。AI會理解你想要什麼專家，並瞬間轉換身份。

---

## ⚡ 立即開始 - 三種方式任選

### 🎯 方式一：PromptX 客戶端（推薦）
**適合所有使用者 - 一鍵啟動，零配置**

1. **[下載客戶端](https://github.com/Deepractice/PromptX/releases)** - 支援 Windows、Mac、Linux
2. **啟動HTTP服務** - 打開客戶端，自動運行MCP伺服器
3. **配置AI應用** - 將以下配置添加到你的Claude/Cursor等AI工具：
   ```json
   {
     "mcpServers": {
       "promptx": {
         "type": "streamable-http",
         "url": "http://127.0.0.1:5203/mcp"
       }
     }
   }
   ```

4. **開始對話** - 在AI應用中說「我要看看有哪些專家」

✅ 無需技術背景 ✅ 視覺化管理 ✅ 自動更新

### 🔧 方式二：直接運行（開發者）
**有Node.js環境的開發者可以直接使用：**

```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["-y", "@promptx/mcp-server"]
    }
  }
}
```

### 🐳 方式三：Docker（生產就緒）
**使用Docker部署PromptX到生產環境：**

```bash
docker run -d -p 5203:5203 -v ~/.promptx:/root/.promptx deepracticexs/promptx:latest
```

📚 **[完整Docker文檔 →](./docker/README.md)**

---

## 🎨 **女媧創造工坊 - 讓每個人都成為AI角色設計師**

<div align="center">
  <img src="assets/logo/nuwa-logo-backgroud.jpg" alt="女媧創造工坊" width="120" style="border-radius: 50%; margin: 15px 0 25px 0;">
</div>

#### **💫 革命性元提示詞技術 - 從想法到現實，只需2分鐘**

你有沒有想過：如果我能為特定工作場景客製一個專業AI助手會怎樣？**女媧基於元提示詞技術讓這個想法變成現實。**

> *「女媧不是普通的角色模板，而是會思考的元提示詞引擎 - 理解你的需求，生成專業提示詞，創造真正的AI專家。」*

#### **🎯 元提示詞核心原理**

- **🧠 需求分析**: 女媧元提示詞深度理解你的場景需求和專業要求
- **📝 提示詞生成**: 自動建構符合DPML標準的完整提示詞架構
- **🎭 角色具化**: 將抽象需求轉化為具體可執行的AI專家角色
- **⚡ 即時部署**: 生成的提示詞立即轉換為可啟動的PromptX角色
- **🔄 持續優化**: 基於使用回饋，元提示詞不斷進化

#### **✨ 使用場景範例**

<div align="center">

| 🎯 **使用者需求** | ⚡ **女媧生成** | 🚀 **立即可用** |
|---|---|---|
| 👩‍💼 「我需要一個懂小紅書行銷的AI助手」 | 小紅書行銷專家角色 | `啟動小紅書行銷專家` |
| 👨‍💻 「我想要一個Python非同步程式設計專家」 | Python非同步程式設計導師角色 | `啟動Python非同步程式設計導師` |
| 🎨 「給我一個UI/UX設計顧問」 | UI/UX設計專家角色 | `啟動UI/UX設計專家` |
| 📊 「需要一個資料分析師助手」 | 資料分析專家角色 | `啟動資料分析專家` |

</div>

#### **🎪 4步創造專屬AI助手**

```
使用者：「我要女媧幫我創建一個小紅書行銷專家」
女媧：立即理解需求，詢問具體場景和要求

使用者：「主要幫我寫小紅書文案，分析熱點，制定推廣策略」  
女媧：2分鐘內創建完整的小紅書行銷專家角色

使用者：「啟動小紅書行銷專家」
AI：   瞬間變身專業小紅書行銷專家，提供專業建議
```

#### **🌟 元提示詞的技術突破**

女媧代表了提示詞工程的重大突破 - **從靜態模板到動態生成**：

- **🎯 智慧理解**: 元提示詞具備理解能力，不只是文字比對，而是語義分析
- **📝 動態生成**: 根據需求即時建構提示詞，每個角色都是量身訂製
- **🧠 結構化輸出**: 確保生成的角色符合DPML標準，保證專業品質
- **🔄 自我進化**: 元提示詞透過使用回饋不斷優化生成策略

---

<div align="center">

**由 [Deepractice 深度實踐](https://github.com/Deepractice) 出品**

*讓AI成為你的專業夥伴*

---

🌐 [官網](https://deepractice.ai) | 🔧 [GitHub](https://github.com/Deepractice) | 📚 [文檔中心](https://docs.deepractice.ai) | 💬 [論壇](https://x.deepractice.ai) | 🚀 [中轉站服務](https://router.deepractice.ai)

---

## ⭐ **Star成長趨勢**

[![Star History Chart](https://api.star-history.com/svg?repos=Deepractice/PromptX&type=Date)](https://star-history.com/#Deepractice/PromptX&Date)

---

### 📱 聯絡作者

<img src="assets/qrcode.jpg" alt="添加開發者微信" width="200">

**掃碼添加開發者微信，獲取技術支援與合作洽談**

</div>