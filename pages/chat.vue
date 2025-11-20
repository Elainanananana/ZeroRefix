<template>
  <div class="page">
    <!-- 頂部 -->
    <div class="header">
      <div class="JobButton">
        <NuxtLink to="/jobs" class="pill">職缺資訊</NuxtLink>
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
  '請問您是什麼時候受傷的呢？',
  '好的，10月10號受傷的，\n\n請問這段期間公司有照常發薪水嗎？還是只有部分薪？\n另外您計畫約什麼時候復工呢？',
  '了解，您在受傷期間是取得部分薪資，並且已經10月20號復工，\n\n請問你事後有前往就醫取得診斷證明嗎?有住院嗎?',
  '收到，已取得診斷證明，並且有住院，\n\n請問住院時醫生是否評估在住院期間無法自理呢?',
  '太好了，這樣可以一併申請住院照護補助，\n\n另外想請您補充一下當時的工作內容是什麼、受傷的地點大概在哪裡、以及發生的時間？',
  '了解，您是在倉庫理貨、上架、包裝、搬運，在倉庫A區走道受傷，時間是早上10點，\n\n請問是怎麼受傷的呢?',
  '請問發生的地址是在那裡呢?是處於公出的情況嗎?\n並且在發生當下是否接觸化學物質?',
  '太好了，那您基本符合職災補助申請資格！\n我會根據您提供的資訊，產生預填文件與申請流程圖，\n並整理需要準備的文件與注意事項給您。'
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
      // 根據對話內容生成實用的流程圖
      const chart = buildMermaidChart(messages.value)
      const eligibleBenefits = analyzeEligibleBenefits(messages.value)

      // 設定第一個符合的項目為預設選中
      if (eligibleBenefits.length > 0) {
        setSelected(eligibleBenefits[0].id)
      }

      // 設定動態生成的流程圖
      setChart(chart, {
        generatedAt: Date.now(),
        eligibleBenefits: eligibleBenefits
      })
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

// 文件詳細資訊
const documentDetails = {
  '就醫證明': {
    title: '就醫證明',
    description: '證明您因職災前往醫療院所就醫的證明文件',
    howToGet: [
      '向就診的醫療院所申請',
      '通常需要提供身分證、健保卡',
      '費用約 100-200 元',
      '當天或隔天即可取得'
    ],
    tips: '建議在就醫當天就申請，避免後續遺失'
  },
  '診斷證明書': {
    title: '診斷證明書',
    description: '醫師開立的正式診斷證明，載明傷病情況',
    howToGet: [
      '向主治醫師申請',
      '需要詳細說明診斷結果',
      '費用約 200-500 元',
      '通常需要 1-3 個工作天'
    ],
    tips: '請醫師明確註記「職業災害」相關字樣'
  },
  '醫療收據': {
    title: '醫療收據',
    description: '所有相關醫療費用的收據或發票',
    howToGet: [
      '保留所有醫療費用收據',
      '包括掛號費、藥費、檢查費等',
      '確認收據上有醫療院所名稱',
      '影印備份避免遺失'
    ],
    tips: '建議用信封分類整理，方便後續申請'
  },
  '身分證影本': {
    title: '身分證影本',
    description: '申請人身分證正反面影本',
    howToGet: [
      '至便利商店或影印店影印',
      '確保影本清晰可讀',
      '正反面都要影印',
      '費用約 2-5 元'
    ],
    tips: '可多印幾份備用，其他申請也會用到'
  },
  '勞保投保資料': {
    title: '勞保投保資料',
    description: '證明您在職災發生時有勞保投保的資料',
    howToGet: [
      '向雇主或人資部門申請',
      '或至勞保局臨櫃查詢',
      '也可使用自然人憑證線上查詢',
      '通常當天即可取得'
    ],
    tips: '確認投保資料上的投保日期包含職災發生日'
  },
  '醫師診斷證明': {
    title: '醫師診斷證明',
    description: '醫師開立的休養建議證明',
    howToGet: [
      '向醫師申請休養證明',
      '說明需要請假的天數',
      '費用約 200-300 元',
      '當天或隔天可取得'
    ],
    tips: '請醫師明確註記建議休養的天數'
  },
  '休養證明': {
    title: '休養證明',
    description: '醫師建議休養的證明文件',
    howToGet: [
      '向醫師申請',
      '說明無法工作的原因',
      '包含建議休養期間',
      '費用約 200-500 元'
    ],
    tips: '如需要延長休養，記得重新申請證明'
  },
  '薪資證明': {
    title: '薪資證明',
    description: '證明您薪資水準的資料',
    howToGet: [
      '向雇主申請薪資證明',
      '包含近 6 個月薪資',
      '或提供薪資條影本',
      '通常當天可取得'
    ],
    tips: '確認薪資證明與實際投保薪資一致'
  },
  '請假證明': {
    title: '請假證明',
    description: '向雇主請假的證明文件',
    howToGet: [
      '填寫公司請假單',
      '附上醫師診斷證明',
      '經主管核准',
      '保留核准後的請假單'
    ],
    tips: '請假單要明確註記「職業災害」'
  },
  '失能診斷書': {
    title: '失能診斷書',
    description: '醫師評估失能程度的診斷證明',
    howToGet: [
      '向專科醫師申請',
      '需要詳細功能評估',
      '費用約 500-1000 元',
      '通常需要 3-7 個工作天'
    ],
    tips: '建議找有失能評估經驗的醫師'
  },
  '功能評估報告': {
    title: '功能評估報告',
    description: '專業評估失能功能的詳細報告',
    howToGet: [
      '至醫院復健科申請',
      '進行專業功能評估',
      '費用約 1000-2000 元',
      '通常需要 1-2 週'
    ],
    tips: '評估報告是失能給付的重要依據'
  },
  '醫療歷程': {
    title: '醫療歷程',
    description: '完整的醫療治療記錄',
    howToGet: [
      '向各就診醫院申請',
      '包含急診、門診、住院記錄',
      '費用依醫院規定',
      '通常需要 3-5 個工作天'
    ],
    tips: '建議按時間順序整理醫療記錄'
  }
}

// 根據對話內容分析符合的申請項目
function analyzeEligibleBenefits(history) {
  const userMessages = history.filter(m => m.role === 'user').map(m => m.content.toLowerCase())
  const allText = userMessages.join(' ')

  const benefits = []

  // 分析是否符合各項申請條件
  if (allText.includes('燙傷') || allText.includes('受傷') || allText.includes('醫療')) {
    benefits.push({
      id: 'medical',
      name: '災保醫療給付',
      deadline: '事故發生後 30 天內',
      documents: [
        { name: '就醫證明', details: documentDetails['就醫證明'] },
        { name: '診斷證明書', details: documentDetails['診斷證明書'] },
        { name: '醫療收據', details: documentDetails['醫療收據'] },
        { name: '身分證影本', details: documentDetails['身分證影本'] },
        { name: '勞保投保資料', details: documentDetails['勞保投保資料'] }
      ],
      steps: [
        '向雇主通報職災',
        '取得醫療證明文件',
        '填寫申請書',
        '送件至勞保局',
        '等待審核結果'
      ]
    })
  }

  if (allText.includes('請假') || allText.includes('休養') || allText.includes('無法工作')) {
    benefits.push({
      id: 'sick',
      name: '災保傷病給付及照護補助',
      deadline: '請假開始後 30 天內',
      documents: [
        { name: '醫師診斷證明', details: documentDetails['醫師診斷證明'] },
        { name: '休養證明', details: documentDetails['休養證明'] },
        { name: '薪資證明', details: documentDetails['薪資證明'] },
        { name: '請假證明', details: documentDetails['請假證明'] },
        { name: '勞保投保資料', details: documentDetails['勞保投保資料'] }
      ],
      steps: [
        '取得醫師休養證明',
        '向雇主請假',
        '準備薪資證明',
        '填寫申請書',
        '送件申請'
      ]
    })
  }

  if (allText.includes('失能') || allText.includes('永久') || allText.includes('功能受損')) {
    benefits.push({
      id: 'impair',
      name: '災保失能給付及照護補助',
      deadline: '醫療穩定後 2 年內',
      documents: [
        { name: '失能診斷書', details: documentDetails['失能診斷書'] },
        { name: '功能評估報告', details: documentDetails['功能評估報告'] },
        { name: '身分證影本', details: documentDetails['身分證影本'] },
        { name: '勞保投保資料', details: documentDetails['勞保投保資料'] },
        { name: '醫療歷程', details: documentDetails['醫療歷程'] }
      ],
      steps: [
        '醫療穩定後申請失能評估',
        '取得失能等級證明',
        '準備相關醫療文件',
        '填寫申請書',
        '送件審查'
      ]
    })
  }

  return benefits.length > 0 ? benefits : [{
    id: 'medical',
    name: '災保醫療給付',
    deadline: '事故發生後 30 天內',
    documents: [
      { name: '就醫證明', details: documentDetails['就醫證明'] },
      { name: '診斷證明書', details: documentDetails['診斷證明書'] },
      { name: '醫療收據', details: documentDetails['醫療收據'] },
      { name: '身分證影本', details: documentDetails['身分證影本'] },
      { name: '勞保投保資料', details: documentDetails['勞保投保資料'] }
    ],
    steps: [
      '向雇主通報職災',
      '取得醫療證明文件',
      '填寫申請書',
      '送件至勞保局',
      '等待審核結果'
    ]
  }]
}

// 計算具體日期
function calculateDates(baseDate = new Date()) {
  const today = new Date(baseDate)
  const formatDate = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

  return {
    day1: formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)), // 明天
    day3: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)), // 3天後
    day7: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)), // 7天後
    day14: formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)), // 14天後
    day21: formatDate(new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000)), // 21天後
    day30: formatDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)), // 30天後
    day45: formatDate(new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000)), // 45天後
  }
}

// 根據對話內容產生實用的申請流程圖
function buildMermaidChart(history) {
  const eligibleBenefits = analyzeEligibleBenefits(history)

  // 使用與 benefits.vue 相同的四個步驟流程圖
  return `flowchart TB
      A["1. 就醫診斷\n至醫療院所就醫治療\n請醫師開立「傷病診斷書」\n必須載明「住院期間需人照護」"] --> B["2. 編輯與下載申請文件\n下載「傷病給付及住院照護補助申請書」"]
      
      B --> C["3. 補充文件資訊\n填寫個人資料\n勾選入帳帳户類型\n貼上「存簿封面影本」於申請書指定處"]
      
      C --> D["4. 送件審核\n整合申辦文件與傷病診斷書\n送至勞保局審核"]

      classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
      class A,B,C,D step
    `
}

function goToBenefits() {
  // 根據對話內容生成實用的流程圖
  const chart = buildMermaidChart(messages.value)
  const eligibleBenefits = analyzeEligibleBenefits(messages.value)

  // 設定第一個符合的項目為預設選中
  if (eligibleBenefits.length > 0) {
    setSelected(eligibleBenefits[0].id)
  }

  // 設定動態生成的流程圖
  setChart(chart, {
    triggeredBy: 'button',
    eligibleBenefits: eligibleBenefits,
    generatedAt: Date.now()
  })

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
  padding: 13px 28px;
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
