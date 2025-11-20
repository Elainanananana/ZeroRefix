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
        <div class="MermaidLayout">
          <MermaidRenderer class="mmd" :chart="displayChart" />
          <div class="MermaidData">
            <!-- <div class="flex justify-between align-middle"> -->
            <!-- 文件資料編輯區 -->

            <!-- 申請文件下載區 -->
            <!-- <button class="institution-btn" @click="downloadApplicationFile()">
                <span class="flex gap-2">
                  <img src="/download.png" alt="download" class="download-icon" width="20">
                  <p>下載 <b>{{ currentFormTitle }}</b></p>
                </span>
              </button> -->
            <!-- </div> -->
            <div class="institution-buttons">
              <button class="institution-btn" @click="openFormPreview()">
                <p>✏️ 編輯<b>{{ currentFormTitle }}</b></p>
              </button>
              <div class="document-grid">
                <button class="institution-btn" @click="showApplicationInstitutions()">
                  🏢 最近可就診機構
                </button>
                <button class="institution-btn" @click="showSubmissionInstitutions()">
                  📮 最近可繳交機構
                </button>
              </div>

            </div>
            <!-- 文件詳細資訊區域（固定顯示；內部判斷是否有清單） -->
            <div class="document-section" v-if="documentDetails && documentDetails.length">
              <h3>所需文件說明</h3>
              <div class="document-grid">
                <button v-for="doc in documentDetails" :key="doc.name" class="document-btn"
                  @click="showDocumentModal(doc)">
                  📄 {{ doc.name }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
      <!-- 右欄：檢核表 -->
      <aside class="right">
        <ul class="checklist">
          <li v-for="c in checks" :key="c.id" :class="c.status" class="check">
            <span class="left-icon ok" v-if="c.status === 'ok'">✔</span>
            <span class="left-icon ng" v-if="c.status === 'error'" @click="checkstatus(c.id)"> </span>
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

    <Teleport to="body">
      <div v-if="formPreviewModal" class="modal-root">
        <!-- 遮罩 -->
        <div class="modal-backdrop" @click="formPreviewModal = null"></div>

        <!-- 面板 -->
        <div class="modal-panel institution-modal">
          <div class="modal-header">
            <h3 style="margin:0">{{ formPreviewModal.title }}</h3>
            <button class="close-btn" @click="formPreviewModal = null">✕</button>
          </div>

          <div class="modal-content-word ">
            <div class="docx-form">
              <div class="body">
                <!-- 保險事故 -->
                <div class="group grid">
                  <strong>保險事故</strong>
                  <div class="row">
                    <label>傷病類別</label>
                    <div>
                      <label class="tiny"><input type="radio" name="injuryCategory" value="occupational_injury"
                          checked />
                        職業傷害</label>
                      &nbsp;&nbsp;
                      <label class="tiny"><input type="radio" name="injuryCategory" value="occupational_disease" />
                        職業病</label>
                    </div>
                  </div>
                  <div class="row col2">
                    <div>
                      <label>傷病發生日期 - 年</label>
                      <input type="number" id="incidentYear" value="2025" />
                    </div>
                    <div class="col2" style="
									display: grid;
									grid-template-columns: 1fr 1fr;
									gap: 12px;
								">
                      <div>
                        <label>月</label>
                        <input type="number" id="incidentMonth" value="10" min="1" max="12" />
                      </div>
                      <div>
                        <label>日</label>
                        <input type="number" id="incidentDay" value="20" min="1" max="31" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 不能工作期間 + 薪資 -->
                <div class="group grid">
                  <strong>全日不能工作期間</strong>
                  <div class="row col2">
                    <div>
                      <label>自（年/月/日）</label>
                      <div class="col2" style="
										display: grid;
										grid-template-columns: 1fr 1fr 1fr;
										gap: 8px;
									">
                        <input type="number" id="fromYear" value="2025" />
                        <input type="number" id="fromMonth" value="10" min="1" max="12" />
                        <input type="number" id="fromDay" value="21" min="1" max="31" />
                      </div>
                    </div>
                    <div>
                      <label>至（年/月/日）</label>
                      <div class="col2" style="
										display: grid;
										grid-template-columns: 1fr 1fr 1fr;
										gap: 8px;
									">
                        <input type="number" id="toYear" value="2025" />
                        <input type="number" id="toMonth" value="10" min="1" max="12" />
                        <input type="number" id="toDay" value="28" min="1" max="31" />
                      </div>
                    </div>
                  </div>

                  <div class="row">
                    <label>取得薪資（或報酬）情形</label>
                    <div>
                      <label class="tiny"><input type="radio" name="incomeStatus" value="none" checked />
                        未取得</label>
                      &nbsp;&nbsp;<label class="tiny"><input type="radio" name="incomeStatus" value="partial" />
                        取得部分</label>
                      &nbsp;&nbsp;<label class="tiny"><input type="radio" name="incomeStatus" value="full" />
                        已取得原有</label>
                      &nbsp;&nbsp;<label class="tiny"><input type="radio" name="incomeStatus" value="article59" />
                        勞基法59條</label>
                    </div>
                    <div id="leaveGroup" class="tiny" style="margin-top: 6px">
                      （僅在「已取得原有」時勾選）
                      <label><input type="checkbox" id="leaveAnnual" />
                        特休</label>
                      <label><input type="checkbox" id="leaveRostered" />
                        排休</label>
                      <label><input type="checkbox" id="leaveFlex" />
                        彈性假</label>
                      <label><input type="checkbox" id="leaveShift" />
                        輪休假</label>
                      <label><input type="checkbox" id="leaveOTComp" />
                        加班補休</label>
                    </div>
                  </div>
                </div>

                <!-- 復工 -->
                <div class="group grid">
                  <strong>是否已恢復工作</strong>
                  <div class="row">
                    <label class="tiny"><input type="checkbox" id="hasReturned" checked />
                      是（若勾選，請填復工日期）</label>
                  </div>
                  <div class="row col2">
                    <div>
                      <label>復工日期 - 年</label>
                      <input type="number" id="returnYear" value="2025" />
                    </div>
                    <div class="col2" style="
									display: grid;
									grid-template-columns: 1fr 1fr;
									gap: 12px;
								">
                      <div>
                        <label>月</label>
                        <input type="number" id="returnMonth" value="10" min="1" max="12" />
                      </div>
                      <div>
                        <label>日</label>
                        <input type="number" id="returnDay" value="29" min="1" max="31" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 事故敘述 -->
                <div class="group grid">
                  <strong>事故敘述</strong>
                  <div class="row">
                    <label>傷害類型</label>
                    <div>
                      <label class="tiny"><input type="radio" name="injuryType" value="on_duty" checked />
                        執行職務</label>
                      &nbsp;&nbsp;<label class="tiny"><input type="radio" name="injuryType" value="commute" />
                        上下班</label>
                      &nbsp;&nbsp;<label class="tiny"><input type="radio" name="injuryType" value="business_trip" />
                        公出</label>
                      &nbsp;&nbsp;<label class="tiny"><input type="radio" name="injuryType" value="other" />
                        其他</label>
                      <input type="text" id="injuryTypeOther" placeholder="若選其他，請填寫" />
                    </div>
                  </div>

                  <div class="row">
                    <label>實際工作內容</label>
                    <textarea id="jobContent">
倉庫理貨、上架、包裝、搬運</textarea>
                  </div>

                  <div class="row col2">
                    <div>
                      <label>受傷時間（24小時制）</label>
                      <div style="
										display: grid;
										grid-template-columns: 1fr 1fr;
										gap: 8px;
									">
                        <input type="number" id="injuryHour" value="09" min="0" max="23" placeholder="時" />
                        <input type="number" id="injuryMinute" value="35" min="0" max="59" placeholder="分" />
                      </div>
                    </div>
                    <div>
                      <label>受傷地點描述（於何處）</label>
                      <input type="text" id="placeDesc" value="台中市" />
                    </div>
                  </div>

                  <div class="row">
                    <label>詳細地址</label>
                    <input type="text" id="addressLine" value="台北市中正區仁愛路一段 1 號" />
                  </div>

                  <div class="row">
                    <label>受傷原因及經過</label>
                    <textarea id="causeLine">
用力的時候往後扭到腰，扭傷。</textarea>
                  </div>

                  <div class="row col2">
                    <div>
                      <label>化學物質名稱（如適用）</label>
                      <input type="text" id="chemicalNameLine" value="" placeholder="無則留空" />
                    </div>
                    <div>
                      <label>公出事故補充（如適用）</label>
                      <input type="text" id="businessTripDetailLine" value="" placeholder="無則留空" />
                    </div>
                  </div>

                  <div class="row">
                    <label class="tiny"><input type="checkbox" id="applyCare" />
                      申請住院照護補助</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn primary" @click="downloadDocx">
              下載文件
            </button>
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
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { saveAs } from 'file-saver'

const formPreviewModal = ref<null | {
  title: string
  data: {
    injuryCategory: string
    incidentDate: string
    inabilityPeriod: string
    incomeStatus: string
    hasReturned: string
    injuryTime: string
    addressLine: string
    jobContent: string
    causeLine: string
  }
}>(null)
const DEFAULT_TEMPLATE_URL = '~/public/forms/work_injury.docx' // 路徑看你實際放哪裡
let templateBuffer: ArrayBuffer | null = null
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
const safe = (v: any): string => {
  if (v === null || v === undefined) return ''
  const s = String(v).trim()
  return s === 'undefined' || s === 'null' ? '' : s
}

const fmtDate = (o: { year?: string; month?: string; day?: string } = {}): string =>
  safe(o.year) || safe(o.month) || safe(o.day)
    ? `${safe(o.year)} 年 ${safe(o.month)} 月 ${safe(o.day)} 日`
    : ''
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
const checksMap = ref({
  medical: [
    { id: 1, label: '已申請傷病診斷書', status: 'ok' },
    { id: 4, label: '申辦文件職災資訊已填寫完成', status: 'ok' },
    { id: 2, label: '申辦文件個人資料尚未填寫完成', status: 'error' },
    { id: 3, label: '申辦文件金融資料尚未填寫完成', status: 'error' },
  ],
  sick: [
    { id: 1, label: '醫師休養證明', status: 'ok' },
    { id: 2, label: '請假證明已核章', status: 'ok' },
    { id: 3, label: '薪資資料待核對', status: 'error' },
  ],
  default: [
    { id: 1, label: '失能等級尚未評估', status: 'error' },
    { id: 2, label: '身分/就保文件齊全', status: 'ok' }
  ]
})
const checks = computed(() => {
  const type = current.value.id as 'medical' | 'sick' | 'default'
  return checksMap.value[type] ?? checksMap.value.default
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

function collectRaw() {
  // 這份就是照你貼的 HTML 143–548 行做出來的預設值
  const DEFAULT_RAW = {
    insuranceAccident: {
      injuryCategory: 'occupational_injury', // 職業傷害
      incidentDate: {
        year: '2025',
        month: '10',
        day: '20'
      }
    },
    inabilityPeriod: {
      from: {
        year: '2025',
        month: '10',
        day: '21'
      },
      to: {
        year: '2025',
        month: '10',
        day: '28'
      }
    },
    incomeDuringLeave: {
      status: 'none',      // 未取得
      leaveTypes: []       // 都沒勾
    },
    returnToWork: {
      hasReturned: true,   // 是否已恢復工作：有勾
      date: {
        year: '2025',
        month: '10',
        day: '29'
      }
    },
    injuryReport: {
      injuryType: 'on_duty',      // 傷害類型：執行職務
      injuryTypeOther: '',
      jobContent: '倉庫理貨、上架、包裝、搬運',
      injuryTime: {
        hour: '09',
        minute: '35'
      },
      injuryPlace: {
        locationDesc: '台中市',
        address: '台北市中正區仁愛路一段 1 號'
      },
      causeAndProcess: '用力的時候往後扭到腰，扭傷。',
      chemicalName: '',
      businessTripDetail: ''
    },
    inpatientCareSubsidy: {
      apply: false // 「申請住院照護補助」原檔是沒勾
    }
  }


  const base = JSON.parse(JSON.stringify(DEFAULT_RAW))

  const injuryCategoryNodes = [
    ...document.querySelectorAll<HTMLInputElement>('input[name="injuryCategory"]')
  ]
  const incidentYear = document.getElementById('incidentYear') as HTMLInputElement | null
  const incidentMonth = document.getElementById('incidentMonth') as HTMLInputElement | null
  const incidentDay = document.getElementById('incidentDay') as HTMLInputElement | null

  const fromYear = document.getElementById('fromYear') as HTMLInputElement | null
  const fromMonth = document.getElementById('fromMonth') as HTMLInputElement | null
  const fromDay = document.getElementById('fromDay') as HTMLInputElement | null
  const toYear = document.getElementById('toYear') as HTMLInputElement | null
  const toMonth = document.getElementById('toMonth') as HTMLInputElement | null
  const toDay = document.getElementById('toDay') as HTMLInputElement | null

  const incomeStatusNodes = [
    ...document.querySelectorAll<HTMLInputElement>('input[name="incomeStatus"]')
  ]
  const leaveAnnual = document.getElementById('leaveAnnual') as HTMLInputElement | null
  const leaveRostered = document.getElementById('leaveRostered') as HTMLInputElement | null
  const leaveFlex = document.getElementById('leaveFlex') as HTMLInputElement | null
  const leaveShift = document.getElementById('leaveShift') as HTMLInputElement | null
  const leaveOTComp = document.getElementById('leaveOTComp') as HTMLInputElement | null

  const hasReturned = document.getElementById('hasReturned') as HTMLInputElement | null
  const returnYear = document.getElementById('returnYear') as HTMLInputElement | null
  const returnMonth = document.getElementById('returnMonth') as HTMLInputElement | null
  const returnDay = document.getElementById('returnDay') as HTMLInputElement | null

  const injuryTypeNodes = [
    ...document.querySelectorAll<HTMLInputElement>('input[name="injuryType"]')
  ]
  const injuryTypeOther = document.getElementById('injuryTypeOther') as HTMLInputElement | null

  const jobContent = document.getElementById('jobContent') as HTMLTextAreaElement | null
  const injuryHour = document.getElementById('injuryHour') as HTMLInputElement | null
  const injuryMinute = document.getElementById('injuryMinute') as HTMLInputElement | null
  const placeDesc = document.getElementById('placeDesc') as HTMLInputElement | null
  const addressLine = document.getElementById('addressLine') as HTMLInputElement | null
  const causeLine = document.getElementById('causeLine') as HTMLTextAreaElement | null
  const chemicalNameLine = document.getElementById('chemicalNameLine') as HTMLInputElement | null
  const businessTripDetailLine = document.getElementById('businessTripDetailLine') as HTMLInputElement | null

  const applyCare = document.getElementById('applyCare') as HTMLInputElement | null

  // === 1. 傷病類別 ===
  const selectedCategory = injuryCategoryNodes.find(x => x.checked)?.value
  if (selectedCategory) {
    base.insuranceAccident.injuryCategory = selectedCategory
  }
  if (incidentYear) base.insuranceAccident.incidentDate.year = safe(incidentYear.value) || base.insuranceAccident.incidentDate.year
  if (incidentMonth) base.insuranceAccident.incidentDate.month = safe(incidentMonth.value) || base.insuranceAccident.incidentDate.month
  if (incidentDay) base.insuranceAccident.incidentDate.day = safe(incidentDay.value) || base.insuranceAccident.incidentDate.day

  // === 2. 全日不能工作期間 ===
  if (fromYear) base.inabilityPeriod.from.year = safe(fromYear.value) || base.inabilityPeriod.from.year
  if (fromMonth) base.inabilityPeriod.from.month = safe(fromMonth.value) || base.inabilityPeriod.from.month
  if (fromDay) base.inabilityPeriod.from.day = safe(fromDay.value) || base.inabilityPeriod.from.day

  if (toYear) base.inabilityPeriod.to.year = safe(toYear.value) || base.inabilityPeriod.to.year
  if (toMonth) base.inabilityPeriod.to.month = safe(toMonth.value) || base.inabilityPeriod.to.month
  if (toDay) base.inabilityPeriod.to.day = safe(toDay.value) || base.inabilityPeriod.to.day

  // === 3. 薪資取得情形 ===
  const selectedIncome = incomeStatusNodes.find(x => x.checked)?.value
  if (selectedIncome) {
    base.incomeDuringLeave.status = selectedIncome
  }

  const leaveTypes: string[] = []
  if (leaveAnnual?.checked) leaveTypes.push('annual')
  if (leaveRostered?.checked) leaveTypes.push('rostered')
  if (leaveFlex?.checked) leaveTypes.push('flex')
  if (leaveShift?.checked) leaveTypes.push('shift')
  if (leaveOTComp?.checked) leaveTypes.push('overtime_comp')
  // 如果使用者有勾，就覆蓋；沒勾就維持預設（空陣列）
  if (leaveTypes.length > 0) {
    base.incomeDuringLeave.leaveTypes = leaveTypes
  }

  // === 4. 是否已恢復工作 ===
  if (hasReturned) {
    base.returnToWork.hasReturned = !!hasReturned.checked
  }
  if (returnYear) base.returnToWork.date.year = safe(returnYear.value) || base.returnToWork.date.year
  if (returnMonth) base.returnToWork.date.month = safe(returnMonth.value) || base.returnToWork.date.month
  if (returnDay) base.returnToWork.date.day = safe(returnDay.value) || base.returnToWork.date.day

  // === 5. 事故敘述 ===
  const selectedInjuryType = injuryTypeNodes.find(x => x.checked)?.value
  if (selectedInjuryType) {
    base.injuryReport.injuryType = selectedInjuryType
  }
  if (injuryTypeOther) {
    const other = safe(injuryTypeOther.value)
    base.injuryReport.injuryTypeOther =
      base.injuryReport.injuryType === 'other' ? other : ''
  }

  if (jobContent) base.injuryReport.jobContent = safe(jobContent.value) || base.injuryReport.jobContent

  if (injuryHour) base.injuryReport.injuryTime.hour = safe(injuryHour.value) || base.injuryReport.injuryTime.hour
  if (injuryMinute) base.injuryReport.injuryTime.minute = safe(injuryMinute.value) || base.injuryReport.injuryTime.minute

  if (placeDesc) base.injuryReport.injuryPlace.locationDesc = safe(placeDesc.value) || base.injuryReport.injuryPlace.locationDesc
  if (addressLine) base.injuryReport.injuryPlace.address = safe(addressLine.value) || base.injuryReport.injuryPlace.address

  if (causeLine) base.injuryReport.causeAndProcess = safe(causeLine.value) || base.injuryReport.causeAndProcess
  if (chemicalNameLine) base.injuryReport.chemicalName = safe(chemicalNameLine.value) || base.injuryReport.chemicalName
  if (businessTripDetailLine) base.injuryReport.businessTripDetail = safe(businessTripDetailLine.value) || base.injuryReport.businessTripDetail

  // === 6. 住院照護補助 ===
  if (applyCare) {
    base.inpatientCareSubsidy.apply = !!applyCare.checked
  }

  return base
}

function decorate(data: any) {
  const out = JSON.parse(JSON.stringify(data))

  const cat = safe(out.insuranceAccident?.injuryCategory)
  out.isOccInjury = cat === 'occupational_injury'
  out.isOccDisease = cat === 'occupational_disease'

  // ✅ 傷病類別：加一個給畫面用的中文標籤
  out.injuryCategoryLabel =
    cat === 'occupational_injury'
      ? '職業傷害'
      : cat === 'occupational_disease'
        ? '職業病'
        : cat || ''

  const st = safe(out.incomeDuringLeave?.status)
  out.isIncomeNone = st === 'none'
  out.isIncomePartial = st === 'partial'
  out.isIncomeFull = st === 'full'
  out.isIncomeArt59 = st === 'article59'

  // ✅ 薪資取得情形：中文顯示文字
  out.incomeStatusLabel =
    st === 'none'
      ? '未取得'
      : st === 'partial'
        ? '取得部分'
        : st === 'full'
          ? '已取得原有'
          : st === 'article59'
            ? '勞基法第59條'
            : st || ''

  const arr = Array.isArray(out.incomeDuringLeave?.leaveTypes)
    ? out.incomeDuringLeave.leaveTypes
    : []
  const hasFull = out.isIncomeFull
  out.leaveAnnual = hasFull && arr.includes('annual')
  out.leaveRostered = hasFull && arr.includes('rostered')
  out.leaveFlex = hasFull && arr.includes('flex')
  out.leaveShift = hasFull && arr.includes('shift')
  out.leaveOTComp = hasFull && arr.includes('overtime_comp')

  out.hasReturned = !!out.returnToWork?.hasReturned

  const it = safe(out.injuryReport?.injuryType)
  out.isOnDuty = it === 'on_duty'
  out.isCommute = it === 'commute'
  out.isBusinessTrip = it === 'business_trip'
  out.isOtherInjury = it === 'other'

  // ✅ 全日不能工作期間（原本就有）
  out.inabilityFromLine = fmtDate(out.inabilityPeriod?.from)
  out.inabilityToLine = fmtDate(out.inabilityPeriod?.to)

  // ✅ 傷病發生日：跟原檔一樣做成年/月/日字串
  out.incidentDateLine = fmtDate(out.insuranceAccident?.incidentDate)

  out.returnToWorkDateLine = out.hasReturned
    ? fmtDate(out.returnToWork?.date)
    : ''

  const hh = Number(safe(out.injuryReport?.injuryTime?.hour)) || 0
  const mm = Number(safe(out.injuryReport?.injuryTime?.minute)) || 0
  const period = hh >= 12 ? '下午' : '上午'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  const pad2 = (n: number) => String(n).padStart(2, '0')
  out.injuryTimeLineZh =
    hh || mm ? `${period} ${pad2(h12)} 時 ${pad2(mm)} 分` : ''

  // alias（原本就有）
  out.workContent = safe(out.injuryReport?.jobContent)
  out.placeDesc = safe(out.injuryReport?.injuryPlace?.locationDesc)
  out.addressLine = safe(out.injuryReport?.injuryPlace?.address)
  out.causeLine = safe(out.injuryReport?.causeAndProcess)
  out.chemicalNameLine = safe(out.injuryReport?.chemicalName)
  out.businessTripDetailLine = safe(out.injuryReport?.businessTripDetail)
  out.injuryTypeOther = safe(out.injuryReport?.injuryTypeOther)

  return out
}

function buildData() {
  const raw = collectRaw()
  return decorate(raw)
}

async function loadTemplate() {
  try {
    const res = await fetch("/forms/work_injury.docx", { cache: 'no-store' })
    if (!res.ok) throw new Error('模板載入失敗')
    templateBuffer = await res.arrayBuffer()
  } catch (e) {
    console.error(e)
  }
}

function downloadDocx() {
  if (!templateBuffer) {
    console.warn('模板尚未載入完成')
    return
  }
  try {
    const zip = new PizZip(templateBuffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '[[', end: ']]' }, // 你樣板用 [[ ]]
      nullGetter: () => ''
    })

    const data = buildData()
    doc.setData(data)
    doc.render()

    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })

    const fileName = `申請書_${Date.now()}.docx`
    saveAs(blob, fileName)
  } catch (e: any) {
    console.error('Docxtemplater error:', e)
    const details = e.properties?.errors || e.message || e.toString()
    alert(
      '合併模板失敗：\n' +
      (Array.isArray(details)
        ? details.map((x: any) => x.message).join('\n')
        : details)
    )
  }
}

function openFormPreview() {
  const data = buildData()

  formPreviewModal.value = {
    title: '檢視文件內容',
    data: {
      // ✅ 直接用中文標籤
      injuryCategory: data.injuryCategoryLabel,

      // ✅ 用 incidentDateLine：2025 年 10 月 20 日
      incidentDate: data.incidentDateLine || '—',

      // ✅ 跟原檔一樣：從 ～ 至
      inabilityPeriod:
        data.inabilityFromLine || data.inabilityToLine
          ? `${data.inabilityFromLine} 至 ${data.inabilityToLine}`
          : '—',

      // ✅ 薪資取得情形
      incomeStatus: data.incomeStatusLabel || '—',

      // ✅ 是否已復工
      hasReturned: data.hasReturned ? data.returnToWorkDateLine : '尚未復工',

      // ✅ 受傷時間（上午 09 時 35 分）
      injuryTime: data.injuryTimeLineZh || '—',

      // ✅ 受傷地點 / 實際工作內容 / 受傷原因
      addressLine: data.addressLine || '—',
      jobContent: data.workContent || '—',
      causeLine: data.causeLine || '—'
    }
  }
}

function checkstatus(id) {
  const type = current.value.id as 'medical' | 'sick' | 'default'
  const list = checksMap.value[type]
  const target = list.find(item => item.id === id)
  target.status = 'ok'
}
onMounted(() => {
  loadTemplate()
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
  background-color: #008E73;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .06);
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
  margin: 10px auto;
  padding: 0 16px;
  display: flex;
  justify-content: center;
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
  padding: 16px;
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
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
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
  display: grid;
  grid-template-columns: repeat(auto-fit);
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

.modal-content-word {
  padding: 10px;
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

.MermaidLayout {
  border: 1px solid #e5e7eb;
  display: flex;
  max-height: 75vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.MermaidData {
  width: auto;
  min-width: 20vw;
  padding: 10px;
}

/* 顏色一樣沿用原始檔 */
:root {
  --brand: #0ea5a4;
  --border: #e5e7eb;
  --muted: #64748b;
}

/* 只影響這個表單 */
.docx-form {
  width: 100%;
}

/* 內層所有元素 box-sizing */
.docx-form * {
  box-sizing: border-box;
}

/* 原本 .body 的 padding */
.docx-form .body {
  width: 100%;
}

/* group = 每一塊卡片 */
.docx-form .group {
  padding: 10px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 12px;
}

/* 小標題，例如「保險事故」「全日不能工作期間」 */
.docx-form strong {
  font-weight: 600;
}

/* grid / row / col2 排版 – 完整搬原來的邏輯 */
.docx-form .grid {
  display: grid;
  gap: 12px;
  width: 100%;
}

.docx-form .row {
  display: grid;
  gap: 8px;
  width: 100%;
}

.docx-form .row.col2 {
  grid-template-columns: 1fr 1fr;
}

/* 這個是給你那些內聯 style 沒有寫 display 的 col2 用的備胎 */
.docx-form .col2:not(.row) {
  width: 100%;
}

/* label 樣式 */
.docx-form label {
  font-size: 12px;
  color: var(--muted);
}

/* input / select / textarea 樣式 */
.docx-form input[type="text"],
.docx-form input[type="number"],
.docx-form select,
.docx-form textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
  font: inherit;
}

/* radio / checkbox 也還是用瀏覽器預設就好 */
.docx-form input[type="radio"],
.docx-form input[type="checkbox"] {
  width: auto;
}

/* textarea 高度與可調整性 */
.docx-form textarea {
  min-height: 84px;
  resize: vertical;
}

/* 小字說明用的 class（原本的 .hint、.tiny） */
.docx-form .hint {
  font-size: 12px;
  color: var(--muted);
  display: flex;
  justify-content: center;
}

.docx-form .tiny {
  font-size: 12px;
}

/* 🔧 避免在 modal 裡出現水平捲軸 */
.docx-form {
  overflow-x: hidden;
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
