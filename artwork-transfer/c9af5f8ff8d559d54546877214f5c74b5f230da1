<script setup lang="ts">
defineProps<{ name: 'dice' | 'save' | 'settings' | 'menu' | 'pause' | 'play' | 'left' | 'right' }>()
</script>
<template>
  <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'dice'"><rect x="3" y="3" width="18" height="18" rx="4"/><g fill="currentColor" stroke="none"><circle cx="7.5" cy="7.5" r="1.5"/><circle cx="16.5" cy="7.5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></g></template>
    <template v-else-if="name === 'save'"><path d="M4 3h13l4 4v14H3V3Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/></template>
    <template v-else-if="name === 'settings'"><path d="m9 3-.6 2.4-2 .9-2.2-.7-2 3.4L4 10.8v2.4l-1.8 1.8 2 3.4 2.2-.7 2 .9L9 21h6l.6-2.4 2-.9 2.2.7 2-3.4-1.8-1.8v-2.4L21.8 9l-2-3.4-2.2.7-2-.9L15 3Z"/><circle cx="12" cy="12" r="3"/></template>
    <template v-else-if="name === 'menu'"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 8h1m3 0h6M7 12h1m3 0h6M7 16h1m3 0h6"/></template>
    <path v-else-if="name === 'pause'" d="M8 5v14M16 5v14" stroke-width="4"/>
    <path v-else-if="name === 'play'" d="m8 4 12 8-12 8Z" fill="currentColor" stroke="none"/>
    <path v-else-if="name === 'left'" d="m15 4-8 8 8 8" stroke-width="3"/>
    <path v-else d="m9 4 8 8-8 8" stroke-width="3"/>
  </svg>
</template>
<style scoped>.ui-icon{width:24px;height:24px;flex:none;vertical-align:middle}</style>
