import { Link } from 'react-router-dom'
import type { ArticleBlock } from './blogContent'

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.filter(Boolean).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-semibold text-brand-dark">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={index}>{part.slice(1, -1)}</em>
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

function ActionLink({ label, to }: { label: string; to: string }) {
  const className =
    'mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark'

  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  )
}

function List({ ordered, items }: { ordered: boolean; items: string[] }) {
  if (ordered) {
    return (
      <ol className="my-6 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-base leading-relaxed text-brand-muted">
            <span className="mt-0.5 font-mono text-sm font-medium text-brand-orange">{index + 1}.</span>
            <span>
              <Inline text={item} />
            </span>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <ul className="my-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-base leading-relaxed text-brand-muted">
          <span className="mt-[0.55rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-orange" aria-hidden="true" />
          <span>
            <Inline text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-brand-dark/10 bg-white">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-dark/10 bg-brand-cream/60">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-brand-muted"
              >
                <Inline text={header} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-dark/10">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-top leading-relaxed text-brand-dark/90">
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.kind) {
    case 'p':
      return (
        <p className="my-4 text-base leading-relaxed text-brand-muted">
          <Inline text={block.text} />
        </p>
      )
    case 'h2':
      return (
        <h2 className="mb-4 mt-10 font-display text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
          {block.text}
        </h2>
      )
    case 'ul':
      return <List ordered={false} items={block.items} />
    case 'ol':
      return <List ordered items={block.items} />
    case 'table':
      return <Table headers={block.headers} rows={block.rows} />
    case 'formula':
      return (
        <div className="my-6 rounded-xl border border-brand-line/40 bg-brand-cream/70 px-5 py-4">
          <p className="font-mono text-sm font-medium text-brand-dark sm:text-base">{block.text}</p>
        </div>
      )
    case 'note':
      return <p className="my-4 text-sm italic leading-relaxed text-brand-muted sm:text-base">{block.text}</p>
    case 'cta':
      return (
        <div className="mt-12 rounded-2xl bg-brand-dark p-6 sm:p-8">
          <p className="font-display text-xl font-bold leading-snug text-white">{block.text}</p>
          <ActionLink label={block.action.label} to={block.action.to} />
        </div>
      )
  }
}

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  )
}
