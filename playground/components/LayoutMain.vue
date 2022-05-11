<template>
  <ClientOnly>
    <QLayout view="hHh lpR fFf">
      <QPageContainer>
        <QPage padding class="column flex-center q-gutter-xl">
          <slot />
        </QPage>
      </QPageContainer>
    </QLayout>
  </ClientOnly>
</template>
