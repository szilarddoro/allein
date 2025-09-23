import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OllamaModel {
  name: string
  size: number
}

interface ModelListItemProps {
  model: OllamaModel
  isSelected: boolean
  onSelect: (modelName: string) => void
}

export function ModelListItem({
  model,
  isSelected,
  onSelect,
}: ModelListItemProps) {
  function handleSelect() {
    if (isSelected) {
      return
    }

    onSelect(model.name)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 border-2 rounded-lg transition-all duration-300',
        isSelected && 'bg-zinc-50 border-zinc-300',
      )}
    >
      <div>
        <div className="font-medium">{model.name}</div>
        <div className="text-sm text-muted-foreground">
          Size: {(model.size / 1024 / 1024 / 1024).toFixed(2)} GB
        </div>
      </div>

      <Button
        variant={isSelected ? 'default' : 'outline'}
        size="sm"
        onClick={handleSelect}
      >
        {isSelected ? 'Selected' : 'Select'}
      </Button>
    </div>
  )
}
