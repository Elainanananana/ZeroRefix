<template>
  <div class="jobsboard-root mx-auto max-w-6xl px-4 py-6 text-[18px] md:text-[19px] leading-8">
    <p class="text-sm text-gray-500 mb-2">筆數：{{ source.length }}</p>

    <header class="mb-6">
      <div class="flex items-center gap-3">
        <button class="px-5 py-2 rounded-full text-white font-semibold shadow hover:opacity-95 transition" :style="brandBg">
          職缺資訊
        </button>

        <div class="ml-auto flex items-center gap-2">
          <input v-model="q" type="search" placeholder="搜尋職缺 / 公司 / 地點 / 內容"
                 class="w-72 md:w-96 rounded-2xl border border-gray-200 px-4 py-3 text-[16px] outline-none focus:ring-4 focus:ring-emerald-50" />
          <button class="px-4 py-3 rounded-2xl border text-[16px] font-medium hover:bg-gray-50" @click="clearSearch">清除</button>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <section>
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="rounded-2xl border bg-white p-6 shadow-sm">
            <div class="animate-pulse space-y-3">
              <div class="h-6 bg-gray-200 rounded w-1/3"></div>
              <div class="h-5 bg-gray-200 rounded w-1/4"></div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="h-12 bg-gray-200 rounded-xl"></div>
                <div class="h-12 bg-gray-200 rounded-xl"></div>
                <div class="h-12 bg-gray-200 rounded-xl"></div>
              </div>
              <div class="h-10 bg-gray-200 rounded-xl w-32"></div>
            </div>
          </div>
        </div>

        <div v-else-if="filtered.length === 0" class="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <p class="text-gray-700">目前沒有資料，或關鍵字/篩選條件沒有符合。</p>
        </div>

        <ul v-else class="grid gap-4 md:grid-cols-4 lg:grid-cols-1">
          <li v-for="(job, idx) in paged" :key="idx">
            <article class="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
              <div class="flex items-start gap-5">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-[20px] md:text-[21px] font-semibold leading-8 truncate">
                      {{ job.occuDesc || '—' }}
                    </h3>
                    <span class="text-sm px-2 py-0.5 rounded-full border bg-emerald-50" :style="brandText">
                      {{ job.workType || '—' }}
                    </span>
                  </div>

                  <p class="mt-1 text-gray-600 truncate">{{ job.unit || '—' }}</p>

                  <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-base">
                    <div class="rounded-xl border p-3 bg-gray-50/60">
                      <div class="text-gray-600 mb-1">地點</div>
                      <div class="font-medium truncate">{{ job.subj || job.workAddr || '—' }}</div>
                    </div>
                    <div class="rounded-xl border p-3 bg-gray-50/60">
                      <div class="text-gray-600 mb-1">薪資</div>
                      <div class="font-medium">{{ job.salary || '—' }}</div>
                    </div>
                    <div class="rounded-xl border p-3 bg-gray-50/60">
                      <div class="text-gray-600 mb-1">學歷</div>
                      <div class="font-medium">{{ job.educationDesc || '—' }}</div>
                    </div>
                  </div>

                  <div class="mt-4">
                    <button 
                      class="text-base text-gray-600 cursor-pointer flex items-center gap-2"
                      @click="toggleDetails(idx)"
                    >
                      <span class="transform transition-transform duration-200" :class="{ 'rotate-90': expandedDetails.has(idx) }" style="color: #0a8f6f;">
                        ▶
                      </span>
                      <span>{{ expandedDetails.has(idx) ? '收起詳情' : '查看詳情' }}</span>
                    </button>
                    <div v-if="expandedDetails.has(idx)" class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-base">
                      <div class="rounded-xl border p-3">
                        <div class="text-gray-600 mb-1">名額</div>
                        <div class="font-medium">{{ job.count ?? '—' }}</div>
                      </div>
                      <div class="rounded-xl border p-3">
                        <div class="text-gray-600 mb-1">班別</div>
                        <div class="font-medium">{{ job.shift || '—' }}</div>
                      </div>
                      <div class="rounded-xl border p-3">
                        <div class="text-gray-600 mb-1">更新日</div>
                        <div class="font-medium">{{ job.trandate || '—' }}</div>
                      </div>
                      <div class="md:col-span-3 rounded-xl border p-3">
                        <div class="text-gray-600 mb-1">職務內容</div>
                        <div class="font-medium whitespace-pre-wrap break-words">
                          {{ job.jobdetail || '—' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="shrink-0 flex flex-col items-end gap-2">
                  <button
                    class="px-5 py-3 text-[16px] rounded-xl text-white font-semibold shadow hover:opacity-95 transition"
                    :style="brandBg"
                    @click="open(job.urlQuery)"
                    :disabled="!job.urlQuery"
                    :class="{ 'opacity-50 cursor-not-allowed': !job.urlQuery }"
                    title="前往職缺頁面"
                  >
                    查看 / 應徵
                  </button>
                </div>
              </div>
            </article>
          </li>
        </ul>

        <div v-if="pages > 1" class="mt-7 flex items-center justify-center gap-3">
          <button class="px-3.5 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40" :disabled="page===1" @click="goPage(page-1)">上一頁</button>
          <span class="text-base text-gray-700">第 {{ page }} / {{ pages }} 頁</span>
          <button class="px-3.5 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40" :disabled="page===pages" @click="goPage(page+1)">下一頁</button>
        </div>
      </section>

      <aside class="space-y-4">
        <div class="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 class="font-semibold mb-3" :style="brandText">快速篩選</h3>
          <div class="flex flex-wrap gap-2">
            <button class="px-3.5 py-2 rounded-full border text-base hover:bg-gray-50"
              :class="{ '!text-white': activeTag==='全職', '!border-0': activeTag==='全職' }"
              :style="activeTag==='全職' ? brandBg : {}" @click="toggleTag('全職')">全職</button>
            <button class="px-3.5 py-2 rounded-full border text-base hover:bg-gray-50"
              :class="{ '!text-white': activeTag==='兼職', '!border-0': activeTag==='兼職' }"
              :style="activeTag==='兼職' ? brandBg : {}" @click="toggleTag('兼職')">兼職</button>
            <button class="px-3.5 py-2 rounded-full border text-base hover:bg-gray-50"
              :class="{ '!text-white': activeTag==='實習', '!border-0': activeTag==='實習' }"
              :style="activeTag==='實習' ? brandBg : {}" @click="toggleTag('實習')">實習</button>
            <button class="px-3.5 py-2 rounded-full border text-base hover:bg-gray-50" @click="toggleTag(null)">全部</button>
          </div>
        </div>

        <div class="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 class="font-semibold mb-3" :style="brandText">整體復工率</h3>
          <p class="text-2xl font-bold text-gray-800 leading-7">
            65.9%
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type JobItem = {
  occuDesc: string
  unit: string
  subj?: string
  workAddr?: string
  workType?: string
  shift?: string
  salary?: string
  count?: string | number
  educationDesc?: string
  trandate?: string
  urlQuery?: string
  jobdetail?: string
}

const props = defineProps<{
  items: JobItem[]
  brandHex?: string
  pageSize?: number
  loading?: boolean
}>()

const brand = computed(() => props.brandHex ?? '#0a8f6f')
const brandBg = computed(() => ({ backgroundColor: brand.value }))
const brandText = computed(() => ({ color: brand.value }))

const loading = computed(() => !!props.loading)

const q = ref('')
const activeTag = ref<string | null>(null)
const page = ref(1)
const pageSize = computed(() => props.pageSize ?? 10)

// 管理詳情展開狀態（只在當前頁面保持）
const expandedDetails = ref<Set<number>>(new Set())

// 切換詳情展開狀態
function toggleDetails(index: number) {
  if (expandedDetails.value.has(index)) {
    expandedDetails.value.delete(index)
  } else {
    expandedDetails.value.add(index)
  }
}

// 重置所有展開狀態
function resetExpandedDetails() {
  expandedDetails.value.clear()
}

const source = computed<JobItem[]>(() => Array.isArray(props.items) ? props.items : [])

function normalizeZh(s = '') { return s.toString().replace(/\s+/g, '').normalize('NFKC').toLowerCase() }
watch(q, () => { 
  page.value = 1
  resetExpandedDetails() // 搜尋時重置展開狀態
})

const filtered = computed(() => {
  const query = normalizeZh(q.value)
  return source.value.filter(j => {
    const text = [j.occuDesc, j.unit, j.subj, j.workAddr, j.workType, j.salary, j.educationDesc, j.jobdetail]
      .filter(Boolean).join('|')
    const okQ = query ? normalizeZh(text).includes(query) : true
    const okTag = activeTag.value ? (j.workType ?? '').includes(activeTag.value) : true
    return okQ && okTag
  })
})

const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const paged = computed(() => {
  page.value = Math.min(page.value, pages.value)
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function clearSearch() { 
  q.value = ''; 
  activeTag.value = null; 
  page.value = 1
  resetExpandedDetails() // 清除搜尋時重置展開狀態
}
function toggleTag(tag: string | null) { 
  activeTag.value = activeTag.value === tag ? null : tag; 
  page.value = 1
  resetExpandedDetails() // 切換標籤時重置展開狀態
}
function open(url?: string) { if (url) window.open(url, '_blank', 'noopener,noreferrer') }
function goPage(n: number) {
  page.value = Math.min(Math.max(1, n), pages.value)
  resetExpandedDetails() // 換頁時重置展開狀態
  requestAnimationFrame(() => {
    document.querySelector('.jobsboard-root')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
</script>

<style scoped>
.jobsboard-root { font-size: 18px; line-height: 1.75; }
.jobsboard-root input[type="search"], .jobsboard-root button { font-size: 16px; }

/* 箭頭動畫 */
.rotate-180 {
  transform: rotate(180deg);
}
</style>
