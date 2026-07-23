'use client'

import TeethTechLogo from '@/src/components/branding/TeethTechLogo'
import { logout } from '@/src/features/auth/authSlice'
import { useNotifications } from '@/src/features/notifications/useNotifications'
import { AppDispatch, RootState } from '@/src/lib/store'
import { teethTechApi } from '@/src/services/teethTechApi'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type MenuItem = {
	name: string
	href: string
	exact?: boolean
	children?: {
		name: string
		href: string
	}[]
}

type SidebarProps = {
	isOpen: boolean
	onClose: () => void
}

function MenuIcon({ href }: { href: string }) {
	const common = 'h-[18px] w-[18px] shrink-0'
	if (href === '/') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" strokeWidth="1.7" strokeLinejoin="round" /></svg>
	if (href === '/employee') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><circle cx="12" cy="8" r="4" strokeWidth="1.7"/><path d="M4 21a8 8 0 0 1 16 0" strokeWidth="1.7" strokeLinecap="round"/><path d="m17.5 5.5 1 1 2-2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
	if (href.startsWith('/employee/calendar')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><rect x="3" y="5" width="18" height="16" rx="3" strokeWidth="1.7"/><path d="M8 3v4M16 3v4M3 10h18" strokeWidth="1.7" strokeLinecap="round"/><path d="M8 14h2M14 14h2M8 17h2" strokeWidth="1.7" strokeLinecap="round"/></svg>
	if (href.startsWith('/employee/analytics')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="M4 20V10m5 10V5m5 15v-7m5 7V8" strokeWidth="1.8" strokeLinecap="round"/><path d="m4 7 5-3 5 5 6-5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
	if (href.startsWith('/orders')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="M6 3h12l2 4-2 4H6L4 7l2-4Zm0 8v10m12-10v10M8 15h8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
	if (href.startsWith('/analytics')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" strokeWidth="1.8" strokeLinecap="round" /></svg>
	if (href.startsWith('/warehouse')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Zm0 0 8 4 8-4m-8 4v10" strokeWidth="1.7" strokeLinejoin="round" /></svg>
	if (href.startsWith('/clinics')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M8 7h4M8 11h4M8 15h2m6-6h2a2 2 0 0 1 2 2v10M2 21h20" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
	if (href.startsWith('/laboratory')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="M9 3h6m-5 0v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M8 15h8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
	if (href === '/accounting') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="M4 20V10m5 10V4m5 16v-7m5 7V7" strokeWidth="1.8" strokeLinecap="round"/><path d="m3 6 5-3 5 5 7-5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
	if (href.startsWith('/accounting/payroll')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><rect x="3" y="6" width="18" height="13" rx="3" strokeWidth="1.7"/><path d="M3 10h18M7 15h4" strokeWidth="1.7" strokeLinecap="round"/><circle cx="17" cy="15" r="1.5" strokeWidth="1.5"/></svg>
	if (href.startsWith('/accounting/invoices')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 8h6M9 12h6M9 16h3" strokeWidth="1.7" strokeLinecap="round"/></svg>
	if (href.startsWith('/settings/integrations')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><path d="M9 3v5m6-5v5M7 8h10v3a5 5 0 0 1-5 5v0a5 5 0 0 1-5-5V8Zm5 8v2a3 3 0 0 1-3 3H6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
	return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common}><circle cx="12" cy="12" r="3" strokeWidth="1.7" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6" strokeWidth="1.5" strokeLinecap="round" /></svg>
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const dispatch = useDispatch<AppDispatch>()
	const router = useRouter()
	const { role } = useSelector((state: RootState) => state.auth)
	const { notifyError, notifySuccess } = useNotifications()
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())

	const menuItems: MenuItem[] = (() => {
		if (role === 'TECHNICIAN') {
			return [
				{ name: 'Моя зарплата', href: '/accounting/payroll', exact: true },
				{ name: 'Рабочая зона', href: '/employee', exact: true },
				{ name: 'Календарь', href: '/employee/calendar' },
				{ name: 'Аналитика', href: '/employee/analytics' },
				{ name: 'Личный кабинет', href: '/settings', exact: true }
			]
		}

		if (role === 'FINANCIER') {
			return [
				{ name: 'Финансовый отчёт', href: '/accounting', exact: true },
				{ name: 'Зарплаты', href: '/accounting/payroll', exact: true },
				{ name: 'Счета', href: '/accounting/invoices' },
				{ name: 'Личный кабинет', href: '/settings', exact: true }
			]
		}

		if (role === 'CHIEF_TECHNICIAN') {
			return [
				{ name: 'Зарплатные планы', href: '/accounting/payroll', exact: true },
				{
					name: 'Лаборатория',
					href: '/laboratory',
					children: [
						{ name: 'Workflow', href: '/laboratory/workflows' },
						{ name: 'Роли', href: '/settings/employees-roles/roles' }
					]
				},
				{ name: 'Личный кабинет', href: '/settings', exact: true }
			]
		}

		const items: MenuItem[] = [
			{ name: 'Дэшборд', href: '/' },
			{ name: 'Заказы', href: '/orders',
                children:
                    [{ name: 'Реестр', href: '/orders' }]},
                    // [{ name: 'Производственная доска', href: '/tasks' }] },
			{ name: 'Аналитика', href: '/analytics' },
			{ name: 'Склад', href: '/warehouse', children: [{ name: 'Обзор', href: '/warehouse?tab=overview' }, { name: 'Закупки', href: '/warehouse?tab=procurement' }, { name: 'Номенклатура', href: '/warehouse?tab=nomenclature' }, { name: 'Инвентаризация', href: '/warehouse?tab=inventory' }] },
			{
				name: 'Клиники',
				href: '/clinics',
				children: [
					{ name: 'Реестр', href: '/clinics' },
					{ name: 'Пациенты', href: '/clinics/patients' }
				]
			},
			{
				name: 'Лаборатория',
				href: '/laboratory',
				children: [
					{ name: 'Обзор', href: '/laboratory' },
					{ name: 'Сотрудники', href: '/laboratory/employees' },
					{ name: 'Цвета', href: '/laboratory/colors' },
					{ name: 'Типы работ', href: '/laboratory/work-types' },
					{ name: 'Workflow', href: '/laboratory/workflows' }
				]
			},
			{ name: 'Личный кабинет', href: '/settings', exact: true }
		]

		if (role === 'ADMIN') {
			items.push({
				name: 'Зарплатные планы',
				href: '/accounting/payroll',
				exact: true
			})
			items.push({
				name: 'Настройки',
				href: '/settings/employees-roles/roles',
				exact: true,
				children: [
					{ name: 'Сотрудники и роли · Роли', href: '/settings/employees-roles/roles' }
				]
			})
			items.push({
				name: 'Интеграции',
				href: '/settings/integrations',
				exact: true
			})
		}

		return items
	})()

	const handleLogout = async () => {
		if (isLoggingOut) return

		setIsLoggingOut(true)

		try {
			const response = await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'same-origin'
			})

			if (!response.ok) {
				throw new Error(`Logout failed with status ${response.status}`)
			}

			dispatch(logout())
			dispatch(teethTechApi.util.resetApiState())
			notifySuccess('Вы вышли из системы')
			router.push('/auth/login')
		} catch (error) {
			console.error('Logout failed:', error)
			notifyError(
				'Не удалось завершить сеанс. Проверьте подключение и повторите попытку.'
			)
		} finally {
			setIsLoggingOut(false)
		}
	}

	const handleNavigate = () => {
		if (window.matchMedia('(max-width: 1023px)').matches) {
			onClose()
		}
	}

	const toggleGroup = (href: string) => {
		setExpandedGroups(current => {
			const next = new Set(current)
			if (next.has(href)) next.delete(href)
			else next.add(href)
			return next
		})
	}

	const isChildActive = (href: string) => {
		const [childPath, query] = href.split('?')
		if (pathname !== childPath) return false
		if (!query) return true
		const expected = new URLSearchParams(query).get('tab')
		return (searchParams.get('tab') || 'overview') === expected
	}

	return (
		<aside
			inert={!isOpen}
			aria-hidden={!isOpen}
			className={`fixed inset-y-0 left-0 z-50 h-dvh w-[min(18rem,85vw)] overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:transition-[width] ${
				isOpen
					? 'translate-x-0 lg:w-64'
					: 'pointer-events-none -translate-x-full lg:w-0'
			}`}
		>
			<div className="flex h-full w-[min(18rem,85vw)] flex-col bg-[#ffffff] text-slate-900 shadow-2xl dark:bg-[#09090b] dark:text-white lg:w-64 lg:shadow-none">
				<div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800 sm:p-6">
					<TeethTechLogo
						className="w-40 sm:w-full"
						priority
					/>

					<button
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
						aria-label="Закрыть сайдбар"
					>
						×
					</button>
				</div>

				<nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
					{menuItems.map(item => {
						const isParentActive =
							pathname === item.href ||
							(!item.exact && pathname.startsWith(`${item.href}/`)) ||
							Boolean(item.children?.some(child => pathname === child.href.split('?')[0]))

						return (
							<div key={item.href}>
								<div className={`flex items-center rounded-xl transition-colors ${isParentActive ? 'bg-violet-600 text-white shadow-lg shadow-violet-950/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
								<Link
									href={item.href}
									onClick={handleNavigate}
									className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium"
								>
									<MenuIcon href={item.href} /><span className="truncate">{item.name}</span>
								</Link>
								{item.children && <button type="button" onClick={() => toggleGroup(item.href)} className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10" aria-label={`${expandedGroups.has(item.href) || isParentActive ? 'Свернуть' : 'Развернуть'} ${item.name}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`h-4 w-4 transition-transform ${expandedGroups.has(item.href) || isParentActive ? 'rotate-180' : ''}`}><path d="m7 10 5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>}
								</div>

								{item.children && (expandedGroups.has(item.href) || isParentActive) && (
									<div className="relative ml-5 mt-1 space-y-0.5 border-l border-slate-200 pl-3 dark:border-slate-700">
										{item.children.map(child => {
											const childActive = isChildActive(child.href)

											return (
												<Link
													key={child.href}
													href={child.href}
													onClick={handleNavigate}
													className={`relative block rounded-lg px-3 py-2 text-xs transition-colors ${
														childActive
															? 'bg-violet-50 font-semibold text-violet-700 before:absolute before:-left-[13px] before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-violet-500 dark:bg-violet-500/15 dark:text-violet-300'
															: 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white'
													}`}
												>
													{child.name}
												</Link>
											)
										})}
									</div>
								)}
							</div>
						)
					})}
				</nav>

				<div className="border-t border-slate-200 p-4 dark:border-slate-800">
					<button
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="group flex w-full items-center gap-3 rounded-lg p-3 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-600/20 dark:hover:text-white disabled:cursor-wait disabled:opacity-60"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5 group-hover:text-red-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>

						<span className="text-sm font-bold tracking-wide">
							{isLoggingOut ? 'Выходим...' : 'Выйти из CRM'}
						</span>
					</button>
				</div>
			</div>
		</aside>
	)
}
