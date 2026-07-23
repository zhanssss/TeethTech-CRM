'use client'

import { RootState } from '@/src/lib/store'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import ThemeToggle from './ThemeToggle'

type HeaderProps = {
	onMenuClick?: () => void
	isMenuOpen?: boolean
}

export default function Header({ onMenuClick, isMenuOpen = false }: HeaderProps) {
	const { name, role } = useSelector((state: RootState) => state.auth)
	const { totalUnreadCount } = useSelector((state: RootState) => state.chat)

	return (
		<header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-[#09090b]/90 sm:px-6 lg:px-8">
			{!isMenuOpen && (
				<button
					type="button"
					onClick={onMenuClick}
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-all duration-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
					aria-label="Показать боковое меню"
					aria-expanded="false"
				>
					<svg
						className="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					>
						<path d="M4 6h16" />
						<path d="M4 12h16" />
						<path d="M4 18h16" />
					</svg>
				</button>
			)}

			<div className="ml-auto flex min-w-0 items-center gap-3">
				<ThemeToggle />
				<Link
					href="/chats"
					aria-label={
						totalUnreadCount > 0
							? `Сообщения: ${totalUnreadCount} непрочитанных`
							: 'Сообщения'
					}
					className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
				>
					<svg
						className="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
					{totalUnreadCount > 0 ? (
						<span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white shadow-sm ring-2 ring-white">
							{totalUnreadCount > 99 ? '99+' : totalUnreadCount}
						</span>
					) : null}
				</Link>
				<div className="flex min-w-0 items-center gap-3">
					<div className="min-w-0 text-right">
						<p className="truncate leading-none text-sm font-black text-slate-900 dark:text-white">
							{name}
						</p>
						<p className="mt-1 truncate text-xs uppercase tracking-wider text-slate-500">
							{role}
						</p>
					</div>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 font-black text-white shadow-lg shadow-violet-500/20">
						{name?.[0]}
					</div>
				</div>
			</div>
		</header>
	)
}
