'use client'

import { useParams, useRouter } from 'next/navigation'
import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
	type MouseEvent
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ErrorState from '@/src/components/ui/ErrorState'
import Modal from '@/src/components/ui/Modal'
import {
	appendMessage,
	appendMessages,
	markMessageDeleted,
	removeMessage,
	replaceMessage,
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
	useDeleteChatMessageMutation,
	useGetChatsQuery,
	useMarkChatReadMutation,
	useRemoveChatMemberMutation,
	useRenameGroupChatMutation,
	useSendTextMessageMutation,
	useUploadChatFileMutation
} from '@/src/services/api/chatApi'
import { useGetUsersQuery } from '@/src/services/api/usersApi'
import {
	getChatRealtimeStatus,
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

type MessageContextMenuState = {
	messageId: string
	left: number
	top: number
}

const CONTEXT_MENU_WIDTH = 224
const CONTEXT_MENU_HEIGHT = 196
const CONTEXT_MENU_GAP = 8

export default function ChatPage() {
	const router = useRouter()
	const params = useParams<{ conversationId?: string }>()
	const dispatch = useDispatch()
	const { id: currentUserId, name: currentUserName } = useSelector(
		(state: RootState) => state.auth
	)
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
	const [isNearBottom, setIsNearBottom] = useState(true)
	const [messageContextMenu, setMessageContextMenu] =
		useState<MessageContextMenuState | null>(null)
	const [forwardMessageId, setForwardMessageId] = useState<string | null>(null)
	const [forwardSearch, setForwardSearch] = useState('')
	const [isForwarding, setIsForwarding] = useState(false)
	const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
	const messageListRef = useRef<HTMLDivElement | null>(null)
	const composerRef = useRef<HTMLTextAreaElement | null>(null)
	const contextMenuRef = useRef<HTMLDivElement | null>(null)
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
	const [deleteChatMessage] = useDeleteChatMessageMutation()
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
	const sortedMessages = useMemo(
		() =>
			[...activeMessages].sort(
				(left, right) =>
					new Date(left.createdAt).getTime() -
					new Date(right.createdAt).getTime()
			),
		[activeMessages]
	)
	const activeMembers = activeConversationId
		? (membersByConversation[activeConversationId] ?? [])
		: []
	const activePagination = activeConversationId
		? paginationByConversation[activeConversationId]
		: undefined
	const filteredChats = useMemo(() => {
		const term = search.trim().toLocaleLowerCase('ru')
		return [...chats]
			.sort(
				(left, right) =>
					Date.parse(right.lastMessageAt ?? '') -
					Date.parse(left.lastMessageAt ?? '')
			)
			.filter(chat => !term || chat.title.toLocaleLowerCase('ru').includes(term))
	}, [chats, search])
	const forwardChats = useMemo(() => {
		const term = forwardSearch.trim().toLocaleLowerCase('ru')
		return [...chats]
			.sort(
				(left, right) =>
					Date.parse(right.lastMessageAt ?? '') -
					Date.parse(left.lastMessageAt ?? '')
			)
			.filter(chat => !term || chat.title.toLocaleLowerCase('ru').includes(term))
	}, [chats, forwardSearch])
	const contextMessage = messageContextMenu
		? activeMessages.find(message => message.id === messageContextMenu.messageId) ??
			null
		: null
	const forwardMessage = forwardMessageId
		? activeMessages.find(message => message.id === forwardMessageId) ?? null
		: null

	const scrollToBottom = () => {
		const el = messageListRef.current
		if (!el) return
		el.scrollTop = el.scrollHeight
	}

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

	useEffect(
		() => () => {
			dispatch(setActiveConversation(null))
		},
		[dispatch]
	)

	useEffect(() => {
		setMessageContextMenu(null)
		setForwardMessageId(null)
		setForwardSearch('')
	}, [activeConversationId])

	useEffect(() => {
		if (!messageContextMenu) return

		const closeOnPointerDown = (event: PointerEvent) => {
			if (
				contextMenuRef.current &&
				!contextMenuRef.current.contains(event.target as Node)
			) {
				setMessageContextMenu(null)
			}
		}
		const closeOnEscape = (event: globalThis.KeyboardEvent) => {
			if (event.key === 'Escape') setMessageContextMenu(null)
		}
		const closeOnViewportChange = () => setMessageContextMenu(null)

		document.addEventListener('pointerdown', closeOnPointerDown)
		document.addEventListener('keydown', closeOnEscape)
		window.addEventListener('resize', closeOnViewportChange)
		window.addEventListener('scroll', closeOnViewportChange, true)

		return () => {
			document.removeEventListener('pointerdown', closeOnPointerDown)
			document.removeEventListener('keydown', closeOnEscape)
			window.removeEventListener('resize', closeOnViewportChange)
			window.removeEventListener('scroll', closeOnViewportChange, true)
		}
	}, [messageContextMenu])

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

				const position = el.scrollHeight - el.scrollTop - el.clientHeight
				setIsNearBottom(position < 80)
			}

			handler()
			el.addEventListener('scroll', handler)
			return () => el.removeEventListener('scroll', handler)
		}
	}, [activeConversationId, activePagination, dispatch, notifyError])

	useLayoutEffect(() => {
		if (!activeConversationId || !messageListRef.current) return
		if (sortedMessages.length === 0) return

		const lastMessage = sortedMessages[sortedMessages.length - 1]
		if (isNearBottom || lastMessage?.senderId === currentUserId) {
			scrollToBottom()
		}
	}, [activeConversationId, sortedMessages.length, isNearBottom, currentUserId])

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
		const conversationId = activeConversationId
		const originalReplyToId = replyToId
		const temporaryId = `pending-${crypto.randomUUID()}`
		const optimisticMessage: ChatMessageDto = {
			id: temporaryId,
			conversationId,
			senderId: currentUserId ?? '',
			senderName: currentUserName ?? 'Вы',
			text,
			replyToId: originalReplyToId,
			createdAt: new Date().toISOString(),
			editedAt: null,
			deleted: false,
			attachments: []
		}
		setSendError(null)
		dispatch(setSendingMessage(true))
		dispatch(appendMessage(optimisticMessage))
		setComposer('')
		setReplyToId(null)
		try {
			const payload = { text, replyToId: originalReplyToId }
			const created = await sendTextMessage({
				conversationId,
				body: payload
			}).unwrap()
			dispatch(replaceMessage({ conversationId, temporaryId, message: created }))
		} catch {
			dispatch(removeMessage({ conversationId, messageId: temporaryId }))
			setComposer(text)
			setReplyToId(originalReplyToId)
			setSendError('Не удалось отправить сообщение')
		} finally {
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

	const openMessageContextMenu = (
		message: ChatMessageDto,
		clientX: number,
		clientY: number
	) => {
		if (message.deleted || message.id.startsWith('pending-')) return

		const left = Math.max(
			CONTEXT_MENU_GAP,
			Math.min(
				clientX,
				window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_GAP
			)
		)
		const top = Math.max(
			CONTEXT_MENU_GAP,
			Math.min(
				clientY,
				window.innerHeight - CONTEXT_MENU_HEIGHT - CONTEXT_MENU_GAP
			)
		)

		setMessageContextMenu({ messageId: message.id, left, top })
	}

	const handleMessageContextMenu = (
		event: MouseEvent<HTMLDivElement>,
		message: ChatMessageDto
	) => {
		event.preventDefault()
		openMessageContextMenu(message, event.clientX, event.clientY)
	}

	const handleMessageContextKeyDown = (
		event: KeyboardEvent<HTMLDivElement>,
		message: ChatMessageDto
	) => {
		if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) {
			return
		}

		event.preventDefault()
		const rect = event.currentTarget.getBoundingClientRect()
		openMessageContextMenu(message, rect.left + rect.width / 2, rect.top + 24)
	}

	const handleReplyToMessage = (message: ChatMessageDto) => {
		setReplyToId(message.id)
		setMessageContextMenu(null)
		requestAnimationFrame(() => composerRef.current?.focus())
	}

	const handleCopyMessage = async (message: ChatMessageDto) => {
		const text =
			message.text?.trim() ||
			message.attachments.map(attachment => attachment.fileName).join('\n')
		if (!text) return

		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text)
			} else {
				const textarea = document.createElement('textarea')
				textarea.value = text
				textarea.style.position = 'fixed'
				textarea.style.opacity = '0'
				document.body.appendChild(textarea)
				textarea.select()
				const copied = document.execCommand('copy')
				textarea.remove()
				if (!copied) throw new Error('Copy failed')
			}
			notifySuccess('Сообщение скопировано')
		} catch {
			notifyError('Не удалось скопировать сообщение')
		} finally {
			setMessageContextMenu(null)
		}
	}

	const openForwardDialog = (message: ChatMessageDto) => {
		if (!message.text?.trim()) return
		setForwardMessageId(message.id)
		setForwardSearch('')
		setMessageContextMenu(null)
	}

	const handleForwardMessage = async (conversationId: string) => {
		const sourceText = forwardMessage?.text?.trim()
		if (!forwardMessage || !sourceText || isForwarding) return

		setIsForwarding(true)
		try {
			const created = await sendTextMessage({
				conversationId,
				body: {
					text: `Переслано от ${forwardMessage.senderName}:\n${sourceText}`,
					replyToId: null
				}
			}).unwrap()
			dispatch(appendMessage(created))
			notifySuccess('Сообщение переслано')
			setForwardMessageId(null)
			setForwardSearch('')
		} catch {
			notifyError('Не удалось переслать сообщение')
		} finally {
			setIsForwarding(false)
		}
	}

	const handleDeleteMessage = async (message: ChatMessageDto) => {
		if (
			!activeConversationId ||
			message.senderId !== currentUserId ||
			deletingMessageId
		) {
			return
		}
		setMessageContextMenu(null)
		if (!window.confirm('Удалить сообщение? Это действие нельзя отменить.')) return

		setDeletingMessageId(message.id)
		try {
			await deleteChatMessage({
				conversationId: activeConversationId,
				messageId: message.id
			}).unwrap()
			dispatch(
				markMessageDeleted({
					conversationId: activeConversationId,
					messageId: message.id
				})
			)
			if (replyToId === message.id) setReplyToId(null)
			notifySuccess('Сообщение удалено')
		} catch {
			notifyError('Не удалось удалить сообщение')
		} finally {
			setDeletingMessageId(null)
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
				tabIndex={message.deleted ? -1 : 0}
				onContextMenu={event => handleMessageContextMenu(event, message)}
				onKeyDown={event => handleMessageContextKeyDown(event, message)}
				aria-label={`Сообщение от ${message.senderName}. Откройте контекстное меню для действий.`}
				className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}
			>
				<div
					className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm transition-shadow ${messageContextMenu?.messageId === message.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''} ${isMine ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'}`}
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
							<div className="flex min-h-full flex-col">
							<div className="mt-auto" aria-hidden="true" />
							{isLoadingMessages ? (
								<div className="text-center text-sm text-slate-500">
									Загрузка истории…
								</div>
							) : sortedMessages.length === 0 ? (
								<div className="text-center text-sm text-slate-500">
									Сообщений пока нет
								</div>
							) : (
								 sortedMessages.map(message => renderMessage(message))
							)}
							</div>
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
			{messageContextMenu && contextMessage ? (
				<div
					ref={contextMenuRef}
					role="menu"
					aria-label="Действия с сообщением"
					className="fixed z-[70] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-sm text-slate-800 shadow-2xl"
					style={{
						left: messageContextMenu.left,
						top: messageContextMenu.top
					}}
				>
					<button
						type="button"
						role="menuitem"
						onClick={() => handleReplyToMessage(contextMessage)}
						className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
					>
						<span aria-hidden="true">↩</span>
						Ответить
					</button>
					<button
						type="button"
						role="menuitem"
						onClick={() => openForwardDialog(contextMessage)}
						disabled={!contextMessage.text?.trim()}
						title={
							contextMessage.text?.trim()
								? undefined
								: 'Пересылка файлов пока недоступна'
						}
						className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
					>
						<span aria-hidden="true">➜</span>
						Переслать
					</button>
					<button
						type="button"
						role="menuitem"
						onClick={() => void handleCopyMessage(contextMessage)}
						className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
					>
						<span aria-hidden="true">⧉</span>
						Копировать
					</button>
					{contextMessage.senderId === currentUserId ? (
						<>
							<div className="my-1 border-t border-slate-100" />
							<button
								type="button"
								role="menuitem"
								onClick={() => void handleDeleteMessage(contextMessage)}
								disabled={deletingMessageId === contextMessage.id}
								className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none disabled:opacity-50"
							>
								<span aria-hidden="true">⌫</span>
								Удалить
							</button>
						</>
					) : null}
				</div>
			) : null}
			{forwardMessage ? (
				<Modal>
					<div className="p-5">
						<div className="flex items-center justify-between gap-4">
							<h3 className="text-lg font-black text-slate-900">
								Переслать сообщение
							</h3>
							<button
								type="button"
								onClick={() => {
									setForwardMessageId(null)
									setForwardSearch('')
								}}
								className="text-slate-500"
								aria-label="Закрыть"
							>
								×
							</button>
						</div>
						<div className="mt-4 line-clamp-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
							{forwardMessage.text}
						</div>
						<input
							value={forwardSearch}
							onChange={event => setForwardSearch(event.target.value)}
							placeholder="Найти чат"
							className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
							autoFocus
						/>
						<div className="mt-3 max-h-72 space-y-2 overflow-auto">
							{forwardChats.length ? (
								forwardChats.map(chat => (
									<button
										key={chat.id}
										type="button"
										onClick={() => void handleForwardMessage(chat.id)}
										disabled={isForwarding}
										className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
									>
										<span className="font-semibold text-slate-800">{chat.title}</span>
										<span className="text-xs text-slate-400">
											{chat.type === 'GROUP' ? 'Группа' : 'Личный чат'}
										</span>
									</button>
								))
							) : (
								<p className="py-6 text-center text-sm text-slate-500">
									Чаты не найдены
								</p>
							)}
						</div>
					</div>
				</Modal>
			) : null}
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
