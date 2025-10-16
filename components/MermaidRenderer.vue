<template>
  <div class="mmd-wrap">
    <div class="mmd-toolbar">
      <button class="tb" @click="zoomOut" :disabled="scale<=0.5">－</button>
      <button class="tb" @click="reset">重設</button>
      <button class="tb" @click="zoomIn" :disabled="scale>=2">＋</button>
      <span class="gap" />
      <button class="tb" @click="downloadSvg" :disabled="!hasSvg">下載 SVG</button>
    </div>
    <div class="mmd-stage">
      <div ref="box" class="mermaid-container" :style="stageStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick, computed } from 'vue'
import mermaid from 'mermaid'

const props = defineProps<{ chart: string }>()
const box = ref<HTMLElement | null>(null)
const scale = ref(1)
const hasSvg = ref(false)
const stageStyle = computed(() => ({ transform: `scale(${scale.value})`, transformOrigin: 'top left' }))

async function render() {
  if (!box.value) return
  if (!props.chart) {
    box.value.innerHTML = ''
    hasSvg.value = false
    return
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' }
  })
  const id = 'mmd-' + Math.random().toString(36).slice(2)
  const { svg } = await mermaid.render(id, props.chart)
  box.value.innerHTML = svg
  hasSvg.value = true
}

onMounted(render)
watch(() => props.chart, async () => { await nextTick(); render() })

function zoomIn(){ scale.value = Math.min(2, +(scale.value + 0.1).toFixed(2)) }
function zoomOut(){ scale.value = Math.max(0.5, +(scale.value - 0.1).toFixed(2)) }
function reset(){ scale.value = 1 }
function downloadSvg(){
  if (!box.value) return
  const svgEl = box.value.querySelector('svg')
  if (!svgEl) return
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svgEl)
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'flowchart.svg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.mmd-wrap{ display:flex; flex-direction:column; gap:10px; }
.mmd-toolbar{ display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:6px; }
.tb{ padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; color:#0f172a; cursor:pointer; font-weight:700; }
.tb:disabled{ opacity:.5; cursor:not-allowed; }
.gap{ flex:1 }
.mmd-stage{ overflow:auto; background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px; box-shadow:0 1px 2px rgba(0,0,0,.04); }
.mermaid-container{ min-width:600px; }
.mermaid-container :deep(svg){ height:auto; }
</style>
