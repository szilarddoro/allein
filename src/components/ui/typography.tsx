import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import * as React from 'react'

// H1 Component
export const H1 = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      'scroll-m-20 text-4xl font-bold tracking-tight text-balance',
      className,
    )}
    {...props}
  />
))
H1.displayName = 'H1'

// H2 Component
export const H2 = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      'scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0',
      className,
    )}
    {...props}
  />
))
H2.displayName = 'H2'

// H3 Component
export const H3 = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'scroll-m-20 text-2xl font-semibold tracking-tight',
      className,
    )}
    {...props}
  />
))
H3.displayName = 'H3'

// H4 Component
export const H4 = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h4
    ref={ref}
    className={cn(
      'scroll-m-20 text-xl font-semibold tracking-tight',
      className,
    )}
    {...props}
  />
))
H4.displayName = 'H4'

// Paragraph Component
export const P = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}
    {...props}
  />
))
P.displayName = 'P'

// Lead Component (larger paragraph for introductions)
export const Lead = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xl text-muted-foreground', className)}
    {...props}
  />
))
Lead.displayName = 'Lead'

// Large Component
export const Large = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
))
Large.displayName = 'Large'

// Small Component
export const Small = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <small
      ref={ref}
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    />
  ),
)
Small.displayName = 'Small'

// Muted Component
export const Muted = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
Muted.displayName = 'Muted'

// Blockquote Component
export const Blockquote = forwardRef<
  HTMLQuoteElement,
  React.HTMLAttributes<HTMLQuoteElement>
>(({ className, ...props }, ref) => (
  <blockquote
    ref={ref}
    className={cn('mt-6 border-l-2 pl-6 italic', className)}
    {...props}
  />
))
Blockquote.displayName = 'Blockquote'

// Inline Code Component
export const InlineCode = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <code
    ref={ref}
    className={cn(
      'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
      className,
    )}
    {...props}
  />
))
InlineCode.displayName = 'InlineCode'

// List Component
export const List = forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)}
    {...props}
  />
))
List.displayName = 'List'

// Ordered List Component
export const OrderedList = forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn('my-6 ml-6 list-decimal [&>li]:mt-2', className)}
    {...props}
  />
))
OrderedList.displayName = 'OrderedList'

// List Item Component
export const ListItem = forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('mt-2', className)} {...props} />
))
ListItem.displayName = 'ListItem'

// Table Component
export const Table = forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="my-6 w-full overflow-y-auto">
    <table ref={ref} className={cn('w-full', className)} {...props} />
  </div>
))
Table.displayName = 'Table'

// Table Header Component
export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

// Table Body Component
export const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

// Table Row Component
export const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'even:bg-muted m-0 border-t p-0 data-[state=selected]:bg-muted',
      className,
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

// Table Head Component
export const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

// Table Cell Component
export const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'
