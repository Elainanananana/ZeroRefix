<template>
  <div class="benefit-page">
    <!-- 頂部抬頭：左側兩顆白色圓角按鈕 -->
    <div class="header">
      <div class="JobButton">
        <NuxtLink to="/jobs" class="pill">職缺資訊</NuxtLink>
        <NuxtLink to="/chat" class="pill" style="color: #008E73; background-color: white;">重新諮詢</NuxtLink>
      </div>
    </div>

    <div class="grid">
      <!-- 左欄：白底卡片 + 綠色標題 + 選中項整塊綠底 -->
      <aside class="left">
        <!-- 符合 -->
        <section class="left-card">
          <div class="left-title ok">
            <span class="left-icon ok">✔</span>
            <span>符合申請資格項目</span>
          </div>
          <ul class="left-list">
            <li v-for="b in eligibleList" :key="b.id" class="left-item" :class="{ active: b.id === selected }"
              @click="selected = b.id">
              {{ b.name }}
            </li>
          </ul>
        </section>

        <!-- 不符合 -->
        <section class="left-card">
          <div class="left-title ng">
            <span class="left-icon ng">✖</span>
            <span>不符合申請資格項目</span>
          </div>
          <ul class="left-list">
            <li v-for="b in notEligibleList" :key="b.id" class="left-item ">
              {{ b.name }}
            </li>
          </ul>
        </section>
      </aside>

      <!-- 中欄：流程 -->
      <main class="center ">
        <h2 class="flow-title">{{ current.name }}申請流程</h2>
        <MermaidRenderer class="mmd" :chart="displayChart" />

        <div>
          <!-- 申請文件下載區 -->
          <button class="download-btn" @click="downloadApplicationFile()">
            <span class="flex gap-2">
              <img src="/download.png" alt="download" class="download-icon" width="20">
              <p>下載 <b>{{ currentFormTitle }}</b></p>
            </span>
          </button>
        </div>
        <!-- 文件詳細資訊區域（固定顯示；內部判斷是否有清單） -->
        <div class="document-section">
          <h3>所需文件詳細說明</h3>
          <div v-if="documentDetails && documentDetails.length" class="document-grid">
            <button v-for="doc in documentDetails" :key="doc.name" class="document-btn" @click="showDocumentModal(doc)">
              📄 {{ doc.name }}
            </button>
          </div>
          <p v-else class="empty-hint">尚未有文件清單</p>
        </div>

        <div class="institution-buttons">
          <button class="institution-btn" @click="showApplicationInstitutions()">
            🏢 取得最近可就診機構資訊
          </button>
          <button class="institution-btn" @click="showSubmissionInstitutions()">
            📮 取得最近繳交機構資訊
          </button>
        </div>
      </main>

      <!-- 右欄：檢核表 -->
      <aside class="right">
        <ul class="checklist">
          <li v-for="c in checks" :key="c.id" :class="c.status" class="check">
            <span class="left-icon ok" v-if="c.status === 'ok'">✔</span>
            <span class="left-icon ng" v-if="c.status === 'error'"> </span>
            <span class="text">{{ c.label }}</span>
          </li>
        </ul>
      </aside>
    </div>

    <!-- 文件詳細資訊模態框 -->
    <Teleport to="body">
      <div v-if="selectedDocument" class="modal-root">
        <!-- 遮罩 -->
        <div class="modal-backdrop" @click="selectedDocument = null"></div>

        <!-- 面板 -->
        <div class="modal-panel">
          <div class="modal-header">
            <h3 style="margin:0">{{ selectedDocument.title }}</h3>
            <button class="close-btn" @click="selectedDocument = null">✕</button>
          </div>

          <div class="modal-content">
            <p class="description">{{ selectedDocument.description }}</p>

            <h4>如何取得：</h4>
            <ul class="how-to-get">
              <li v-for="step in selectedDocument.howToGet" :key="step">{{ step }}</li>
            </ul>

            <div class="tips">
              <strong>💡 小提醒：</strong>
              <p>{{ selectedDocument.tips }}</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn primary" @click="selectedDocument = null">知道了</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 機構資訊模態框 -->
    <Teleport to="body">
      <div v-if="institutionModal" class="modal-root">
        <!-- 遮罩 -->
        <div class="modal-backdrop" @click="institutionModal = null"></div>

        <!-- 面板 -->
        <div class="modal-panel institution-modal">
          <div class="modal-header">
            <h3 style="margin:0">{{ institutionModal.title }}</h3>
            <button class="close-btn" @click="institutionModal = null">✕</button>
          </div>

          <div class="modal-content">
            <div class="institution-list">
              <div v-for="institution in institutionModal.institutions" :key="institution.name"
                class="institution-item">
                <div class="institution-info">
                  <h4>{{ institution.name }}</h4>
                  <p class="address">📍 {{ institution.address }}</p>
                  <p class="phone">📞 {{ institution.phone }}</p>
                  <p class="hours">🕒 {{ institution.hours }}</p>
                  <p class="distance">🚶‍♂️ 距離約 {{ institution.distance }}</p>
                </div>
                <div class="institution-actions">
                  <a :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(institution.address)}`"
                    target="_blank" class="btn map-btn">
                    🗺️ 開啟地圖
                  </a>
                  <a :href="`tel:${institution.phone}`" class="btn call-btn">
                    📞 撥打電話
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn primary" @click="institutionModal = null">關閉</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MermaidRenderer from '~/components/MermaidRenderer.vue'
import { useMermaidChart } from '~/composables/useMermaidChart'

type Item = { id: string; name: string }
const open = ref(false)
const eligibleList = ref<Item[]>([
  { id: 'medical', name: '傷病給付+住院治療期間照護補助' },
  { id: 'sick', name: '災保傷病給付及照護補助' },
  // { id: 'impair', name: '災保失能給付及照護補助' }
])
const notEligibleList = ref<Item[]>([
  { id: 'x1', name: '失能照護補助' },
  { id: 'x2', name: '本人死亡給付' }
])

const charts: Record<string, string> = {
  medical: `
    flowchart TB
      A["1. 就醫診斷\n至醫療院所就醫治療\n請醫師開立「傷病診斷書」\n必須載明「住院期間需人照護」"] --> B["2. 編輯與下載申請文件\n下載「傷病給付及住院照護補助申請書」"]
      
      B --> C["3. 補充文件資訊\n填寫個人資料\n勾選入帳帳户類型\n貼上「存簿封面影本」於申請書指定處"]
      
      C --> D["4. 送件審核\n整合申辦文件與傷病診斷書\n送至勞保局審核"]

      classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
      class A,B,C,D step
  `,
  sick: `
    flowchart TB
      A["1. 編輯與下載申請文件\n下載【<b>災保傷病給付及照護補助申請書</b>】\n由投保單位確認加蓋章"] --> B["2. 準備申請所需文件\n醫師診斷書(須載明「受職業災害」及「住院期間需人照護」)\n若為上下班或公出途中事故，需檢附「事故陳述書」\n相關證明：雇主或目擊者證明、薪資出勤紀錄等"]
      
      B --> C["3. 補充文件資訊\n填寫個人基本資料、匯款帳戶\n並貼上「存摺封面影本」於申請書指定處"]
      
      C --> D["4. 送件審核\n整合全部文件與診斷書\n臨櫃或郵寄至勞保局辦事處\n待審核與核發補助"]

      classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
      class A,B,C,D step
  `,
  impair: `
    flowchart TB
      A["1. 醫療穩定"] --> B["提出失能等級評估申請"]
      B --> C{等級是否達標？}
      C -- 達標 --> D["蒐集身分/就保/醫療文件"] --> E["送件審查"] --> F["通知結果與給付"]
      C -- 未達標 --> G["復健/再評估/其他資源"]

      subgraph 補充
        B --> T1["評估需附醫療證明與功能量表"]
      end
      classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
      class A,B,C,D,E,F,G,T1 step
  `
}
const selected = ref<keyof typeof charts>('medical')
const mermaidChart = useMermaidChart()
const { chart: chartFromChat, selectedId, meta } = mermaidChart
if (selectedId?.value && (selectedId.value in charts)) {
  selected.value = selectedId.value as keyof typeof charts
}
// 實際顯示的圖：
// 1) 若聊天帶入的圖有指定 selectedId 且與目前選擇一致，優先顯示該圖
// 2) 否則顯示本頁內建圖，確保左側切換可即時更新
const displayChart = computed(() => {
  const incoming = chartFromChat.value as string | undefined
  const incomingFor = (selectedId?.value as any) || null
  if (incoming && incomingFor && incomingFor === selected.value) {
    return incoming
  }
  return charts[selected.value]
})

// 從聊天頁面傳來的文件詳細資訊
const documentDetails = computed(() => {
  const metaData = meta.value as any
  return metaData?.eligibleBenefits?.[0]?.documents || null
})

// 選中的文件詳細資訊
const selectedDocument = ref<any>(null)

// 機構資訊模態框
const institutionModal = ref<any>(null)

const current = computed(() => ({
  id: selected.value,
  name: eligibleList.value.find((x: Item) => x.id === selected.value)?.name ?? '災保醫療給付',
  chart: charts[selected.value]
}))

function toast(Data: string) {
  console.log(Data)
}

function showDocumentModal(doc: any) {
  selectedDocument.value = doc.details
}

// 申請機構資料
const applicationInstitutions = [
  {
    name: '勞動部勞工保險局台北市辦事處',
    address: '台北市中正區羅斯福路一段4號',
    phone: '02-2396-1266',
    hours: '週一至週五 08:30-17:30',
    distance: '500公尺'
  },
  {
    name: '台北市勞動檢查處',
    address: '台北市中山區松江路65號',
    phone: '02-2596-9858',
    hours: '週一至週五 08:30-17:30',
    distance: '800公尺'
  },
  {
    name: '台北市政府勞動局',
    address: '台北市信義區市府路1號',
    phone: '02-2728-8889',
    hours: '週一至週五 08:30-17:30',
    distance: '1.2公里'
  }
]

// 繳交機構資料
const submissionInstitutions = [
  {
    name: '勞動部勞工保險局台北市辦事處',
    address: '台北市中正區羅斯福路一段4號',
    phone: '02-2396-1266',
    hours: '週一至週五 08:30-17:30',
    distance: '500公尺'
  },
  {
    name: '中華郵政台北郵局',
    address: '台北市中正區忠孝西路一段114號',
    phone: '02-2381-2131',
    hours: '週一至週五 08:30-17:30',
    distance: '600公尺'
  },
  {
    name: '台北車站郵局',
    address: '台北市中正區北平西路3號',
    phone: '02-2381-2131',
    hours: '週一至週五 08:30-17:30',
    distance: '700公尺'
  }
]

function showApplicationInstitutions() {
  institutionModal.value = {
    title: '附近可申請機構',
    institutions: applicationInstitutions
  }
}

function showSubmissionInstitutions() {
  institutionModal.value = {
    title: '附近可繳交機構',
    institutions: submissionInstitutions
  }
}

const checks = computed(() => {
  if (current.value.id === 'medical') {
    return [
      { id: 1, label: '已申請傷病診斷書', status: 'ok' },
      { id: 4, label: '申辦文件職災資訊已填寫完成', status: 'ok' },
      { id: 2, label: '申辦文件個人資料尚未填寫完成', status: 'error' },
      { id: 3, label: '申辦文件金融資料尚未填寫完成', status: 'error' },
    ]
  }
  if (current.value.id === 'sick') {
    return [
      { id: 1, label: '醫師休養證明', status: 'ok' },
      { id: 2, label: '請假證明已核章', status: 'ok' },
      { id: 3, label: '薪資資料待核對', status: 'error' },
    ]
  }
  return [
    { id: 1, label: '失能等級尚未評估', status: 'error' },
    { id: 2, label: '身分/就保文件齊全', status: 'ok' }
  ]
})

// 下載申請文件（Word 檔，放在 public/forms 下）
const formDocxMap: Record<string, string> = {
  medical: '/forms/勞工職業災害保險傷病給付(住院治療期間照護補助)申請書及給付(補助)收據.docx',
  sick: '/forms/災保傷病給付及照護補助申請書.docx',
}

// 下載按鈕標題
const formTitleMap: Record<string, string> = {
  medical: '傷病給付及住院照護補助申請書',
  sick: '災保傷病給付及照護補助申請書'
}
const currentFormTitle = computed(() => formTitleMap[selected.value] || formTitleMap.medical)

function downloadApplicationFile() {
  const url = formDocxMap[selected.value] || formDocxMap.medical
  const anchor = document.createElement('a')
  anchor.href = url
  // 讓瀏覽器以下載處理，若瀏覽器阻擋，仍會在新分頁開啟
  anchor.download = ''
  anchor.target = '_blank'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
</script>

<style scoped>
:root {
  --fs-sm: 15px;
  --fs-md: 16.5px;
  --fs-lg: 18px;
  --fs-xl: 20px;

  --teal: #008E73;
  --green: #10b981;
  --red: #ef4444;
  --amber: #f59e0b;
  --slate-900: #0f172a;
  --slate-700: #334155;
  --slate-300: #cbd5e1;
  --slate-200: #e5e7eb;
  --bg: #f8fafc;
  --white: #fff;
}

.header {
  width: 100%;
  padding: 10px 20px;
  background-color: #008E73;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
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
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

/* 頁面與頂欄 */
.benefit-page {
  background: var(--bg);
  min-height: 100vh;
  color: var(--slate-900);
}

/* 版心 */
.grid {
  width: 90vw;
  margin: 16px auto;
  padding: 0 16px;
  display: flex;
}

/* 中/右卡片外框 */
.card {
  background: var(--white);
  border: 1px solid var(--slate-200);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
}

/* ===== 左欄：參考圖樣式 ===== */
.left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.left-card {
  background: #fff;
  border: 1px solid var(--slate-200);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
  padding: 12px 10px;
}

.left-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  font-size: 18px;
  line-height: 1;
  margin-bottom: 8px;
}

.left-title.ok {
  color: #10b981;
}

.left-title.ng {
  color: #ef4444;
}

.left-icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  font-size: 12px;
  line-height: 1;
  border: 2px solid currentColor;
}

.left-icon.ok {
  color: #10b981;
}

.left-icon.ng {
  color: #ef4444;
}

.left-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.left-item {
  padding: 10px 12px;
  border-radius: 4px;
  /* 方角 */
  font-weight: 800;
  font-size: 18px;
  color: #6b7280;
  /* 未選灰字 */
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}

.left-item.active {
  background: #0a8f6f;
  /* 選中整塊綠底 */
  color: #fff;
}

.left-item.disabled {
  opacity: .55;
  cursor: not-allowed;
}

/* 中欄 */
.center {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flow-title {
  margin: 0;
  font-size: var(--fs-xl);
  font-weight: 900;
}

.mmd {
  overflow: auto;
  max-height: 65vh;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  padding: 6px 8px;
  border-radius: 8px;
  font-weight: 800;
  font-size: var(--fs-sm);
}

.chip.outline {
  background: #fff;
  border: 1px solid var(--teal);
  color: var(--teal);
}

/* 右欄：檢核表 */
.right {
  padding: 16px;
}

.checklist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 999px;
  font-weight: bold;
  border: 2px solid currentColor;
  font-size: 18px;
  background: #fff;
}

.check .dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid currentColor;
}

.check.ok {
  color: #10b981;
}

.check.warn {
  color: #f59e0b;
}

.check.error {
  color: #ef4444;
}

.text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


/* 彈窗 */
.modal-root {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, .5);
}

.modal-panel {
  position: relative;
  z-index: 1;
  width: 360px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .15);
}

.modal-close {
  margin-top: 12px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f7f7f7;
  cursor: pointer;
}

.modal-close:hover {
  background: #eee;
}

/* 文件詳細資訊區域 */
.document-section {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.document-section h3 {
  margin: 0 0 12px 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.document-btn {
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.document-btn:hover {
  background: #f1f5f9;
  border-color: #0ea5e9;
  transform: translateY(-1px);
}

/* 機構按鈕樣式 */
.institution-buttons {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.institution-btn {
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.institution-btn:hover {
  background: #f1f5f9;
  border-color: #0ea5e9;
  transform: translateY(-1px);
}

/* 模態框樣式 */
.modal-root {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-panel {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  color: #0f172a;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-content {
  padding: 24px;
  max-height: 50vh;
  overflow-y: auto;
}

.description {
  color: #374151;
  margin-bottom: 16px;
  line-height: 1.6;
}

.modal-content h4 {
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px 0;
}

.how-to-get {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}

.how-to-get li {
  padding: 6px 0;
  color: #374151;
  position: relative;
  padding-left: 20px;
}

.how-to-get li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

.tips {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
}

.tips strong {
  color: #92400e;
}

.tips p {
  color: #92400e;
  margin: 4px 0 0 0;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  text-align: right;
}

.btn.primary {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}

.btn.primary:hover {
  background: #0284c7;
}

/* 機構資訊模態框樣式 */
.institution-modal {
  max-width: 700px;
  width: 95%;
}

.institution-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.institution-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  gap: 16px;
}

.institution-info {
  flex: 1;
}

.institution-info h4 {
  margin: 0 0 8px 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
}

.institution-info p {
  margin: 4px 0;
  color: #374151;
  font-size: 14px;
  line-height: 1.4;
}

.institution-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

.map-btn,
.call-btn {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s;
}

.map-btn {
  background: #0ea5e9;
  color: white;
  border: 1px solid #0ea5e9;
}

.map-btn:hover {
  background: #0284c7;
  border-color: #0284c7;
}

.call-btn {
  background: #ffffff;
  color: #059669;
  border: 1px solid #059669;
}

.call-btn:hover {
  background: #f0fdf4;
  color: #047857;
  border-color: #047857;
}

/* RWD */
@media (max-width:1100px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .document-grid {
    grid-template-columns: 1fr;
  }

  .institution-buttons {
    grid-template-columns: 1fr;
  }

  .institution-item {
    flex-direction: column;
    align-items: stretch;
  }

  .institution-actions {
    flex-direction: row;
    min-width: auto;
    gap: 8px;
  }

  .map-btn,
  .call-btn {
    flex: 1;
  }
}
</style>
