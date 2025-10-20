<template>
  <div class="benefit-page">
    <!-- 頂部抬頭：左側兩顆白色圓角按鈕 -->
    <div class="header">
      <div class="JobButton">
        <button class="pill">職缺資訊</button>
        <button class="pill" style="color: #008E73; background-color: white;">重新諮詢</button>
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
        <MermaidRenderer class="mmd" :chart="sharedChart || current.chart" />
        <!-- 文件詳細資訊區域 -->
        <div v-if="documentDetails" class="document-section">
          <h3>所需文件詳細說明</h3>
          <div class="document-grid">
            <button 
              v-for="doc in documentDetails" 
              :key="doc.name"
              class="document-btn"
              @click="showDocumentModal(doc)"
            >
              📄 {{ doc.name }}
            </button>
          </div>
        </div>
        
        <div class="institution-buttons">
          <button class="institution-btn" @click="showApplicationInstitutions()">
            🏢 取得最近可申請機構資訊
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
              <div v-for="institution in institutionModal.institutions" :key="institution.name" class="institution-item">
                <div class="institution-info">
                  <h4>{{ institution.name }}</h4>
                  <p class="address">📍 {{ institution.address }}</p>
                  <p class="phone">📞 {{ institution.phone }}</p>
                  <p class="hours">🕒 {{ institution.hours }}</p>
                  <p class="distance">🚶‍♂️ 距離約 {{ institution.distance }}</p>
                </div>
                <div class="institution-actions">
                  <a 
                    :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(institution.address)}`"
                    target="_blank"
                    class="btn map-btn"
                  >
                    🗺️ 開啟地圖
                  </a>
                  <a 
                    :href="`tel:${institution.phone}`"
                    class="btn call-btn"
                  >
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
  { id: 'medical', name: '災保醫療給付' },
  { id: 'sick', name: '災保傷病給付及照護補助' },
  { id: 'impair', name: '災保失能給付及照護補助' }
])
const notEligibleList = ref<Item[]>([
  { id: 'x1', name: '災保傷病給付及照護補助' },
  { id: 'x2', name: '災保失能給付及照護補助' }
])

const charts: Record<string, string> = {
  medical: `
    flowchart TB
      %% ——— 範例：災保醫療給付（含時間線/分支/文件清單）
      A["1. 事故發生與就醫\n- 時間記錄/照片/證人"] --> B{是否已就醫？}
      B -- 是 --> C["取得就醫/診斷證明\n(含日期、診斷碼、醫療院所章)"]
      B -- 否 --> A2["先就醫並取得診斷/收據"] --> C
      
      C --> D{是否為職災？}
      D -- 是 --> E["向雇主通報並完成職災通報流程"]
      D -- 不確定 --> E2["諮詢勞工局/投保單位確認性質"] --> E
      D -- 否 --> NG["不屬於本給付，改走一般健保/商保"]

      E --> F["蒐集文件\n• 身分證/在保證明\n• 勞保/就保投保資料\n• 醫療單據/診斷證明\n• 事故經過佐證(班表/職務/照片)"]
      F --> G["填寫申請書 A (個人/雇主)"]
      G --> H["填寫申請書 B (醫療/收據彙整)"]
      H --> I{是否已滿 30 天？}
      I -- 未滿 --> J["送件至主管機關/勞保局\n(郵寄/臨櫃/線上)"]
      I -- 已超過 --> J2["補充逾期原因說明\n(不可抗力/正當理由)" ] --> J

      J --> K["受理與分文"] --> L["補件通知(如有)\n- 身分/醫療/事故證明"]
      L --> M["完成補件"]
      K --> N["審查與核定"]
      M --> N
      N --> O{核定結果}
      O -- 通過 --> P["撥付醫療給付"]
      O -- 不通過 --> Q["申覆/訴願流程\n(附理由與證據)"]

      subgraph 時間線與注意事項
        J --> T1["期限：事故起 30 天內申請(示例)" ]
        F --> T2["文件需清晰且完整"]
        N --> T3["審查期：依案件複雜度而定"]
      end

      classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
      class A,A2,B,C,D,E,E2,F,G,H,I,J,J2,K,L,M,N,O,P,Q,T1,T2,T3,NG step
  `,
  sick: `
    flowchart TB
      A["1. 醫師休養建議/請假"] --> B{是否影響工作所得？}
      B -- 是 --> C["蒐集薪資與在保資料\n(近 6 個月) "]
      B -- 否 --> NG["可能不符本項，改評估其他給付"]
      C --> D["醫療/診斷/休養證明齊備"] --> E["填寫申請表"] --> F["送件至勞保局"]
      F --> G["受理→補件(如有)"] --> H["審查與撥款"]

      subgraph 注意
        D --> T1["證明須含診斷與休養天數"]
        C --> T2["薪資證明需與投保一致"]
      end
      classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
      class A,B,C,D,E,F,G,H,T1,T2,NG step
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
const Document = computed(() => [
  {
    current: 'medical',//補助項目
    documents: [
      [//第一份文件
        {//第一個欄位
          caption: '姓名',//說明
          type: 'text',//編輯型態
          value: '阿霈'//內容
        },
        {
          caption: '是否申請',
          type: 'checkbox',
          value: true
        }
      ],
      [//第二份文件
        {
          name: '座號',
          type: 'number',
          value: '阿丞'
        },
        {
          caption: '生日',
          type: 'date',
          value: ''
        }
      ]],
  },
]);
const selected = ref<keyof typeof charts>('medical')
const { chart: chartFromChat, selectedId, meta } = useMermaidChart()
if (selectedId.value && (selectedId.value in charts)) {
  selected.value = selectedId.value as keyof typeof charts
}
const sharedChart = computed(() => chartFromChat.value || '')

// 從聊天頁面傳來的文件詳細資訊
const documentDetails = computed(() => {
  const metaData = meta.value as any
  return metaData?.eligibleBenefits?.[0]?.documents || null
})

// 選中的文件詳細資訊
const selectedDocument = ref(null)

// 機構資訊模態框
const institutionModal = ref(null)

const current = computed(() => ({
  id: selected.value,
  name: eligibleList.value.find(x => x.id === selected.value)?.name ?? '災保醫療給付',
  chart: charts[selected.value]
}))

function toast(Data: string) {
  console.log(Data)
}

function showDocumentModal(doc) {
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
      { id: 1, label: '尚未申請就醫證明', status: 'error' },
      { id: 2, label: 'B 文件尚未填寫完成', status: 'error' },
      { id: 3, label: 'A 文件填寫完成', status: 'ok' }
    ]
  }
  if (current.value.id === 'sick') {
    return [
      { id: 1, label: '醫師休養證明尚缺', status: 'error' },
      { id: 3, label: '薪資資料待核對', status: 'error' },
      { id: 2, label: '請假證明已核章', status: 'ok' }
    ]
  }
  return [
    { id: 1, label: '失能等級尚未評估', status: 'error' },
    { id: 2, label: '身分/就保文件齊全', status: 'ok' }
  ]
})


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
  background-color: #008E73
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

/* 頁面與頂欄 */
.benefit-page {
  background: var(--bg);
  min-height: 100vh;
  color: var(--slate-900);
}

/* 版心 */
.grid {
  width: 80vw;
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
  max-height: 70vh;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  padding: 6px 12px;
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

.map-btn, .call-btn {
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
  .map-btn, .call-btn {
    flex: 1;
  }
}
</style>
