<script setup>
import { onMounted, ref } from 'vue'

const props = defineProps({
  code: { type: String, required: true },
  theme: { type: String, default: 'default' }
})

const container = ref(null)
const svgId = 'mermaid-' + Math.random().toString(36).slice(2)

onMounted(async () => {
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    theme: props.theme
  })
  if (!container.value) return
  const { svg } = await mermaid.render(svgId, props.code)
  container.value.innerHTML = svg
})
</script>

<template>
  <ClientOnly>
    <div ref="container" class="mermaid-container"></div>
  </ClientOnly>
</template>

<style scoped>
.mermaid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.mermaid-container :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>

