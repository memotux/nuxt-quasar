<template>
  <NuxtLayout>
    <QBtn
      label="Quasar + Nuxt3"
      icon="bookmark"
      size="xl"
      color="primary"
      @click="playNotify"
    />
    <div
      v-ripple
      class="relative-position container column flex-center text-white"
      :class="classes"
    >
      <p>Click/tap me</p>
      <p>{{ $q.screen.name }}</p>
      <p>{{ newDate }}</p>
    </div>
  </NuxtLayout>
</template>

<script setup>
const $q = useQuasar()
const playNotify = () => {
  console.log('Playing Notify')
  $q.notify('Congrats! you have: Quasar + Nuxt3')
}

const colors = [
  'primary',
  'amber',
  'secondary',
  'orange',
  'accent',
  'lime',
  'cyan',
  'purple',
  'brown',
  'blue',
]
const color = ref(colors[0])
const index = ref(0)

let timer

onMounted(() => {
  timer = setInterval(() => {
    index.value = (index.value + 1) % colors.length
    color.value = colors[index.value]
  }, 3000)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
})
const classes = computed(() => `bg-${color.value}`)

const newDate = qdate.addToDate(new Date(), { days: 7, months: 1 })
</script>

<style lang="sass">
.q-btn
  border: 1rem solid $secondary
</style>
