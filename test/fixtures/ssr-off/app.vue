<template>
  <div>
    <QBtn
      label="fixture-qbtn"
      @click="notify"
    />
    <p id="q-version">
      {{ $q.version }}
    </p>
  </div>
</template>

<script setup>
const $q = useQuasar()
const notify = () => $q.notify('hydration-ok')
</script>
