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
const DEFAULT_RAW = {
  insuranceAccident: {
    injuryCategory: 'occupational_injury', // 職業傷害（先固定職災）
    incidentDate: {
      year: '',
      month: '',
      day: ''
    }
  },
  inabilityPeriod: {
    from: {
      year: '',
      month: '',
      day: ''
    },
    to: {
      year: '',
      month: '',
      day: ''
    }
  },
  incomeDuringLeave: {
    status: 'none',      // 未取得（先給預設，你之後可以改成根據其他欄位判斷）
    leaveTypes: []       // 這份對話目前沒收集，就先留空
  },
  returnToWork: {
    hasReturned: false,  // 是否已恢復工作：預設 false，之後可接上你的欄位
    date: {
      year: '',
      month: '',
      day: ''
    }
  },
  injuryReport: {
    injuryType: 'on_duty',      // 傷害類型：執行職務，先預設
    injuryTypeOther: '',
    jobContent: '',             // 目前沒有 jobContent 欄位，就先留空
    injuryTime: {
      hour: '',
      minute: ''
    },
    injuryPlace: {
      locationDesc: '',
      address: ''
    },
    causeAndProcess: '',
    chemicalName: '',
    businessTripDetail: ''
  },
  inpatientCareSubsidy: {
    apply: false // 「申請住院照護補助」目前對話沒收集，先預設 false
  }
}
const collectorState = ref({
  applicant_role: '',
  accident_date: '',
  accident_time: '',
  accident_place: '',
  accident_type: '',
  employer_name: '',
  insured_status: '',
  medical_provider: '',
  diagnosis_text: '',
  treatment_dates: [], // 陣列
  documents_ready: [], // 陣列：例如 ["診斷證明書", "醫療收據"]
  job_content: '',
  has_returned: null,             // true / false
  return_date: '',                // 'YYYY-MM-DD'
  income_status: 'none',          // 'none' | 'full' | 'partial'
  leave_types: [],                // ['普通傷病假', ...]
  inpatient_care_apply: null      // true / false
})
const lastAskedField = ref('')
const isIntro = ref(true)       // 尚未「送出」任何訊息 → 輸入框置中
const scriptStep = ref(0)       // 腳本步驟（目前沒用到，但保留）
const messagesEl = ref(null)
const isComposing = ref(false)  // 中文輸入法組字狀態（避免誤送）
const router = useRouter()
const { setChart, setSelected } = useMermaidChart()

// 目前已不再使用 scriptedReplies，但保留不動
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

async function send() {
  if (isBusy.value) return
  const text = draft.value.trim()
  if (!text) return

  // 1. 推入使用者訊息
  messages.value.push({ role: 'user', content: text })
  draft.value = ''
  scrollToBottom()

  // 2. 首次送出：輸入列往下貼
  if (isIntro.value) {
    isIntro.value = false
  }

  // 3. 新增一顆 loading 泡泡
  const typingIndex = messages.value.length
  messages.value.push({ role: 'assistant', typing: true, step: scriptStep.value })
  scrollToBottom()

  // 4. 呼叫 LLM
  await replyForCurrentStep(text, typingIndex)
}

/**
 * 呼叫 LLM 並嘗試解析成 JSON；若解析失敗則重試（最多 maxRetry 次）。
 * 假設後端已使用 response_format 強制回傳單一 JSON 物件。
 */
async function callLmAndParse(payloadMessages, maxRetry = 2) {
  let lastRaw = ''

  for (let attempt = 0; attempt < maxRetry; attempt++) {
    try {
      const response = await $fetch('/api/lmstudio', {
        method: 'POST',
        body: {
          messages: payloadMessages,
          temperature: attempt === 0 ? 0.2 : 0
        }
      })

      // 🆕 先拿出 message，兼容 structured output
      const msg = response?.choices?.[0]?.message
      if (!msg) {
        throw new Error('LM 回傳內容沒有 message')
      }

      // 🆕 如果 LM Studio 有照 OpenAI 一樣給 parsed，就直接用
      // （沒有的話 parsed 會是 undefined，就會走原本的 content 流程）
      // @ts-ignore
      if (msg.parsed && typeof msg.parsed === 'object') {
        return msg.parsed
      }

      const raw = msg.content ?? ''
      lastRaw = String(raw)

      const cleaned = cleanText(lastRaw)
      const result = JSON.parse(cleaned)
      return result
    } catch (e) {
      console.error(`JSON 解析失敗（第 ${attempt + 1} 次），原始內容：`, lastRaw)
      if (attempt === maxRetry - 1) {
        throw e
      }
    }
  }

  throw new Error('JSON 解析失敗')
}



async function replyForCurrentStep(userText, typingIndex) {
  // 🆕 0. 先把「上一輪問的欄位」用這一輪的回答填回去（除了日期欄位）
  const answer = userText.trim()
  const key = lastAskedField.value
  if (answer && key) {
    const state = collectorState.value

    // 0-1. 若上一題是事故日期，且使用者已給 YYYY-MM-DD，就直接寫入，不用等模型
    if (key === 'accident_date') {
      const iso = /^(\d{4})-(\d{2})-(\d{2})$/.test(answer)
      if (iso) {
        state.accident_date = answer
      }
    }
    // 0-2. 其它欄位（除了 treatment_dates），直接寫入使用者原文
    else if (key !== 'treatment_dates') {
      if (Array.isArray(state[key])) {
        // 像 documents_ready 這種陣列欄位，就把使用者回答當成一筆放進去
        state[key] = Array.from(new Set([...state[key], answer]))
      } else if (typeof state[key] === 'string') {
        state[key] = answer
      }
    }
  }

  const systemPrompt = `
你是一個「逐輪收集申請職災補助資料的 JSON 填寫機器人」。

任務流程：
1. 解析 <user_input> 與 <state>。
2. 以輸入的 state 為目前的「真實欄位狀態」，只在 user_input 明確更正或否認時才覆寫。
3. 只使用本輪敘述或可推算的相對日期更新欄位，不得臆測。
4. 判斷可申請補助類型（醫療給付／傷病給付／失能給付）。
5. 根據 state 找出仍需補問的欄位（missing），missing 中只能放「尚未填寫或仍不清楚」的欄位名稱。
6. 每輪只問 missing 中優先度最高的一個欄位，將提問內容放入 next_questions。
7. 若資訊已足以完成補助判定，則：
   - done = true
   - missing = []
   - next_questions = [""]

【強制輸出】
- 只能輸出「合法 JSON」，不能加任何開頭語、Markdown、自然語言敘述。只要 JSON。
- 若有非 JSON 內容，應丟棄並改輸出合法 JSON。
- JSON 結構與型別必須符合以下 schema：

{
  "user_input_zh": "使用者原始輸入（繁體中文）",
  "benefit_types": ["醫療給付", "傷病給付"],
  "state": {
    "applicant_role": "申請人身分",
    "accident_date": "YYYY-MM-DD",
    "accident_time": "HH:mm",
    "accident_place": "事故發生地點描述",
    "accident_type": "事故發生情況描述",
    "employer_name": "雇主名稱或店名",
    "insured_status": "勞保投保狀態描述",
    "medical_provider": "就醫院所名稱",
    "diagnosis_text": "診斷或傷病描述",
    "treatment_dates": ["YYYY-MM-DD"],
    "documents_ready": ["診斷證明書", "醫療收據"]
  },
  "relative_time": {
    "accident_date": null 或 {
      "expression": "上週二",
      "days_offset": -7
    },
    "treatment_dates": [
      {
        "expression": "昨天晚上去急診",
        "days_offset": -1
      }
    ]
  },
  "missing": ["applicant_role", "accident_date"],
  "next_questions": ["請問事故是發生在什麼日期？（請用 YYYY-MM-DD，例如：2025-11-25）"],
  "done": false,
  "done_message": "簡短說明已蒐集完畢與可申請的補助種類（若 done = true 時才需要有內容）",
  "notes": ["其它備註，或模型內部判斷補充"]
}

【欄位與型別要求】
- benefit_types 的每一個元素只能是下列三種字串之一：
  - "醫療給付"
  - "傷病給付"
  - "失能給付"
- state.treatment_dates：陣列，每個元素是字串（前端會自行檢查是否為 YYYY-MM-DD）。
- state.documents_ready：陣列，每個元素是字串，例如「診斷證明書」、「醫療收據」。
- relative_time.accident_date：
  - 可以是 null，代表沒有相對日期資訊。
  - 或是一個物件 { "expression": "...", "days_offset": 整數 }。
- relative_time.treatment_dates：陣列，每個元素是 { "expression": 字串, "days_offset": 整數 }。

【解析規則】
- 嚴禁生成姓名或稱呼（不可寫王先生／林小姐）。
- 嚴禁生成不存在的資訊，未知欄位用空字串 ""。
- state 中已經有「非空值」的欄位，通常視為已蒐集完成：
  - 不要再把這些欄位放進 missing。
  - 不要再針對這些欄位出題，除非本輪 user_input 明確說「前面填錯、要改」。
- accident_place = 事故地點；medical_provider = 就醫地點，不可混用。
- 就醫時間 ≠ 事故時間。
- 事故時間需有明確數字（如「晚上8點」→ "20:00"）。只有「晚上」、「早上」等模糊字不能直接填入 accident_time。
- 只有出現完整日期（含年份或可推算出年份）才填 accident_date / treatment_dates。
- 相對日期（昨天、上週二、前天、兩天後等）填入 relative_time：
  { "expression": "上週二", "days_offset": -7 }  // days_offset 必須是相對於「今天」的整數
- treatment_dates 的相對日期一律放在 relative_time.treatment_dates。
- benefit_types 判斷規則：
  - 有「醫院、急診、就醫」→ 包含 "醫療給付"
  - 有「受傷、請假、休養、無法工作」→ 包含 "傷病給付"
  - 有「失能、永久損傷、功能無法恢復」→ 包含 "失能給付"
- 不須說明分析過程，只需給出結果。

【missing 欄位順序與內容】
- missing 必須是下列 key 名稱的子集合（字串陣列）：
  [
    "applicant_role",
    "accident_date",
    "accident_time",
    "accident_place",
    "accident_type",
    "employer_name",
    "insured_status",
    "medical_provider",
    "diagnosis_text",
    "treatment_dates",
    "documents_ready"
  ]
- 欄位已經在 state 中有合理的非空值時，不得再放進 missing。
- 如果所有上述欄位都已填好，missing 應該是空陣列 []。

【提問規則】
- next_questions 必為長度 1 的陣列。
- 問題要「只問 missing 中第一個欄位」，不得同時問兩個。
- 問句要具體清楚並附範例

【完成條件（非常重要）】
- 以下欄位都有合理的非空值時，代表資料已足以進行補助項目判定，必須將 done 設為 true：
  - applicant_role
  - accident_date
  - accident_time
  - accident_place
  - accident_type
  - employer_name
  - insured_status
  - medical_provider
  - diagnosis_text
  - treatment_dates        // 至少要有一個就醫或住院日期
  - documents_ready        // 若使用者明確表示「目前沒有相關文件」，可填空陣列 []
- 只要上述欄位皆已填寫完成，請務必：
  - done = true
  - missing = []
  - next_questions = [""]
  - done_message 填入一段簡短中文說明：已完成資料蒐集，以及可申請的補助種類。
`.trim()


  // 1. 備份 state（用來做這一輪變更摘要）
  const prevState = JSON.parse(JSON.stringify(collectorState.value))

  const payloadMessages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `
<state>
${JSON.stringify(collectorState.value)}
</state>

<user_input>
${userText}
</user_input>
`.trim(),
    },
  ]

  try {
    const result = await callLmAndParse(payloadMessages, 2)

    const state = collectorState.value
    const newState = result.state || {}

    // 2. 用 LM 回傳的 state 覆寫 / 合併
    Object.keys(state).forEach((key) => {
      const newVal = newState[key]

      // 🆕 特別規則：treatment_dates 交給 relative_time 處理，不吃模型直接給的實際日期
      if (key === 'treatment_dates') {
        return
      }

      if (Array.isArray(state[key])) {
        if (Array.isArray(newVal)) {
          const merged = [...state[key], ...newVal].filter((v) => v !== "")
          state[key] = Array.from(new Set(merged))
        }
      } else if (typeof newVal === 'string') {
        state[key] = newVal.trim()
      }
    })

    // 2-b. relative_time → 轉成實際日期
    const relativeTime = result.relative_time || { accident_date: null, treatment_dates: [] }
    const today = new Date()

    // 🆕 先記下「上一輪」是否已經有 treatment_dates
    const hadTreatmentBefore =
      Array.isArray(prevState.treatment_dates) && prevState.treatment_dates.length > 0

    // 事故日期：如果 state 還是空，且有 days_offset，就算出真正日期
    if (
      !state.accident_date &&
      relativeTime.accident_date &&
      typeof relativeTime.accident_date.days_offset === "number"
    ) {
      const dateStr = calcDateFromOffset(relativeTime.accident_date.days_offset, today)
      if (dateStr) {
        state.accident_date = dateStr
      }
    }

    // 🆕 就醫 / 住院日期：只在「之前完全沒有任何 treatment_dates」時，才處理一次
    if (
      !hadTreatmentBefore &&
      Array.isArray(relativeTime.treatment_dates) &&
      relativeTime.treatment_dates.length > 0
    ) {
      const extraDates = relativeTime.treatment_dates
        .filter((item) => item && typeof item.days_offset === "number")
        .map((item) => calcDateFromOffset(item.days_offset, today))
        .filter((d) => d !== "")

      if (extraDates.length > 0) {
        const merged = [...state.treatment_dates, ...extraDates]
        state.treatment_dates = Array.from(new Set(merged))
      }
    }



    // 先讀模型給的 done / next_questions
    let done = !!result.done
    const nextQ = Array.isArray(result.next_questions) ? result.next_questions[0] || "" : ""

    // 讀取 missing
    const missing = Array.isArray(result.missing) ? result.missing : []

    // 🆕 前端補一層檢查：如果所有必要欄位都有值，就強制視為蒐集完成
    const requiredKeys = [
      "applicant_role",
      "accident_date",
      "accident_time",
      "accident_place",
      "accident_type",
      "employer_name",
      "insured_status",
      "medical_provider",
      "diagnosis_text",
      "treatment_dates",
      "documents_ready",
    ]

    const allFilled = requiredKeys.every((key) => {
      const v = state[key]
      if (Array.isArray(v)) {
        return v.length > 0
      }
      if (typeof v === "string") {
        return v.trim() !== ""
      }
      return !!v
    })

    if (allFilled) {
      done = true
    }

    // 🆕 如果前端判斷 done = true，就把 missing 清空，避免你下一輪還看到舊的 missing
    const effectiveMissing = done ? [] : missing

    // 🆕 記住下一輪要問哪個欄位：effectiveMissing 裡的第一個
    const nextField = !done && effectiveMissing.length > 0 ? effectiveMissing[0] : ""
    lastAskedField.value = nextField || ""


    // 3. 算出「這一輪新增或變更的欄位」摘要
    const fieldLabels = {
      applicant_role: "申請人身分",
      accident_date: "事故日期",
      accident_time: "事故時間",
      accident_place: "事故地點",
      accident_type: "事故發生情況",
      employer_name: "雇主名稱",
      insured_status: "勞保投保狀態",
      medical_provider: "就醫院所",
      diagnosis_text: "診斷或傷病描述",
      treatment_dates: "就醫/住院日期",
      documents_ready: "已備妥文件",
    }

    const parsedSummary = []

    Object.keys(state).forEach((key) => {
      const label = fieldLabels[key]
      if (!label) return

      const before = prevState[key]
      const after = state[key]

      let changed = false
      if (Array.isArray(after)) {
        changed = JSON.stringify(before || []) !== JSON.stringify(after || [])
      } else {
        changed = (before || "") !== (after || "")
      }

      if (!changed) return

      if (Array.isArray(after) && after.length > 0) {
        parsedSummary.push(`${label}：${after.join("、")}`)
      } else if (typeof after === "string" && after.trim() !== "") {
        parsedSummary.push(`${label}：${after.trim()}`)
      }
    })

    // 若這輪只有相對日期，也補一句說明
    if (
      relativeTime.accident_date &&
      typeof relativeTime.accident_date.days_offset === "number" &&
      !parsedSummary.some((line) => line.startsWith("事故日期"))
    ) {
      parsedSummary.push(
        `事故日期：已依「${relativeTime.accident_date.expression}」換算為 ${state.accident_date}`,
      )
    }

    if (
      !hadTreatmentBefore && // 🆕 之前完全沒資料時才顯示
      Array.isArray(relativeTime.treatment_dates) &&
      relativeTime.treatment_dates.length > 0
    ) {
      const desc = relativeTime.treatment_dates
        .map((item) => item.expression)
        .filter(Boolean)
      if (desc.length > 0 && !parsedSummary.some((line) => line.startsWith("就醫/住院日期"))) {
        parsedSummary.push(`就醫/住院相對日期：${desc.join("、")}`)
      }
    }


    // 4. 組合要顯示給使用者的文字（把語氣稍微柔一點）
    // 4. 組合要顯示給使用者的文字（把語氣稍微柔一點）
    let displayText = ""

    if (!done) {
      const summaryPart = parsedSummary.length
        ? `我先幫你整理一下目前的資訊：\n${parsedSummary.join("\n")}\n\n`
        : ""
      const questionPart = nextQ || "如果你還有其他想補充的，也可以直接跟我說。"

      displayText = summaryPart + questionPart
    } else {
      const summaryPart = parsedSummary.length
        ? `目前幫你整理到的重點是：\n${parsedSummary.join("\n")}\n\n`
        : ""

      const benefits = analyzeEligibleBenefits(messages.value)
      const benefitNames = benefits.map((b) => `・${b.name}`).join("\n")
      const benefitsPart = benefits.length
        ? `依照你目前的敘述，初步看起來可以申請的補助項目包含：\n${benefitNames}\n\n`
        : "依照你目前的敘述，初步可以幫你評估職災相關的補助項目。\n\n"

      const tail =
        "接下來我會根據這些資料，幫你整理申請流程圖與需要準備的文件，你也可以點下方的按鈕查看詳細流程。"

      displayText = summaryPart + benefitsPart + tail

      // 🆕★★★ 這裡開始：資料已收集完成 → 產生標準表單 JSON + 更新 Mermaid store ★★★
      const formRaw = buildFormRawFromState(state)
      console.log("✅ formRaw 準備送去產檔 / 後端：", formRaw)

      // 如果你希望流程圖頁也能一起拿到 formRaw，可以塞進 setChart 的 meta 裡
      const chart = buildMermaidChart(messages.value)

      if (benefits.length > 0) {
        setSelected(benefits[0].id)
      }

      setChart(chart, {
        generatedAt: Date.now(),
        eligibleBenefits: benefits,
        formRaw, // ← 重要：這樣 goToBenefits 進去就可以從 composable 拿到這顆 JSON
      })
    }

    messages.value[typingIndex] = {
      role: "assistant",
      content: displayText,
      isFinal: done,
    }


    scriptStep.value = scriptStep.value + 1
    nextTick().then(scrollToBottom)

    console.log("collectorState:", collectorState.value)
  } catch (err) {
    console.error("LM 回覆錯誤：", err)

    messages.value[typingIndex] = {
      role: "assistant",
      content: "目前系統解析回覆時發生錯誤，請再描述一次或稍後重試。",
      isFinal: false,
    }

    nextTick().then(scrollToBottom)
  }
}


/**
 * 以下 helper 原本的邏輯保持不變
 */

function queueTypingAndReply(text, isFinal = false, done, existingIndex) {
  let index = existingIndex

  if (typeof index !== 'number') {
    index = messages.value.length
    messages.value.push({ role: 'assistant', typing: true, step: scriptStep.value })
  } else {
    messages.value[index] = { role: 'assistant', typing: true, step: scriptStep.value }
  }

  scrollToBottom(true)

  const delay = typingDelay(text, scriptStep.value)

  setTimeout(() => {
    messages.value[index] = {
      role: 'assistant',
      content: text,
      isFinal
    }
    if (isFinal) {
      const chart = buildMermaidChart(messages.value)
      const eligibleBenefits = analyzeEligibleBenefits(messages.value)

      if (eligibleBenefits.length > 0) {
        setSelected(eligibleBenefits[0].id)
      }

      setChart(chart, {
        generatedAt: Date.now(),
        eligibleBenefits
      })
    }
    nextTick().then(() => scrollToBottom(true))
    if (done) setTimeout(done, 240)
  }, delay)
}

function cleanText(txt) {
  if (!txt) return ''
  return txt
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/g, '')
    .trim()
}

function typingDelay(text, stepIndex) {
  const isFirst = stepIndex === 0
  const base = isFirst ? 900 : 700
  const perChar = isFirst ? 45 : 35
  const max = 2800
  return Math.min(max, base + text.length * perChar)
}

function calcDateFromOffset(daysOffset, baseDate = new Date()) {
  if (typeof daysOffset !== 'number' || Number.isNaN(daysOffset)) return ''

  const base = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  )

  base.setDate(base.getDate() + daysOffset)

  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, '0')
  const d = String(base.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ✅ 把 collectorState 整理成表單要的 DEFAULT_RAW 結構
function buildFormRawFromState(state) {
  // 深拷貝一份模板，避免直接改到 DEFAULT_RAW 常數
  const raw = JSON.parse(JSON.stringify(DEFAULT_RAW))

  // ---------- 1. 事故日期 → insuranceAccident.incidentDate ----------
  // state.accident_date: "YYYY-MM-DD"
  if (state.accident_date) {
    const [y, m, d] = state.accident_date.split('-')
    raw.insuranceAccident.incidentDate.year = y || ''
    raw.insuranceAccident.incidentDate.month = (m || '').replace(/^0/, '')
    raw.insuranceAccident.incidentDate.day = (d || '').replace(/^0/, '')
  }

  // ---------- 2. 事故時間 → injuryReport.injuryTime ----------
  // state.accident_time: "HH:mm"
  if (state.accident_time && state.accident_time.includes(':')) {
    const [hh, mm] = state.accident_time.split(':')
    raw.injuryReport.injuryTime.hour = hh || ''
    raw.injuryReport.injuryTime.minute = mm || ''
  }

  // ---------- 3. 事故地點 → injuryReport.injuryPlace ----------
  // 目前你只有一個 accident_place 字串，就先塞兩個欄位都用同一段
  if (state.accident_place) {
    raw.injuryReport.injuryPlace.address = state.accident_place
    raw.injuryReport.injuryPlace.locationDesc = state.accident_place
  }

  // ---------- 4. 事故發生情況 → injuryReport.causeAndProcess ----------
  if (state.accident_type) {
    raw.injuryReport.causeAndProcess = state.accident_type
  }

  // ---------- 5. 無工作能力期間 → inabilityPeriod.from / to ----------
  // 目前沒有獨立欄位描述「休養期間」，先用 treatment_dates 估一個區間：
  //   - 最早的 treatment_date 當 from
  //   - 最晚的 treatment_date 當 to
  if (Array.isArray(state.treatment_dates) && state.treatment_dates.length > 0) {
    const sorted = [...state.treatment_dates].sort() // YYYY-MM-DD 字串排序 OK
    const from = sorted[0]
    const to = sorted[sorted.length - 1]

    if (from) {
      const [fy, fm, fd] = from.split('-')
      raw.inabilityPeriod.from.year = fy || ''
      raw.inabilityPeriod.from.month = (fm || '').replace(/^0/, '')
      raw.inabilityPeriod.from.day = (fd || '').replace(/^0/, '')
    }

    if (to) {
      const [ty, tm, td] = to.split('-')
      raw.inabilityPeriod.to.year = ty || ''
      raw.inabilityPeriod.to.month = (tm || '').replace(/^0/, '')
      raw.inabilityPeriod.to.day = (td || '').replace(/^0/, '')
    }
  }
  if (state.job_content) {
    raw.injuryReport.jobContent = state.job_content
  }

  // returnToWork
  if (state.has_returned === true && state.return_date) {
    const [y, m, d] = state.return_date.split('-')
    raw.returnToWork.hasReturned = true
    raw.returnToWork.date.year = y || ''
    raw.returnToWork.date.month = (m || '').replace(/^0/, '')
    raw.returnToWork.date.day = (d || '').replace(/^0/, '')
  }

  // incomeDuringLeave
  raw.incomeDuringLeave.status = state.income_status || 'none'
  raw.incomeDuringLeave.leaveTypes = Array.isArray(state.leave_types)
    ? state.leave_types
    : []

  // inpatientCareSubsidy
  if (typeof state.inpatient_care_apply === 'boolean') {
    raw.inpatientCareSubsidy.apply = state.inpatient_care_apply
  }
  // ---------- 6. 住院照護補助 / 其他欄位 ----------
  // 目前對話沒有直接收集相關資訊，先維持 DEFAULT_RAW 的預設值即可。
  // 若未來你在 collectorState 加上：
  //   - has_returned / return_date
  //   - inpatient_care_apply
  //   - job_content
  //   - income_status / leaveTypes
  // 就可以在這裡往下補 mapping。

  // 範例：如果你之後新增 state.job_content：
  // if (state.job_content) {
  //   raw.injuryReport.jobContent = state.job_content
  // }

  return raw
}



function scrollToBottom() {
  nextTick(() => {
    if (typeof window === 'undefined') return

    const doc = document.documentElement || document.body
    window.scrollTo({
      top: doc.scrollHeight,
      behavior: 'smooth'
    })
  })
}

/* 下面 documentDetails / analyzeEligibleBenefits / calculateDates / buildMermaidChart / goToBenefits
   保持你原本的程式即可（已在檔案後半段），不用改。 */

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
  color: #008e73;
  font-size: 26px;
  font-weight: bolder;
}

.pill {
  padding: 13px 28px;
  border-radius: 999px;
  border: none;
  background: #008e73;
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
  /* overflow: auto;
  height: auto;
  scroll-behavior: smooth; */
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
  color: #008e73;
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
  animation-delay: 0.25s;
}

.dot:nth-child(3) {
  animation-delay: 0.5s;
}

@keyframes blink {

  0%,
  80%,
  100% {
    opacity: 0.2;
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
  border: 1px solid #008e73;
  color: #ffffff;
  background: #008e73;
}

/* ===== 輸入列（置中→滑到底部） ===== */
.composer {
  position: fixed;
  left: 50%;
  width: 60vw;
  will-change: top, transform;
  transition:
    top 1000ms cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 1000ms cubic-bezier(0.22, 0.61, 0.36, 1);
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
  border-color: #008e73;
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
  background: #008e73;
  color: #fff;
  cursor: pointer;
}

.iconBtn:hover {
  filter: brightness(0.95);
}

.iconBtn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.7;
  filter: none;
}

.iconBtn:disabled:hover {
  filter: none;
}
</style>
