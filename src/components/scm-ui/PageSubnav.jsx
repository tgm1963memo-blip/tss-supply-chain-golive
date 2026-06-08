export default function PageSubnav({ items, activeId, onSelect }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-5 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
      <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (onSelect) onSelect(item.id);
              }}
              className={`
                whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors
                ${isActive
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-main)]'
                }
              `}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
