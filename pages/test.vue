<script setup>
import MermaidChart from '~/components/MermaidChart.vue'
const flow = `graph TD;
  A[開始] --> B{判斷};
  B -->|是| C[結果1];
  B -->|否| D[結果2];
  C --> E[結束];
  D --> E[結束];`
</script>
<template>
  <div class="test-page">
    <h1>Mermaid 流程圖測試</h1>
    <p>這是一個簡單的決策流程圖範例：</p>
    <MermaidChart :code="flow" />
    <div class="navigation">
      <NuxtLink to="/" class="btn">回到首頁</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.test-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
  text-align: center;
}

p {
  color: #7f8c8d;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 1.1rem;
}

.navigation {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #2980b9;
}
</style>