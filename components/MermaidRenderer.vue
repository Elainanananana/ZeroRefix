<template>
  <div class="mmd-wrap">
    <div class="mmd-toolbar">
      <button class="tb" @click="zoomOut" :disabled="scale<=0.5">－</button>
      <button class="tb" @click="reset">重設</button>
      <button class="tb" @click="zoomIn" :disabled="scale>=2">＋</button>
      <span class="gap" />
      <button class="tb" @click="downloadPdf" :disabled="!hasSvg">下載 PDF</button>
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
  theme: 'base',  // 用 base 比 neutral 更好客製
  themeVariables: {
    primaryColor: '#ffffff',             // 節點底色
    primaryBorderColor: '#9fdccf',       // 柔和綠框(主色#0a8f6f的淺化)
    primaryTextColor: '#0f172a',
    lineColor: '#0a8f6f',                // 邊線/箭頭=主色
    secondaryColor: '#f4fbf8',           // 子圖/群組底色(很淺的綠)
    tertiaryColor: '#ecf7f3',
    fontFamily: "Inter, 'Noto Sans TC', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    fontSize: '14px',
    borderRadius: '12px',                // 圓角
    nodeSpacing: 48,
    rankSpacing: 40,
    edgeLabelBackground: '#0a8f6f20'     // 邊標籤淡綠底
  },
  // 讓節點寬度依內容自動擴展，並禁用自動換行
  flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis', padding: 12 }
})
  const id = 'mmd-' + Math.random().toString(36).slice(2)
  const { svg } = await mermaid.render(id, props.chart)
  // 注入顏色樣式，避免在不同渲染器或 PDF 匯出時變成黑底
  const injected = svg.replace(
  /<svg(.*?)>/,
  `<svg$1>
  <defs>
    <!-- 柔和陰影: 透明、輕模糊，PDF 也能吃 -->
    <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0a8f6f" flood-opacity="0.18"/>
    </filter>
  </defs>
  <style>
    /* 基本節點(方塊/菱形/圓) */
    .node rect, .node polygon, .node ellipse {
      fill: #ffffff;
      stroke: #9fdccf;
      stroke-width: 2px;
      rx: 12px; ry: 12px;
      filter: url(#nodeShadow);
    }

    /* 節點文字 */
    .node .label, .node text {
      fill: #0f172a !important;
      font-weight: 600;
      /* 保留換行符，禁止自動換行 */
      white-space: pre;
      /* 讓多行內容靠左對齊 */
      text-align: left;
    }

    /* 邊線與箭頭 */
    .edgePaths path, path.flowchart-link { 
      stroke: #0a8f6f; 
      stroke-width: 1.8px; 
    }
    .arrowheadPath, marker path { 
      fill: #0a8f6f; 
      stroke: #0a8f6f; 
    }

    /* 邊線標籤底色 */
    .edgeLabel rect {
      fill: #0a8f6f20; 
      stroke: none;
      rx: 6px; ry: 6px;
    }
    .edgeLabel tspan, .edgeLabel foreignObject { color: #0f172a; }

    /* 子圖/群組(Cluster) */
    .cluster rect {
      fill: #f4fbf8;
      stroke: #9fdccf;
      stroke-width: 2px;
      rx: 14px; ry: 14px;
    }
    .cluster .label, .cluster text { fill: #0a8f6f; font-weight: 700; }

    /* ==== 可選：三種語意樣式，供你在圖上標註 ==== */
    /* 強調(主動作/關鍵節點)： class A accent; */
    .node.accent rect, .node.accent polygon, .node.accent ellipse {
      fill: #0a8f6f; 
      stroke: #0a8f6f;
    }
    .node.accent .label, .node.accent text { fill: #ffffff !important; }

    /* 警示(例外/風險)： class B warn; */
    .node.warn rect, .node.warn polygon, .node.warn ellipse {
      fill: #fff7ed;
      stroke: #f59e0b;
    }
    .node.warn .label, .node.warn text { fill: #92400e !important; }

    /* 次要(流程支線/可選)： class C dashed; */
    .node.dashed rect, .node.dashed polygon, .node.dashed ellipse {
      stroke-dasharray: 6 3;
    }

    /* 文字通用（避免不同渲染器走鐘） */
    .label, .nodeLabel, .edgeLabel, text {
      fill: #0f172a !important; 
      color: #0f172a !important; 
      font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Noto Sans TC', 'Apple Color Emoji', 'Segoe UI Emoji';
    }
  </style>`
)
  box.value.innerHTML = injected
  hasSvg.value = true
}

onMounted(render)
watch(() => props.chart, async () => { await nextTick(); render() })

function zoomIn(){ scale.value = Math.min(2, +(scale.value + 0.1).toFixed(2)) }
function zoomOut(){ scale.value = Math.max(0.5, +(scale.value - 0.1).toFixed(2)) }
function reset(){ scale.value = 1 }
async function downloadPdf(){
  if (!box.value) return
  const svgEl = box.value.querySelector('svg')
  if (!svgEl) return

  // 將 SVG 直接用 canvg 畫到 canvas，避免跨域造成的 tainted canvas
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgEl)

  // 取用 viewBox，退而求其次讀取寬高或邊界盒
  const vb = (svgEl as any).viewBox?.baseVal
  const fallbackRect = (svgEl as any).getBBox ? (svgEl as any).getBBox() : null
  const rawWidth = vb?.width || (svgEl as any).width?.baseVal?.value || fallbackRect?.width || svgEl.clientWidth || 1000
  const rawHeight = vb?.height || (svgEl as any).height?.baseVal?.value || fallbackRect?.height || svgEl.clientHeight || 600

  const dpiScale = 2
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(rawWidth * dpiScale)
  canvas.height = Math.ceil(rawHeight * dpiScale)
  const ctx = canvas.getContext('2d')!

  const { Canvg } = await import('canvg')
  const v = Canvg.fromString(ctx, svgString, { ignoreMouse: true, ignoreAnimation: true })
  // 白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // 以原始寬高渲染，再用高解析畫布縮放
  ctx.save()
  ctx.scale(dpiScale, dpiScale)
  v.resize(rawWidth, rawHeight, 'xMidYMid meet')
  await v.render()
  ctx.restore()

  const dataUrl = canvas.toDataURL('image/png')

  const { default: jsPDF } = await import('jspdf')
  const isLandscape = rawWidth > rawHeight
  const pageW = isLandscape ? 842 : 595  // A4 pt
  const pageH = isLandscape ? 595 : 842
  const margin = 24
  const scale = Math.min((pageW - margin * 2) / rawWidth, (pageH - margin * 2) / rawHeight)
  const drawW = Math.round(rawWidth * scale)
  const drawH = Math.round(rawHeight * scale)
  const x = Math.round((pageW - drawW) / 2)
  const y = Math.round((pageH - drawH) / 2)
  const pdf = new jsPDF({ orientation: isLandscape ? 'l' : 'p', unit: 'pt', format: 'a4' })
  pdf.addImage(dataUrl, 'PNG', x, y, drawW, drawH)
  pdf.save('flowchart.pdf')
}
</script>

<style scoped>
.mmd-wrap{ display:flex; flex-direction:column; gap:10px; }
.mmd-toolbar{ display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:6px; }
.tb{ padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; color:#0f172a; cursor:pointer; font-weight:700; }
.tb:disabled{ opacity:.5; cursor:not-allowed; }
.gap{ flex:1 }
.mmd-stage{ overflow:auto; background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px; box-shadow:0 1px 2px rgba(0,0,0,.04); }
.mermaid-container{ min-width:600px; width: max-content; }
.mermaid-container :deep(svg){ height:auto; }
</style>
