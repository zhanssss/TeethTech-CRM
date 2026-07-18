'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ErrorState from '@/src/components/ui/ErrorState'
import Modal from '@/src/components/ui/Modal'
import {
	appendMessage,
	appendMessages,
	applyRealtimeEvent,
	setActiveConversation,
	setChats,
	setLoadingChats,
	setLoadingMembers,
	setLoadingMessages,
	setMembers,
	setMessages,
	setPagination,
	setSendingMessage,
	updateChatTitle
} from '@/src/features/chat/chatSlice'
import { useNotifications } from '@/src/features/notifications/useNotifications'
import { RootState } from '@/src/lib/store'
import {
	useAddChatMembersMutation,
	useCreateDirectChatMutation,
	useCreateGroupChatMutation,
	useGetChatsQuery,
	useMarkChatReadMutation,
	useRemoveChatMemberMutation,
	useRenameGroupChatMutation,
	useSendTextMessageMutation,
	useUploadChatFileMutation
} from '@/src/services/api/chatApi'
import { useGetUsersQuery } from '@/src/services/api/usersApi'
import {
	addChatRealtimeListener,
	connectChatRealtime,
	disconnectChatRealtime,
	getChatRealtimeStatus,
	removeChatRealtimeListener,
	sendChatRead,
	sendChatTextMessage
} from '@/src/services/chatRealtimeService'
import type {
	ChatMemberDto,
	ChatMemberRole,
	ChatMessageDto
} from '@/src/types/chat.types'
import {
	formatChatTime,
	formatFileSize,
	getInitials,
	getReplyPreview
} from '@/src/utils/chatUtils'

const roleLabels: Record<ChatMemberRole, string> = {
	OWNER: 'Владелец',
	ADMIN: 'Администратор',
	MEMBER: 'Участник'
}

export default function ChatPage() {
	const router = useRouter()
	const params = useParams<{ conversationId?: string }>()
	const dispatch = useDispatch()
	const { id: currentUserId } = useSelector((state: RootState) => state.auth)
	const {
		chats,
		activeConversationId,
		messagesByConversation,
		membersByConversation,
		paginationByConversation,
		isLoadingChats,
		isLoadingMessages,
		isLoadingMembers,
		isSendingMessage
	} = useSelector((state: RootState) => state.chat)
	const [search, setSearch] = useState('')
	const [composer, setComposer] = useState('')
	const [replyToId, setReplyToId] = useState<string | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [isCreateDirectOpen, setIsCreateDirectOpen] = useState(false)
	const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
	const [isMembersOpen, setIsMembersOpen] = useState(false)
	const [groupTitle, setGroupTitle] = useState('')
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
	const [memberSearch, setMemberSearch] = useState('')
	const [isRenaming, setIsRenaming] = useState(false)
	const [newTitle, setNewTitle] = useState('')
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [sendError, setSendError] = useState<string | null>(null)
	const messageListRef = useRef<HTMLDivElement | null>(null)
	const composerRef = useRef<HTMLTextAreaElement | null>(null)
	const shouldLoadMoreRef = useRef(false)
	const { data: users = [], error: usersError } = useGetUsersQuery()
	const {
		data: chatList = [],
		isLoading: isChatsLoading,
		error: chatsError,
		refetch: refetchChats
	} = useGetChatsQuery(undefined, { refetchOnMountOrArgChange: true })
	const [createDirectChat] = useCreateDirectChatMutation()
	const [createGroupChat, { isLoading: isCreatingGroup }] =
		useCreateGroupChatMutation()
	const [sendTextMessage, { isLoading: isSendingRest }] =
		useSendTextMessageMutation()
	const [uploadChatFile, { isLoading: isUploadingFile }] =
		useUploadChatFileMutation()
	const [markChatRead] = useMarkChatReadMutation()
	const [addChatMembers] = useAddChatMembersMutation()
	const [removeChatMember] = useRemoveChatMemberMutation()
	const [renameGroupChat] = useRenameGroupChatMutation()
	const { notifyError, notifySuccess } = useNotifications()

	const activeConversation =
		chats.find(chat => chat.id === activeConversationId) ?? null
	const activeMessages = activeConversationId
		? (messagesByConversation[activeConversationId] ?? [])
		: []
	const activeMembers = activeConversationId
		? (membersByConversation[activeConversationId] ?? [])
		: []
	const activePagination = activeConversationId
		? paginationByConversation[activeConversationId]
		: undefined

	const filteredChats = useMemo(() => {
		const term = search.trim().toLowerCase()
		if (!term) return chats
		return chats.filter(chat => chat.title.toLowerCase().includes(term))
	}, [chats, search])

	const filteredUsers = useMemo(() => {
		const term = memberSearch.trim().toLowerCase()
		return users.filter(user => {
			const matches = [user.fullName, user.name, user.email]
				.filter(Boolean)
				.join(' ')
				.toLowerCase()
			const isCurrent = currentUserId && user.id === currentUserId
			return !isCurrent && (!term || matches.includes(term))
		})
	}, [currentUserId, memberSearch, users])

	const currentUserCanManageGroup = useMemo(() => {
		const member = activeMembers.find(item => item.userId === currentUserId)
		return member?.role === 'OWNER' || member?.role === 'ADMIN'
	}, [activeMembers, currentUserId])

	const loadMembers = async (conversationId: string) => {
		if (!conversationId) return
		dispatch(setLoadingMembers(true))
		try {
			const result = await fetch(
				`/api/backend/chats/${conversationId}/members`,
				{ credentials: 'same-origin' }
			)
			if (result.ok) {
				const members = (await result.json()) as ChatMemberDto[]
				dispatch(setMembers({ conversationId, members }))
			}
		} catch {
			notifyError('Не удалось загрузить участников')
		} finally {
			dispatch(setLoadingMembers(false))
		}
	}

	useEffect(() => {
		dispatch(setLoadingChats(isChatsLoading))
	}, [dispatch, isChatsLoading])

	useEffect(() => {
		if (chatList.length) {
			dispatch(setChats(chatList))
		}
	}, [chatList, dispatch])

	useEffect(() => {
		connectChatRealtime()
		const listener = (event: {
			conversationId: string
			type: 'MESSAGE_CREATED' | 'MESSAGES_READ' | 'CHAT_UPDATED'
			message?: ChatMessageDto | null
			userId?: string | null
			occurredAt?: string
		}) => {
			dispatch(applyRealtimeEvent(event))
			const conversationId = event.conversationId
			if (event.type === 'MESSAGE_CREATED' && event.message) {
				const message = event.message
				const shouldMarkRead =
					activeConversationId === conversationId &&
					document.visibilityState === 'visible' &&
					message.senderId !== currentUserId
				if (shouldMarkRead) {
					sendChatRead(conversationId)
				}
			}
		}
		addChatRealtimeListener(listener)
		return () => {
			removeChatRealtimeListener(listener)
			disconnectChatRealtime()
		}
	}, [activeConversationId, currentUserId, dispatch])

	useEffect(() => {
		const conversationId = params.conversationId
		if (conversationId) {
			dispatch(setActiveConversation(conversationId))
			const existingMessages = messagesByConversation[conversationId] ?? []
			if (existingMessages.length === 0) {
				const loadInitialMessages = async () => {
					dispatch(setLoadingMessages(true))
					try {
						const response = await fetch(
							`/api/backend/chats/${conversationId}/messages?size=50`,
							{ credentials: 'same-origin' }
						)
						if (!response.ok) throw new Error('Failed')
						const page = (await response.json()) as {
							content: ChatMessageDto[]
							hasMore: boolean
							nextBefore: string | null
						}
						dispatch(
							setMessages({
								conversationId,
								messages: page.content
							})
						)
						dispatch(
							setPagination({
								conversationId,
								hasMore: page.hasMore,
								nextBefore: page.nextBefore
							})
						)
						if (page.content.length) {
							setTimeout(() => {
								if (messageListRef.current) {
									messageListRef.current.scrollTop =
										messageListRef.current.scrollHeight
								}
							}, 0)
						}
					} catch {
						notifyError('Не удалось загрузить историю')
					} finally {
						dispatch(setLoadingMessages(false))
					}
				}
				void loadInitialMessages()
			}
		} else {
			dispatch(setActiveConversation(null))
		}
	}, [dispatch, messagesByConversation, notifyError, params.conversationId])

	useEffect(() => {
		if (activeConversationId) {
			void loadMembers(activeConversationId)
			void markChatRead(activeConversationId)
		}
	}, [activeConversationId])

	useEffect(() => {
		if (activeConversationId && messageListRef.current) {
			const el = messageListRef.current
			const handler = () => {
				if (
					el.scrollTop < 80 &&
					!shouldLoadMoreRef.current &&
					activePagination?.hasMore
				) {
					shouldLoadMoreRef.current = true
					const loadOlderMessages = async () => {
						try {
							const before = activePagination.nextBefore ?? undefined
							const response = await fetch(
								`/api/backend/chats/${activeConversationId}/messages?before=${encodeURIComponent(before ?? '')}&size=50`,
								{ credentials: 'same-origin' }
							)
							if (!response.ok) throw new Error('Failed')
							const page = (await response.json()) as {
								content: ChatMessageDto[]
								hasMore: boolean
								nextBefore: string | null
							}
							dispatch(
								appendMessages({
									conversationId: activeConversationId,
									messages: page.content,
									prepend: true
								})
							)
							dispatch(
								setPagination({
									conversationId: activeConversationId,
									hasMore: page.hasMore,
									nextBefore: page.nextBefore
								})
							)
						} catch {
							notifyError('Не удалось загрузить старые сообщения')
						} finally {
							shouldLoadMoreRef.current = false
						}
					}
					void loadOlderMessages()
				}
			}
			el.addEventListener('scroll', handler)
			return () => el.removeEventListener('scroll', handler)
		}
	}, [activeConversationId, activePagination, dispatch, notifyError])

	useEffect(() => {
		if (activeConversationId && activeMessages.length) {
			const el = messageListRef.current
			if (el) {
				el.scrollTop = el.scrollHeight
			}
		}
	}, [activeConversationId, activeMessages.length])

	const openDirectChat = async (userId: string) => {
		if (!userId || userId === currentUserId) return
		try {
			const chat = await createDirectChat({ userId }).unwrap()
			router.push(`/chats/${chat.id}`)
			setIsCreateDirectOpen(false)
			notifySuccess('Чат открыт')
		} catch {
			notifyError('Не удалось открыть чат')
		}
	}

	const handleCreateGroup = async () => {
		if (!groupTitle.trim()) {
			notifyError('Укажите название группы')
			return
		}
		if (selectedMemberIds.length === 0) {
			notifyError('Добавьте хотя бы одного участника')
			return
		}
		try {
			const created = await createGroupChat({
				title: groupTitle.trim(),
				memberIds: selectedMemberIds
			}).unwrap()
			router.push(`/chats/${created.id}`)
			setIsCreateGroupOpen(false)
			setGroupTitle('')
			setSelectedMemberIds([])
			notifySuccess('Группа создана')
		} catch {
			notifyError('Не удалось создать группу')
		}
	}

	const handleSendMessage = async () => {
		const text = composer.trim()
		if (!activeConversationId || !text) return
		if (isSendingMessage || isSendingRest || isUploadingFile) return
		setSendError(null)
		dispatch(setSendingMessage(true))
		try {
			const payload = { text, replyToId }
			const created = await sendTextMessage({
				conversationId: activeConversationId,
				body: payload
			}).unwrap()
			dispatch(appendMessage(created))
			dispatch(setSendingMessage(false))
			setComposer('')
			setReplyToId(null)
			sendChatTextMessage(activeConversationId, payload)
		} catch {
			setSendError('Не удалось отправить сообщение')
			dispatch(setSendingMessage(false))
		}
	}

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file || !activeConversationId) return
		if (file.size > 25 * 1024 * 1024) {
			setUploadError('Файл не должен превышать 25 МБ')
			return
		}
		setSelectedFile(file)
		setUploadError(null)
	}

	const handleUploadFile = async () => {
		if (!activeConversationId || !selectedFile) return
		dispatch(setSendingMessage(true))
		const formData = new FormData()
		formData.append('file', selectedFile)
		try {
			const created = await uploadChatFile({
				conversationId: activeConversationId,
				formData
			}).unwrap()
			dispatch(appendMessage(created))
			setSelectedFile(null)
			dispatch(setSendingMessage(false))
		} catch {
			setUploadError('Не удалось отправить файл')
			dispatch(setSendingMessage(false))
		}
	}

	const handleAddMembers = async () => {
		if (!activeConversationId) return
		try {
			await addChatMembers({
				conversationId: activeConversationId,
				body: { userIds: selectedMemberIds }
			}).unwrap()
			await loadMembers(activeConversationId)
			notifySuccess('Участники добавлены')
			setIsMembersOpen(false)
			setSelectedMemberIds([])
		} catch {
			notifyError('Не удалось добавить участников')
		}
	}

	const handleRemoveMember = async (memberId: string) => {
		if (!activeConversationId) return
		if (!window.confirm('Удалить участника из группы?')) return
		try {
			await removeChatMember({
				conversationId: activeConversationId,
				memberId
			}).unwrap()
			await loadMembers(activeConversationId)
			notifySuccess('Участник удалён')
		} catch {
			notifyError('Не удалось удалить участника')
		}
	}

	const handleRenameGroup = async () => {
		if (!activeConversationId || !newTitle.trim()) return
		try {
			const updated = await renameGroupChat({
				conversationId: activeConversationId,
				body: { title: newTitle.trim() }
			}).unwrap()
			dispatch(
				updateChatTitle({
					conversationId: activeConversationId,
					title: updated.title
				})
			)
			notifySuccess('Название обновлено')
			setIsRenaming(false)
		} catch {
			notifyError('Не удалось переименовать группу')
		}
	}

	const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

	const renderMessage = (message: ChatMessageDto) => {
		const isMine = message.senderId === currentUserId
		const replyMessage = getReplyPreview(activeMessages, message.replyToId)
		const isAttachmentVisible = message.attachments?.length > 0
		return (
			<div
				key={message.id}
				className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}
			>
				<div
					className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'}`}
				>
					{!isMine && activeConversation?.type === 'GROUP' ? (
						<div className="mb-1 text-xs font-semibold text-slate-500">
							{message.senderName}
						</div>
					) : null}
					{replyMessage ? (
						<div
							className={`mb-2 rounded-lg border px-3 py-2 text-sm ${isMine ? 'border-blue-400 bg-blue-500/40' : 'border-slate-200 bg-slate-50'}`}
						>
							↩ {replyMessage.text ?? 'Ответ на сообщение'}
						</div>
					) : null}
					{message.deleted ? (
						<div className="text-sm italic opacity-70">Сообщение удалено</div>
					) : (
						<>
							{message.text ? (
								<div className="whitespace-pre-wrap text-sm leading-6">
									{message.text}
								</div>
							) : null}
							{isAttachmentVisible ? (
								<div className="mt-2 space-y-2">
									{message.attachments.map(attachment => {
										const isImage = attachment.contentType.startsWith('image/')
										return (
											<div
												key={attachment.id}
												className="rounded-xl border border-slate-200 bg-slate-50 p-2"
											>
												{isImage ? (
													<img
														src={attachment.fileName}
														alt={attachment.fileName}
														className="max-h-48 rounded-lg object-cover"
													/>
												) : (
													<div className="flex items-center gap-2 text-sm">
														<span className="rounded-lg bg-slate-200 px-2 py-1">
															📎
														</span>
														<span>{attachment.fileName}</span>
													</div>
												)}
												<div className="mt-2 flex items-center justify-between text-xs text-slate-500">
													<span>{attachment.fileName}</span>
													<span>{formatFileSize(attachment.fileSize)}</span>
												</div>
											</div>
										)
									})}
								</div>
							) : null}
						</>
					)}
					<div
						className={`mt-2 text-[11px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}
					>
						{formatChatTime(message.createdAt)}
					</div>
				</div>
			</div>
		)
	}

	if (usersError || chatsError) {
		return (
			<ErrorState
				title="Чат недоступен"
				onRetry={() => void refetchChats()}
			>
				<p>
					Не удалось загрузить данные. Проверьте соединение и повторите попытку.
				</p>
			</ErrorState>
		)
	}

	return (
		<div className="flex h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:flex-row">
			<aside className="flex w-full flex-col border-b border-slate-200 bg-slate-50 lg:w-96 lg:border-b-0 lg:border-r">
				<div className="border-b border-slate-200 p-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-lg font-black text-slate-900">Сообщения</h1>
							<p className="text-sm text-slate-500">Личные и групповые чаты</p>
						</div>
						<button
							type="button"
							onClick={() => setIsCreateDirectOpen(true)}
							className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
						>
							+ Новый
						</button>
					</div>
					<input
						value={search}
						onChange={event => setSearch(event.target.value)}
						placeholder="Поиск по чату"
						className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
					/>
				</div>
				<div className="flex gap-2 border-b border-slate-200 p-3">
					<button
						type="button"
						onClick={() => setIsCreateDirectOpen(true)}
						className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
					>
						Личный чат
					</button>
					<button
						type="button"
						onClick={() => setIsCreateGroupOpen(true)}
						className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
					>
						Создать группу
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-2">
					{isChatsLoading ? (
						<div className="space-y-2 p-2">
							{Array.from({ length: 5 }).map((_, index) => (
								<div
									key={index}
									className="h-16 animate-pulse rounded-2xl bg-slate-200"
								/>
							))}
						</div>
					) : filteredChats.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
							Чаты пока не созданы
						</div>
					) : (
						filteredChats.map(chat => (
							<button
								key={chat.id}
								type="button"
								onClick={() => router.push(`/chats/${chat.id}`)}
								className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${activeConversationId === chat.id ? 'border-blue-300 bg-blue-50' : 'border-transparent bg-white hover:border-slate-200'}`}
							>
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
									{getInitials(chat.title)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-2">
										<p className="truncate text-sm font-bold text-slate-900">
											{chat.title}
										</p>
										{chat.lastMessageAt ? (
											<span className="text-[11px] text-slate-400">
												{formatChatTime(chat.lastMessageAt)}
											</span>
										) : null}
									</div>
									<p className="mt-1 truncate text-sm text-slate-500">
										{chat.lastMessage ?? 'Начните диалог'}
									</p>
								</div>
								{chat.unreadCount > 0 ? (
									<span className="rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
										{chat.unreadCount}
									</span>
								) : null}
							</button>
						))
					)}
				</div>
			</aside>
			<section className="flex min-w-0 flex-1 flex-col">
				{activeConversation ? (
					<>
						<header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
							<div className="flex items-center gap-3">
								<div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
									{getInitials(activeConversation.title)}
								</div>
								<div>
									<h2 className="text-base font-black text-slate-900">
										{activeConversation.title}
									</h2>
									<p className="text-sm text-slate-500">
										{activeConversation.type === 'GROUP'
											? 'Группа'
											: 'Личный чат'}{' '}
										· {getChatRealtimeStatus()}
									</p>
								</div>
							</div>
							<div className="flex gap-2">
								{currentUserCanManageGroup ? (
									<button
										type="button"
										onClick={() => setIsMembersOpen(true)}
										className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
									>
										Участники
									</button>
								) : null}
								{activeConversation.type === 'GROUP' ? (
									<button
										type="button"
										onClick={() => {
											setNewTitle(activeConversation.title)
											setIsRenaming(true)
										}}
										className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
									>
										Переименовать
									</button>
								) : null}
								{isMobile ? (
									<button
										type="button"
										onClick={() => router.push('/chats')}
										className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
									>
										Назад
									</button>
								) : null}
							</div>
						</header>
						<div
							ref={messageListRef}
							className="flex-1 overflow-y-auto bg-slate-50 p-4"
						>
							{isLoadingMessages ? (
								<div className="text-center text-sm text-slate-500">
									Загрузка истории…
								</div>
							) : activeMessages.length === 0 ? (
								<div className="text-center text-sm text-slate-500">
									Сообщений пока нет
								</div>
							) : (
								activeMessages.map(message => renderMessage(message))
							)}
						</div>
						<div className="border-t border-slate-200 bg-white p-3">
							{replyToId ? (
								<div className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
									<span>
										Ответ:{' '}
										{activeMessages.find(item => item.id === replyToId)?.text ??
											'Сообщение'}
									</span>
									<button
										type="button"
										onClick={() => setReplyToId(null)}
										className="text-slate-400"
									>
										×
									</button>
								</div>
							) : null}
							{selectedFile ? (
								<div className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
									<span>
										{selectedFile.name} · {formatFileSize(selectedFile.size)}
									</span>
									<button
										type="button"
										onClick={() => setSelectedFile(null)}
										className="text-slate-400"
									>
										×
									</button>
								</div>
							) : null}
							<textarea
								ref={composerRef}
								value={composer}
								onChange={event => setComposer(event.target.value)}
								onKeyDown={event => {
									if (event.key === 'Enter' && !event.shiftKey) {
										event.preventDefault()
										void handleSendMessage()
									}
								}}
								placeholder="Напишите сообщение"
								className="min-h-[88px] w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
							/>
							<div className="mt-2 flex flex-wrap items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<label className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
										Файл
										<input
											type="file"
											className="hidden"
											onChange={handleFileChange}
										/>
									</label>
									<button
										type="button"
										onClick={() =>
											setReplyToId(
												activeMessages[activeMessages.length - 1]?.id ?? null
											)
										}
										className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
									>
										Ответ
									</button>
									{selectedFile ? (
										<button
											type="button"
											onClick={() => void handleUploadFile()}
											disabled={isSendingMessage}
											className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
										>
											Отправить файл
										</button>
									) : null}
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-slate-400">
										{composer.trim().length}/4000
									</span>
									<button
										type="button"
										onClick={() => void handleSendMessage()}
										disabled={!composer.trim() || isSendingMessage}
										className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
									>
										Отправить
									</button>
								</div>
							</div>
							{sendError ? (
								<div className="mt-2 text-sm text-red-600">{sendError}</div>
							) : null}
							{uploadError ? (
								<div className="mt-2 text-sm text-red-600">{uploadError}</div>
							) : null}
						</div>
					</>
				) : (
					<div className="flex flex-1 items-center justify-center text-sm text-slate-500">
						Выберите чат
					</div>
				)}
			</section>
			{isCreateDirectOpen ? (
				<Modal>
					<div className="p-5">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-black text-slate-900">
								Новый личный чат
							</h3>
							<button
								type="button"
								onClick={() => setIsCreateDirectOpen(false)}
								className="text-slate-500"
							>
								×
							</button>
						</div>
						<input
							value={memberSearch}
							onChange={event => setMemberSearch(event.target.value)}
							placeholder="Поиск сотрудников"
							className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
						/>
						<div className="mt-4 max-h-80 space-y-2 overflow-auto">
							{filteredUsers.map(user => (
								<button
									key={user.id}
									type="button"
									onClick={() => void openDirectChat(user.id)}
									className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm"
								>
									<span>{user.fullName || user.name}</span>
									<span className="text-slate-400">Открыть</span>
								</button>
							))}
						</div>
					</div>
				</Modal>
			) : null}
			{isCreateGroupOpen ? (
				<Modal>
					<div className="p-5">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-black text-slate-900">
								Создать группу
							</h3>
							<button
								type="button"
								onClick={() => setIsCreateGroupOpen(false)}
								className="text-slate-500"
							>
								×
							</button>
						</div>
						<label className="mt-4 block text-sm font-semibold text-slate-700">
							Название
							<input
								value={groupTitle}
								onChange={event => setGroupTitle(event.target.value)}
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
							/>
						</label>
						<label className="mt-4 block text-sm font-semibold text-slate-700">
							Участники
							<input
								value={memberSearch}
								onChange={event => setMemberSearch(event.target.value)}
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
								placeholder="Поиск сотрудников"
							/>
						</label>
						<div className="mt-3 flex flex-wrap gap-2">
							{selectedMemberIds.map(id => (
								<span
									key={id}
									className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
								>
									{users.find(user => user.id === id)?.fullName || 'Участник'}
								</span>
							))}
						</div>
						<div className="mt-4 max-h-60 space-y-2 overflow-auto">
							{filteredUsers.map(user => (
								<button
									key={user.id}
									type="button"
									onClick={() =>
										setSelectedMemberIds(current =>
											current.includes(user.id)
												? current.filter(id => id !== user.id)
												: [...current, user.id]
										)
									}
									className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm"
								>
									<span>{user.fullName || user.name}</span>
									{selectedMemberIds.includes(user.id) ? (
										<span className="text-blue-600">✓</span>
									) : null}
								</button>
							))}
						</div>
						<button
							type="button"
							onClick={() => void handleCreateGroup()}
							disabled={isCreatingGroup}
							className="mt-4 w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
						>
							Создать группу
						</button>
					</div>
				</Modal>
			) : null}
			{isMembersOpen ? (
				<Modal>
					<div className="p-5">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-black text-slate-900">Участники</h3>
							<button
								type="button"
								onClick={() => setIsMembersOpen(false)}
								className="text-slate-500"
							>
								×
							</button>
						</div>
						<div className="mt-4 space-y-2">
							{activeMembers.map(member => (
								<div
									key={member.userId}
									className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
								>
									<div>
										<p className="text-sm font-semibold text-slate-900">
											{member.name}
										</p>
										<p className="text-xs text-slate-500">
											{roleLabels[member.role]}
										</p>
									</div>
									{currentUserCanManageGroup && member.role !== 'OWNER' ? (
										<button
											type="button"
											onClick={() => void handleRemoveMember(member.userId)}
											className="text-sm text-red-600"
										>
											Удалить
										</button>
									) : null}
								</div>
							))}
						</div>
						<div className="mt-4">
							<label className="text-sm font-semibold text-slate-700">
								Добавить участников
								<input
									value={memberSearch}
									onChange={event => setMemberSearch(event.target.value)}
									className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
								/>
							</label>
							<div className="mt-3 max-h-40 space-y-2 overflow-auto">
								{filteredUsers.map(user => (
									<button
										key={user.id}
										type="button"
										onClick={() =>
											setSelectedMemberIds(current =>
												current.includes(user.id)
													? current.filter(id => id !== user.id)
													: [...current, user.id]
											)
										}
										className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm"
									>
										<span>{user.fullName || user.name}</span>
										{selectedMemberIds.includes(user.id) ? (
											<span className="text-blue-600">✓</span>
										) : null}
									</button>
								))}
							</div>
							<button
								type="button"
								onClick={() => void handleAddMembers()}
								className="mt-3 w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
							>
								Добавить
							</button>
						</div>
					</div>
				</Modal>
			) : null}
			{isRenaming ? (
				<Modal>
					<div className="p-5">
						<h3 className="text-lg font-black text-slate-900">
							Переименовать группу
						</h3>
						<input
							value={newTitle}
							onChange={event => setNewTitle(event.target.value)}
							className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
						/>
						<div className="mt-4 flex gap-2">
							<button
								type="button"
								onClick={() => setIsRenaming(false)}
								className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
							>
								Отмена
							</button>
							<button
								type="button"
								onClick={() => void handleRenameGroup()}
								className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
							>
								Сохранить
							</button>
						</div>
					</div>
				</Modal>
			) : null}
		</div>
	)
}
