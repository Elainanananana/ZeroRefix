import { ref } from 'vue'

const chartRef = ref('')            // optional override chart
const metaRef = ref(null)
const selectedIdRef = ref('')       // selected benefit id from chat

export function useMermaidChart() {
  function setChart(code, meta) {
    chartRef.value = code || ''
    if (typeof meta !== 'undefined') metaRef.value = meta
  }

  function clear() {
    chartRef.value = ''
    metaRef.value = null
  }

  function setSelected(id) {
    selectedIdRef.value = id || ''
  }

  return { chart: chartRef, meta: metaRef, selectedId: selectedIdRef, setChart, setSelected, clear }
}


