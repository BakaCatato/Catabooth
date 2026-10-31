// TODO: Full layout/filter picker implementation in a follow-up prompt.
import ScreenPlaceholder, { StubButton } from '../components/ui/ScreenPlaceholder'
import { FILTERS, LAYOUTS, type CustomizationProps } from '../types/photobooth'

export default function Customization({
  frameCount,
  layout,
  filter,
  onLayoutChange,
  onFilterChange,
  onConfirm,
  onRetake,
}: CustomizationProps) {
  return (
    <ScreenPlaceholder title="Customize">
      {LAYOUTS.filter((l) => l.supports.includes(frameCount)).map((l) => (
        <StubButton key={l.id} onClick={() => onLayoutChange(l.id)}>
          {l.label} {l.id === layout ? '★' : ''}
        </StubButton>
      ))}
      {Object.values(FILTERS).map((f) => (
        <StubButton key={f.id} onClick={() => onFilterChange(f.id)}>
          {f.label} {f.id === filter ? '★' : ''}
        </StubButton>
      ))}
      <StubButton onClick={onRetake}>Retake</StubButton>
      <StubButton onClick={onConfirm}>Done</StubButton>
    </ScreenPlaceholder>
  )
}

