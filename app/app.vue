<template>
  <div>
    <AppHeader v-if="!$route.path.startsWith('/benefits')" />
    <NuxtPage />
  </div>
</template>