<template>
  <div class="benefit-page">
    <!-- 頂部抬頭：左側兩顆白色圓角按鈕 -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="top-left">
          <NuxtLink to="/" class="top-pill">職缺資訊</NuxtLink>
          <NuxtLink to="/" class="top-pill outline">重新諮詢</NuxtLink>
        </div>
      </div>
    </header>

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
            <li
              v-for="b in eligibleList"
              :key="b.id"
              class="left-item"
              :class="{ active: b.id === selected }"
              @click="selected = b.id"
            >
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
            <li
              v-for="b in notEligibleList"
              :key="b.id"
              class="left-item disabled"
            >
              {{ b.name }}
            </li>
          </ul>
        </section>
      </aside>

      <!-- 中欄：流程 -->
      <main class="center card">
        <h2 class="flow-title">{{ current.name }}申請流程</h2>
        <!-- <MermaidRenderer class="mmd" :chart="current.chart" /> -->
        <div class="chips">
          <button class="chip outline" @click="toast('取得最近可申請機構資訊')">
            取得最近可申請機構資訊
          </button>
          <button class="chip outline" @click="toast('檢視 A 文件')">檢視</button>
          <button class="chip outline" @click="toast('檢視 B 文件')">檢視</button>
          <button class="chip outline" @click="toast('取得最近繳交機構資訊')">
            取得最近繳交機構資訊
          </button>
        </div>
      </main>

      <!-- 右欄：檢核表 -->
      <aside class="right card">
        <ul class="checklist">
          <li v-for="c in checks" :key="c.id" :class="['check', c.status]">
            <span class="dot" />
            <span class="text">{{ c.label }}</span>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MermaidRenderer from '~/components/MermaidRenderer.vue' // 先保留

type Item = { id: string; name: string }

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
      A["1. 準備就醫證明"] --> B["2. 填寫 A 文件"]
      B --> C["3. 填寫 B 文件"]
      C --> D["4. 7/31 前繳交到 XXX 單位"]
      D --> E["5. 等待審核通知"]
      classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
      class A,B,C,D,E step
  `,
  sick: `
    flowchart TB
      A["1. 請假與診斷/休養證明"] --> B["2. 檢附薪資與在保資料"]
      B --> C["3. 送件到勞保局"]
      C --> D["4. 審核與撥款"]
      classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
      class A,B,C,D step
  `,
  impair: `
    flowchart TB
      A["1. 醫療穩定後"] --> B["2. 申請失能等級評估"]
      B --> C["3. 準備身分/就保/醫療文件"]
      C --> D["4. 送件審查"]
      D --> E["5. 通知結果與給付"]
      classDef step fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#0f172a,rx:6,ry:6;
      class A,B,C,D,E step
  `
}

const selected = ref<keyof typeof charts>('medical')
const current = computed(() => ({
  id: selected.value,
  name: eligibleList.value.find(x => x.id === selected.value)?.name ?? '災保醫療給付',
  chart: charts[selected.value]
}))

function toast(Data: string){
  console.log(Data)
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
      { id: 1, label: '醫師休養證明尚未上傳', status: 'warn' },
      { id: 2, label: '請假證明已核章', status: 'ok' },
      { id: 3, label: '薪資資料待核對', status: 'warn' }
    ]
  }
  return [
    { id: 1, label: '失能等級尚未評估', status: 'error' },
    { id: 2, label: '身分/就保文件齊全', status: 'ok' }
  ]
})


</script>

<style scoped>
:root{
  --fs-sm: 15px;
  --fs-md: 16.5px;
  --fs-lg: 18px;
  --fs-xl: 20px;

  --teal:#0ea5a4;
  --green:#10b981;
  --red:#ef4444;
  --amber:#f59e0b;
  --slate-900:#0f172a;
  --slate-700:#334155;
  --slate-300:#cbd5e1;
  --slate-200:#e5e7eb;
  --bg:#f8fafc;
  --white:#fff;
}

/* 頁面與頂欄 */
.benefit-page{ background:var(--bg); min-height:100vh; color:var(--slate-900); }
.topbar{ background:#0ea5a4; }
.topbar-inner{ max-width:1200px; margin:0 auto; padding:10px 16px; }
.top-left{ display:flex; gap:12px; }
.top-pill{
  display:inline-block; padding:8px 14px; border-radius:999px;
  background:#fff; color:#0ea5a4; font-weight:800; font-size:var(--fs-md);
  text-decoration:none; border:1px solid transparent;
}
.top-pill.outline{ background:transparent; color:#fff; border-color:#fff; }

/* 版心 */
.grid{
  max-width:1200px; margin:16px auto; padding:0 16px;
  display:grid; gap:16px; grid-template-columns: 300px 1fr 320px;
}

/* 中/右卡片外框 */
.card{ background:var(--white); border:1px solid var(--slate-200); border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,.06); }

/* ===== 左欄：參考圖樣式 ===== */
.left{ display:flex; flex-direction:column; gap:12px; }

.left-card{
  background:#fff;
  border:1px solid var(--slate-200);
  border-radius:12px;
  box-shadow:0 1px 3px rgba(0,0,0,.06);
  padding:12px 10px;
}

.left-title{
  display:flex; align-items:center; gap:8px;
  font-weight:900; font-size:18px; line-height:1;
  margin-bottom:8px;
}
.left-title.ok{ color:#10b981; }
.left-title.ng{ color:#ef4444; }

.left-icon{
  width:18px; height:18px; border-radius:999px;
  display:inline-grid; place-items:center; font-size:12px; line-height:1;
  border:2px solid currentColor;
}
.left-icon.ok{ color:#10b981; }
.left-icon.ng{ color:#ef4444; }

.left-list{
  list-style:none; margin:0; padding:0;
  display:flex; flex-direction:column; gap:8px;
}
.left-item{
  padding:10px 12px;
  border-radius:4px;              /* 方角 */
  font-weight:800; font-size:16.5px;
  color:#6b7280;                  /* 未選灰字 */
  cursor:pointer;
  transition:background .15s ease, color .15s ease;
}
.left-item.active{
  background:#0a8f6f;            /* 選中整塊綠底 */
  color:#fff;
}
.left-item.disabled{
  opacity:.55; cursor:not-allowed;
}

/* 中欄 */
.center{ padding:16px; display:flex; flex-direction:column; gap:12px; }
.flow-title{ margin:0; font-size:var(--fs-xl); font-weight:900; }
.mmd{ overflow:auto; }
.chips{ display:flex; flex-wrap:wrap; gap:10px; }
.chip{ padding:6px 12px; border-radius:8px; font-weight:800; font-size:var(--fs-sm); }
.chip.outline{ background:#fff; border:1px solid var(--teal); color:var(--teal); }

/* 右欄：檢核表 */
.right{ padding:16px; }
.checklist{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.check{
  display:flex; align-items:center; gap:10px;
  padding:10px 12px; border-radius:999px; font-weight:900; font-size:var(--fs-md);
  border:2px solid currentColor; background:#fff;
}
.check .dot{ width:12px; height:12px; border-radius:999px; background:#fff; border:2px solid currentColor; }
.check.ok{ color:var(--green); }
.check.warn{ color:var(--amber); }
.check.error{ color:var(--red); }
.text{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* RWD */
@media (max-width:1100px){ .grid{ grid-template-columns:1fr; } }
</style>
