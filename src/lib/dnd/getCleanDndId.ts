export function getCleanDndId(id: string) {
  return decodeURIComponent(id.replace(/^(browser|sidebar|breadcrumb)-/, ''))
}
