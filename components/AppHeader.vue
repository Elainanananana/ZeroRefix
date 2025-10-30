<template>
  <header class="app-header">
    <div class="inner">
      <NuxtLink to="/jobs" class="pill">職缺資訊</NuxtLink>
      <NuxtLink to="/chat" class="pill alt">補助諮詢</NuxtLink>
    </div>
    <NuxtImg src="/ZeroRefix.png" alt="ZeroRefix" color="#fff" width="200" height="28" class="logo" />

  </header>
</template>

<script setup lang="ts">
// 全站共用固定抬頭
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background: #008E73;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.inner {
  max-width: 1200px;
  margin: 0;
  padding: 10px 20px;
  display: flex;
  gap: 12px;
}
.pill {
  width: 120px;
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: #008E73;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}
.pill.alt {
  color: #008E73;
  background: #fff;
}
.logo {
  color: #fff;
  margin-left: 24%;
}
/* .rubik-glitch-regular {
  font-family: "Rubik Glitch", system-ui;
  font-weight: 400;
  font-style: normal;
  margin-left: 25%;
}  */
</style>


