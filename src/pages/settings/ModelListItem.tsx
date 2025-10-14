import { Button } from '@/components/ui/button'
import { formatBytesToGB } from '@/lib/formatBytes'
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
        'flex items-center justify-between p-3 border rounded-lg transition-colors duration-300',
        isSelected &&
          'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600',
      )}
    >
      <div>
        <div className="font-medium">{model.name}</div>
        <div className="text-sm text-muted-foreground">
          Size: {formatBytesToGB(model.size)}
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
