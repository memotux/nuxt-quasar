<template>
  <div>
    <QBtn label="fixture-qbtn" />
    <p id="q-version">
      {{ $q.version }}
    </p>
  </div>
</template>

<script setup>
const $q = useQuasar()
</script>
