import { ActivityIndicator } from '@/components/ActivityIndicator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { H1, H3, P } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { useFileListWithPreview } from '@/lib/files/useFileListWithPreview'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import MarkdownPreview from '@/pages/editor/MarkdownPreview'
import { CircleAlert, NotebookPen } from 'lucide-react'
import { useNavigate } from 'react-router'

export function BrowserPage() {
  const { data: files, status, refetch: reloadFiles } = useFileListWithPreview()
  const { mutateAsync: createFile } = useCreateFile()
  const sortedFiles = (files || []).sort(
    (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
  )

  const { toast } = useToast()
  const navigate = useNavigate()

  async function handleCreateFile() {
    try {
      const { path } = await createFile()
      navigate({
        pathname: '/editor',
        search: `?file=${path}&focus=true`,
      })
    } catch {
      toast.error('Failed to create file')
    }
  }

  if (status === 'pending') {
    return (
      <div className="flex-1 overflow-hidden flex justify-center items-center select-none">
        <ActivityIndicator>Loading files...</ActivityIndicator>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex-1 overflow-hidden flex flex-col justify-center items-center select-none">
        <P className="text-destructive flex flex-row gap-1 items-center text-sm">
          <CircleAlert className="w-4 h-4" />
          An error occurred while loading files.
        </P>

        <Button onClick={() => reloadFiles()}>Reload files</Button>
      </div>
    )
  }

  if (sortedFiles.length === 0) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col justify-center items-center select-none">
        <P className="text-sm text-muted-foreground px-2 text-center mt-2">
          No files were found.
        </P>

        <Button size="sm" onClick={handleCreateFile}>
          <NotebookPen className="w-4 h-4" /> New file
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <H1 className="sr-only">Browse files</H1>

      <div className="grid grid-cols-4 gap-6 px-6 pt-4 pb-16 max-w-7xl w-full mx-auto">
        {sortedFiles.map((file) => (
          <Link
            to={{ pathname: '/editor', search: `?file=${file.path}` }}
            key={file.name}
            className="scroll-mt-4 focus:scale-[102%] hover:scale-[102%] motion-safe:transition-transform cursor-default"
          >
            <Card className="aspect-[3/4] px-3 py-2 pb-0 select-none overflow-hidden gap-0">
              <CardHeader className="px-0">
                <H3 className="text-sm">
                  <span aria-hidden="true">{getDisplayName(file.name)}</span>

                  <span className="sr-only">
                    Open file: &quot;{getDisplayName(file.name)}&quot;
                  </span>
                </H3>
              </CardHeader>

              <CardContent
                className={cn(
                  'px-0 pb-0 overflow-hidden relative',
                  'after:absolute after:bottom-0 after:left-0 after:w-full after:h-24 after:bg-gradient-to-t after:from-card after:to-transparent',
                )}
              >
                {file.preview ? (
                  <>
                    <MarkdownPreview
                      renderType="embedded"
                      content={file.preview}
                      aria-hidden="true"
                    />
                    <span className="sr-only">
                      File content: {file.preview.substring(0, 255)}
                    </span>
                  </>
                ) : (
                  <P className="my-0 text-xs text-muted-foreground sr-only">
                    File is empty
                  </P>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
