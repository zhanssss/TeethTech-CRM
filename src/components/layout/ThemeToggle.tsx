'use client'

import { useSyncExternalStore } from 'react'

const THEME_EVENT = 'teethtech-theme-change'

function subscribe(callback: () => void) {
	window.addEventListener(THEME_EVENT, callback)
	return () => window.removeEventListener(THEME_EVENT, callback)
}

function getSnapshot() {
	return document.documentElement.classList.contains('dark')
}

function getServerSnapshot() {
	return false
}

export default function ThemeToggle() {
	const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

	const toggleTheme = () => {
		const nextTheme = isDark ? 'light' : 'dark'
		document.documentElement.classList.toggle('dark', nextTheme === 'dark')
		document.documentElement.style.colorScheme = nextTheme
		localStorage.setItem('teethtech-theme', nextTheme)
		window.dispatchEvent(new Event(THEME_EVENT))
	}

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
			aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
			title={isDark ? 'Светлая тема' : 'Тёмная тема'}
		>
			{isDark ? (
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
					<circle cx="12" cy="12" r="4" />
					<path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
				</svg>
			) : (
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
					<path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5 8.5 8.5 0 1 0 20.5 14.4Z" />
				</svg>
			)}
		</button>
	)
}
