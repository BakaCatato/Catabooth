// TODO: Full implementation in a follow-up prompt.
import ScreenPlaceholder, { StubButton } from '../components/ui/ScreenPlaceholder'
import { FRAME_OPTIONS, type FrameSelectionProps } from '../types/photobooth'

export default function FrameSelection({ selected, onSelect, onBack }: FrameSelectionProps) {
  return (
    <ScreenPlaceholder title="How many shots?">
      {FRAME_OPTIONS.map((n) => (
        <StubButton key={n} onClick={() => onSelect(n)}>
          {n} {n === selected ? '★' : ''}
        </StubButton>
      ))}
      <StubButton onClick={onBack}>Back</StubButton>
    </ScreenPlaceholder>
  )
}

