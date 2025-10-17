<template>
  <div class="page">
    <!-- 頂部 -->
    <div class="header">
      <div class="JobButton">
        <button class="pill">職缺資訊</button>
      </div>
    </div>

    <!-- 對話區 -->
    <div class="chat">
      <div class="messages" ref="messagesEl">
        <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
          <!-- 輸入中(loading) 效果 -->
          <template v-if="m.typing">
            <div class="typing">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </template>

          <!-- 一般訊息 -->
          <template v-else>
            <p v-for="(p, j) in m.content.split('\n')" :key="j">{{ p }}</p>

            <!-- 最後一段顯示按鈕 -->
            <div class="actions" v-if="m.isFinal">
              <button class="btn primary" @click="goToBenefits">前往申辦流程圖</button>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div class="composer" :class="{ centered: isIntro, pinned: !isIntro }">
      <div v-if="isIntro" class="isIntroTitle">你遇到什麼狀況？</div>
      <div class="inputWrap">
        <input v-model="draft" class="input" placeholder="輸入訊息…" @keydown.enter.prevent="onEnter"
          @compositionstart="isComposing = true" @compositionend="isComposing = false" />
        <button class="iconBtn" @click="send" :disabled="isBusy" aria-label="送出">
          <img src="~/assets/up-lg-svgrepo-com (3).svg" width="18" height="18" alt="送出" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMermaidChart } from '~/composables/useMermaidChart'

const messages = ref([])
const draft = ref('')

const isIntro = ref(true)           // 尚未「送出」任何訊息 → 輸入框置中
const scriptStep = ref(0)           // 目前要送出的腳本段落索引（0→1→2）
const messagesEl = ref(null)
const isComposing = ref(false)      // 中文輸入法組字狀態（避免誤送）
const router = useRouter()
const { setChart, setSelected } = useMermaidChart()

// 三段腳本，逐步等使用者回覆才送下一段
const scriptedReplies = [
  '了解，這可能符合職業災害的情況，我會進一步協助您確認申請資格並準備後續資料。\n首先，請問這起燙傷事件是幾點幾分發生的呢？',
  '好的，您是在昨天9/15號下午兩點半發生燙傷\n請問您事發後是否有前往就醫？若有的話，是去哪一間醫院？是否有拿到診斷證明呢？',
  '太好了，那您基本符合職災補助申請資格！\n我會根據您提供的資訊，產生預填文件與申請流程圖，並整理需要準備的文件與注意事項給您。'
]
const isBusy = computed(() => messages.value.some(m => m.typing))
const canSend = computed(() => !isBusy.value && draft.value.trim().length)

function onEnter() {
  if (isBusy.value) return
  if (isComposing.value) return
  if (!draft.value.trim()) return
  send()
}

function send() {
  if (isBusy.value) return // 忙碌時不送
  const text = draft.value.trim()
  if (!text) return

  // 推入使用者訊息
  messages.value.push({ role: 'user', content: text })
  draft.value = ''
  scrollToBottom()

  // 首次「送出」：輸入列從置中 → 動畫移動到底部，並回覆第 1 段
  if (isIntro.value) {
    isIntro.value = false
    replyForCurrentStep() // 送出 step 0
    return
  }

  // 腳本流程中：每次使用者送出一句 → 送出下一段
  if (scriptStep.value > 0 && scriptStep.value < scriptedReplies.length) {
    replyForCurrentStep() // 送出 step 1 或 step 2
    return
  }

  // 腳本走完後的預設回覆（可自行改邏輯）
  queueTypingAndReply('我收到囉～不管你說什麼我都會回覆你 😎')
}

// 根據目前 scriptStep 送出對應腳本訊息
function replyForCurrentStep() {
  const idx = scriptStep.value
  if (idx >= scriptedReplies.length) return

  const text = scriptedReplies[idx]
  const isFinal = idx === scriptedReplies.length - 1
  queueTypingAndReply(text, isFinal, () => {
    scriptStep.value = idx + 1
  })
}

/**
 * 插入一則 typing，再「以索引整筆替換」為實際訊息；
 * 這種做法能 100% 觸發 Vue 的陣列變更偵測，避免第一次卡在 loading。
 */
function queueTypingAndReply(text, isFinal = false, done) {
  const index = messages.value.length
  messages.value.push({ role: 'assistant', typing: true, step: scriptStep.value })
  scrollToBottom()

  const delay = typingDelay(text, scriptStep.value)

  setTimeout(() => {
    // 以索引直接替換（避免只改物件屬性導致第一次不刷新）
    messages.value[index] = {
      role: 'assistant',
      content: text,
      isFinal
    }
    if (isFinal) {
      // 只記錄使用者選擇的申辦類型（示例先固定 medical，可依對話解析）
      setSelected('medical')
      // 若你仍想在某些情況覆蓋圖，保留 setChart；否則可不設定，將沿用 benefits.vue 內完整圖
      setChart('', { generatedAt: Date.now() })
    }
    nextTick().then(scrollToBottom)
    if (done) setTimeout(done, 240) // 段落間微停頓
  }, delay)
}

// 動態計算輸入中延遲（第一段稍慢，但不會卡很久）
function typingDelay(text, stepIndex) {
  const isFirst = stepIndex === 0
  const base = isFirst ? 900 : 700   // 調回較合理起跳時間
  const perChar = isFirst ? 45 : 35  // 依字數增加時間
  const max = 2800                   // 總延遲上限，避免「看起來像卡住」
  return Math.min(max, base + text.length * perChar)
}

function scrollToBottom() {
  nextTick(() => {
    const el = messagesEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// 依對話內容產生 Mermaid 圖（示範版，可替換為你的規則引擎）
function buildMermaidChart(history) {
  // 擷取關鍵資訊（此處示範僅取用者第一則與系統最後結論）
  const firstUser = history.find(m => m.role === 'user')?.content || '描述職災'
  // 期限示例，可依實際規則動態計算
  const deadline = '30 天內提出申請'

  return `flowchart TB
    A["了解情況：${firstUser}"] --> B["蒐集就醫/診斷證明"]
    B --> C["檢附投保/薪資等文件"]
    C --> D["向主管機關/勞保局送件"]
    D --> E["等待審查與結果"]
    E --> F["若通過：撥付給付"]
    subgraph 時間線與注意事項
      D --> G["期限：${deadline}"]
      B --> H["文件需齊全且清晰"]
    end
    classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
    class A,B,C,D,E,F,G,H step
  `
}

function goToBenefits() {
  // 若尚未產出圖，保底再生成一次
  setSelected('medical')
  setChart('', { triggeredBy: 'button' })
  router.push('/benefits')
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #ffffff;
  color: #0f172a;
  position: relative;
  padding-bottom: 120px;
  /* 預留輸入列高度，避免被遮住 */
}

/* 頂部 */
.header {
  width: 100%;
  padding: 10px 20px;
}

.JobButton {
  padding: 12px;
}

.isIntroTitle {
  padding: 10px 2px;
  color: #008E73;
  font-size: 26px;
  font-weight: bolder;
}

.pill {
  width: 120px;
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: #008E73;
  color: #fff;
  font-weight: 600;
  cursor: default;
}

/* 內容區 */
.chat {
  width: 100%;
  display: flex;
  justify-content: center;
}

.messages {
  width: 60%;
  padding-top: 20px;
  overflow: auto;
  height: auto;
}

.msg {
  max-width: 90%;
  line-height: 1.7;
  margin: 20px 0;
  white-space: pre-wrap;
}

/* 助手訊息（靠左） */
.msg.assistant {
  color: #111827;
  text-align: left;
  margin-right: auto;
}

/* 使用者訊息（靠右） */
.msg.user {
  color: #008E73;
  text-align: right;
  margin-left: auto;
}

/* 輸入中動畫（放慢一點） */
.typing {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 22px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #9ca3af;
  display: inline-block;
  animation: blink 1.4s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: .25s;
}

.dot:nth-child(3) {
  animation-delay: .5s;
}

@keyframes blink {

  0%,
  80%,
  100% {
    opacity: .2;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

/* 按鈕列 */
.actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.btn {
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  border: 1px solid #008E73;
  color: #ffffff;
  background: #008E73;
}

/* ===== 輸入列（置中→滑到底部） ===== */
.composer {
  position: fixed;
  left: 50%;
  width: 60vw;
  will-change: top, transform;
  transition: top 1000ms cubic-bezier(.22, .61, .36, 1),
    transform 1000ms cubic-bezier(.22, .61, .36, 1);
}

/* 置中：top 在視窗 50vh，transform 讓自己上移半個高度 */
.composer.centered {
  top: 50vh;
  transform: translate(-50%, -50%);
}

/* 底部：top 在視窗底部往上 20px，transform 上移整個高度，等效於貼底留 20px */
.composer.pinned {
  top: calc(100vh - 20px);
  transform: translate(-50%, -100%);
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
  background: #fff;
}

.input:focus {
  border-color: #008E73;
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
  background: #008E73;
  color: #fff;
  cursor: pointer;
}

.iconBtn:hover {
  filter: brightness(0.95);
}

.iconBtn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: .7;
  filter: none;
}

.iconBtn:disabled:hover {
  filter: none;
}
</style>
