<template>
  <div class="mmd-wrap">
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

const stageStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left'
}))

async function render() {
  if (!box.value) return

  if (!props.chart) {
    box.value.innerHTML = ''
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

    .node foreignObject > div {
      text-align: left !important;

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
}

onMounted(render)

watch(
  () => props.chart,
  async () => {
    await nextTick()
    render()
  }
)
</script>

<style scoped>
.mmd-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mmd-stage {
  background: #fff;
  border-radius: 8px;
}

.mermaid-container {
  min-width: 20vw;
  width: max-content;
}

.mermaid-container :deep(svg) {
  height: auto;
  width: 100%;
  font-size: 12px;
}
</style>
