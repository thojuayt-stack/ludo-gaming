export default function PageHeader({ title, subtitle, action }) {
  return (
    <header className="flex items-center justify-between px-4 pb-3 pt-6">
      <div>
        <h1 className="page-title text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
