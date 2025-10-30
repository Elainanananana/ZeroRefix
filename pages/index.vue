<template>
  <div class="container">
    <h1>件步如飛</h1>
    <p>歡迎來到件步如飛！</p>
    <div class="links">
      <!-- <NuxtLink to="/test" class="btn">查看測試流程圖</NuxtLink> -->
      <NuxtLink to="/chat" class="btn">進入聊天室</NuxtLink>
      <NuxtLink to="/benefits" class="btn">流程圖</NuxtLink>
    </div>
    <div class="links">
      <NuxtLoadingIndicator />
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

p {
  color: #7f8c8d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.links {
  display: flex;
  justify-content: center;
  gap: 1rem;
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
