<template>
    <div class="page">
       <!-- 左側側欄 -->
      <aside class="sidebar">
        <button class="pill">職缺資訊</button>
      </aside>
      
  
      <main class="chat">
          <header class="header">
          <!-- 可放標題或流程狀態 -->
        </header>
  
        <!-- 對話內容 -->
        <section class="messages">
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="msg"
            :class="m.role"
          >
            <p v-for="(p, j) in m.content.split('\n')" :key="j">{{ p }}</p>
          </div>
        </section>
  
        <!-- 底部操作列 -->
        <footer class="footer">
          <div class="actions">
            <button class="btn outline">沒有</button>
            <button class="btn primary">我還想補充</button>
          </div>
  
          <div class="inputWrap">
            <input
              v-model="draft"
              class="input"
              placeholder="輸入訊息…"
              @keydown.enter="send"
            />
            <button class="iconBtn" @click="send" aria-label="送出">
              <!-- 簡單放個放大鏡/送出圖示 -->
              <img src="~/assets/up-lg-svgrepo-com (3).svg" width="18" height="18" color="white" alt="送出" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  </template>
  
  <script setup>
    import { ref } from 'vue'
  
    const messages = ref([
      {
        role: 'assistant',
        content: '嗨！我是你的小幫手，有什麼想聊的嗎？',
      },
    ])
  
    const draft = ref('')
  
  function send() {
    if (!draft.value.trim()) return
  
    // 推入使用者訊息
    messages.value.push({
      role: 'user',
      content: draft.value.trim(),
    })
  
    const userMessage = draft.value.trim()
    draft.value = ''
  
    // 模擬延遲回覆（像聊天機器人一樣）
    setTimeout(() => {
      // 這裡你可以改成任何想要的自動回覆邏輯
      const reply = getAutoReply(userMessage)
      messages.value.push({
        role: 'assistant',
        content: reply,
      })
    }, 600)
  }
  
  /** 自動回覆邏輯，可依需求修改 */
    function getAutoReply(text) {
    // 這裡可換成各種邏輯，例如：
    // if (text.includes('你好')) return '你好呀！'
    // if (text.includes('謝謝')) return '不客氣～'
    // return '這聽起來很有趣，請繼續說說！'
  
    // 目前版本：不論輸入什麼都固定回覆
      return '我收到囉～不管你說什麼我都會回覆你 😎'
  }
  </script>
  
  <style scoped>
  /* 版面 */
  *{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .page {
    display: grid;
    grid-template-columns: 160px 1fr;
    background: #ffffff;
    color: #0f172a; /* 深藍灰 */
  }
  
  /* 側欄 */
  .sidebar {
    padding: 16px 12px;
    border-right: 1px solid #e5e7eb;
  }
  .pill {
    width: 120px;
    padding: 10px 14px;
    border-radius: 999px;
    border: none;
    background: #0ea5a4; /* teal-500-ish */
    color: #fff;
    font-weight: 600;
    cursor: default;
  }
  
  /* 內容區 */
  .chat {
    display: grid;
    grid-template-rows: 32px 1fr auto;
    height: 100vh;
  }
  .header {
    border-bottom: 1px solid #e5e7eb;
  }
  
  /* 對話訊息 */
  .messages {
    flex: 1 !important;
    padding: 20px 28px;
    overflow: auto;
    height: auto;
  }
  .msg {
    max-width: 72ch;
    line-height: 1.7;
    margin: 10px 0 18px;
    white-space: pre-wrap;
  }
  .msg.assistant {
    color: #111827; /* 深灰，靠左 */
    text-align: left;
  }
  .msg.user {
    color: #0ea5a4; /* 青綠，靠右 */
    text-align: right;
    margin-left: auto;
  }
  
  /* 底部操作列 */
  .footer {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 16px;
    align-items: center;
    padding: 12px 20px;
    border-top: 1px solid #e5e7eb;
  }
  .actions {
    display: flex;
    gap: 10px;
  }
  .btn {
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn.outline {
    border: 1px solid #0ea5a4;
    color: #0ea5a4;
    background: #ffffff;
  }
  .btn.primary {
    border: 1px solid #0ea5a4;
    color: #ffffff;
    background: #0ea5a4;
  }
  
  /* 輸入框 */
  .inputWrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .input {
    width: 100%;
    height: 44px;
    padding: 0 44px 0 14px;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    outline: none;
    font-size: 14px;
  }
  .input:focus {
    border-color: #0ea5a4;
    box-shadow: 0 0 0 3px rgba(14, 165, 164, 0.12);
  }
  .iconBtn {
    position: absolute;
    right: 8px;
    height: 36px;
    width: 36px;
    border: none;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: #0ea5a4;
    color: #fff;
    cursor: pointer;
  }
  .iconBtn:hover {
    filter: brightness(0.95);
  }
  
  /* 小螢幕調整 */
  @media (max-width: 900px) {
    .page { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .footer { grid-template-columns: 1fr; }
  }
  </style>