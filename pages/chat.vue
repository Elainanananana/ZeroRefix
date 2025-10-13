<template>
  <div class="page">
    <!-- 左側側欄 -->
    <div class="header">
      <div class="JobButton">
        <button class="pill">職缺資訊</button>
      </div>
    </div>
    <div class="chat">
      <!-- 對話內容 -->
      <div class="messages">
        <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
          <p v-for="(p, j) in m.content.split('\n')" :key="j">{{ p }}</p>
          <div class="actions" v-if="m.role === 'done'">
            <button class="btn primary">前往申辦流程圖</button>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="inputWrap">
        <input v-model="draft" class="input" placeholder="輸入訊息…" @keydown.enter="send" />
        <button class="iconBtn" @click="send" aria-label="送出">
          <!-- 簡單放個放大鏡/送出圖示 -->
          <img src="~/assets/up-lg-svgrepo-com (3).svg" width="18" height="18" color="white" alt="送出" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const messages = ref([
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

function getAutoReply(text) {
  return '我收到囉～不管你說什麼我都會回覆你 😎'
}
</script>


<style scoped>
.page {
  background: #ffffff;
  color: #0f172a;
  /* 深藍灰 */
}

.header {
  width: 100vw;
  padding: 20px;
}

.JobButton {
  padding: 16px 12px;
}

.pill {
  width: 120px;
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: #0ea5a4;
  /* teal-500-ish */
  color: #fff;
  font-weight: 600;
  cursor: default;
}

/* 內容區 */
.chat {
  width: 100vw;
  display: flex;
  justify-content: center;
}

/* 對話訊息 */
.messages {
  width: 55%;
  padding-top: 20px;
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
  color: #111827;
  /* 深灰，靠左 */
  text-align: left;
}

.msg.user {
  color: #0ea5a4;
  /* 青綠，靠右 */
  text-align: right;
  margin-left: auto;
}

/* 底部操作列 */
.footer {
  position: absolute;
  bottom: 20px;
  width: 100vw;
  display: flex;
  justify-content: center;
  padding: 12px 20px;
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

.btn.primary {
  border: 1px solid #0ea5a4;
  color: #ffffff;
  background: #0ea5a4;
}

/* 輸入框 */
.inputWrap {
  width: 55vw;
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
</style>