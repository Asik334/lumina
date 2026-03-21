import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="text-8xl font-bold neon-text mb-4">404</div>
      <h1 className="text-2xl font-semibold mb-2">Страница не найдена</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        К сожалению, эта страница недоступна. Возможно, ссылка неверна или страница была удалена.
      </p>
      <Link
        href="/feed"
        className="px-6 py-3 rounded-xl bg-neon-gradient font-semibold hover:opacity-90 transition-opacity"
      >
        На главную
      </Link>
    </div>
  )
}
