import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
}

export function Tabs({ tabs, value, defaultValue, onChange, className }: TabsProps) {
  const generatedId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [internalValue, setInternalValue] = useState(defaultValue ?? tabs.find((tab) => !tab.disabled)?.id ?? '')
  const selectedValue = value ?? internalValue
  const activeTab = tabs.find((tab) => tab.id === selectedValue && !tab.disabled) ?? tabs.find((tab) => !tab.disabled)

  function selectTab(tabId: string) {
    if (value === undefined) setInternalValue(tabId)
    onChange?.(tabId)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    const enabledIndexes = tabs.flatMap((tab, index) => (tab.disabled ? [] : [index]))
    const currentPosition = enabledIndexes.indexOf(currentIndex)
    if (currentPosition < 0) return

    let nextPosition: number | undefined

    if (event.key === 'ArrowRight') nextPosition = (currentPosition + 1) % enabledIndexes.length
    if (event.key === 'ArrowLeft') nextPosition = (currentPosition - 1 + enabledIndexes.length) % enabledIndexes.length
    if (event.key === 'Home') nextPosition = 0
    if (event.key === 'End') nextPosition = enabledIndexes.length - 1
    if (nextPosition === undefined) return

    event.preventDefault()

    const nextIndex = enabledIndexes[nextPosition]
    const nextTab = tabs[nextIndex]
    if (!nextTab) return

    selectTab(nextTab.id)
    tabRefs.current[nextIndex]?.focus()
  }

  if (!activeTab) return null

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 border-b border-border" aria-label="Abas">
        {tabs.map((tab, index) => {
          const isSelected = tab.id === activeTab.id
          const tabId = `${generatedId}-tab-${tab.id}`
          const panelId = `${generatedId}-panel-${tab.id}`

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              disabled={tab.disabled}
              className={cn(
                'border-b-2 border-transparent px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-primary',
                isSelected && 'border-primary text-primary',
                tab.disabled && 'cursor-not-allowed opacity-50',
              )}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        id={`${generatedId}-panel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`${generatedId}-tab-${activeTab.id}`}
        tabIndex={0}
        className="pt-4"
      >
        {activeTab.content}
      </div>
    </div>
  )
}