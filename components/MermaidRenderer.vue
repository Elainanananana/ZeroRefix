<template>
  <div ref="box" class="mermaid-container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import mermaid from 'mermaid'

const props = defineProps<{ chart: string }>()
// const box = ref<HTMLElement | null>(null)

async function render() {
//   if (!box.value) return
//   mermaid.initialize({
//     startOnLoad: false,
//     securityLevel: 'loose',
//     theme: 'base',
//     flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' }
//   })
//   const id = 'mmd-' + Math.random().toString(36).slice(2)
//   const { svg } = await mermaid.render(id, props.chart)
//   box.value.innerHTML = svg
}

onMounted(render)
watch(() => props.chart, async () => { await nextTick(); render() })
</script>

<style scoped>
.mermaid-container :deep(svg){ width:100%; height:auto; }
</style>
