<template>
  <div>
    <QBtn label="fixture-qbtn" />
    <p id="q-version">
      {{ $q.version }}
    </p>
    <!-- Runtime probes for the JS-lookup options: the generated plugin
         asserting `import lang from ...` only proves the import was emitted.
         Reading the installed values proves the option reached Quasar. -->
    <p id="q-lang">
      {{ $q.lang.isoName }}
    </p>
    <p id="q-icon-set">
      {{ $q.iconSet.name }}
    </p>
  </div>
</template>

<script setup>
const $q = useQuasar()
</script>
