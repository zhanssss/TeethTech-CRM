'use client'

import { RootState } from '@/src/lib/store'
import Link from 'next/link'
import { useSelector } from 'react-redux'

type HeaderProps = {
	onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
	const { name, role } = useSelector((state: RootState) => state.auth)
	const { totalUnreadCount } = useSelector((state: RootState) => state.chat)

	return (
		<header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
			<button
				type="button"
				onClick={onMenuClick}
				className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 lg:hidden"
				aria-label="Open navigation"
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

			<div className="ml-auto flex min-w-0 items-center gap-3">
				<Link
					href="/chats"
					aria-label={
						totalUnreadCount > 0
							? `Сообщения: ${totalUnreadCount} непрочитанных`
							: 'Сообщения'
					}
					className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
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
						<p className="truncate leading-none text-sm font-semibold text-slate-900">
							{name}
						</p>
						<p className="mt-1 truncate text-xs uppercase tracking-wider text-slate-500">
							{role}
						</p>
					</div>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
						{name?.[0]}
					</div>
				</div>
			</div>
		</header>
	)
}
