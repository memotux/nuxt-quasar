<template>
  <QLayout view="hHh lpR fFf">
    <QHeader elevated>
      <QToolbar>
        <QList padding>
          <QItem clickable>
            <QItemSection>nav-item</QItemSection>
          </QItem>
        </QList>
      </QToolbar>
    </QHeader>
    <QPageContainer>
      <QPage padding>
        <QCard>
          <QCardSection>card-content</QCardSection>
        </QCard>
        <QSeparator />
        <QChip>chip-label</QChip>
      </QPage>
    </QPageContainer>
  </QLayout>
</template>
