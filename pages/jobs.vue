<script setup lang="ts">
import JobsBoard from '~/components/JobsBoard.vue'
import { computed } from 'vue'

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
}

// ✅ 指定 API 回傳型別 { items: JobItem[] }
const { data: jobsRes, pending, error } = await useFetch<{ items: JobItem[] }>('/api/jobs')

// ✅ 做一個乾淨的陣列給元件
const items = computed<JobItem[]>(() => jobsRes.value?.items ?? [])
</script>

<template>
  <!-- 直接丟 items（Ref 會自動在 template 解包），或寫 items || [] 都行 -->
   <AppHeader />
  <JobsBoard :items="items" brand-hex="#0a8f6f" />
</template>
