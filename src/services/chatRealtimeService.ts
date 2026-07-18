import type { ChatRealtimeEvent } from '@/src/types/chat.types'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_ENDPOINT = '/api/v1/ws-crm'
const CHAT_SUBSCRIPTION_DESTINATION = '/user/queue/chat'
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000, 30000]

type ChatRealtimeListener = (event: ChatRealtimeEvent) => void

type ChatRealtimeServiceState = {
	client: Client | null
	activeSubscriptions: Map<string, StompSubscription>
	listeners: Set<ChatRealtimeListener>
	reconnectAttempt: number
	isConnected: boolean
	isReconnecting: boolean
	isOnline: boolean
}

const state: ChatRealtimeServiceState = {
	client: null,
	activeSubscriptions: new Map(),
	listeners: new Set(),
	reconnectAttempt: 0,
	isConnected: false,
	isReconnecting: false,
	isOnline: true
}

function getAccessToken(): string | null {
	if (typeof document === 'undefined') return null

	const cookies = document.cookie.split(';').map(cookie => cookie.trim())
	const jwtCookie = cookies.find(cookie => cookie.startsWith('teethTechJwt='))

	if (!jwtCookie) return null

	return decodeURIComponent(jwtCookie.split('=')[1] ?? '')
}

function notifyConnectionStatus() {
	const status = state.isConnected
		? 'Подключено'
		: state.isReconnecting
			? 'Переподключение'
			: 'Офлайн'
	return status
}

function createClient() {
	const client = new Client({
		webSocketFactory: () => new SockJS(WS_ENDPOINT),
		connectHeaders: {
			Authorization: `Bearer ${getAccessToken() ?? ''}`
		},
		reconnectDelay: 0,
		debug: () => undefined,
		onConnect: () => {
			state.isConnected = true
			state.isReconnecting = false
			state.reconnectAttempt = 0
			subscribeToChat()
		},
		onDisconnect: () => {
			state.isConnected = false
		},
		onWebSocketClose: () => {
			state.isConnected = false
			state.isReconnecting = true
			scheduleReconnect()
		},
		onWebSocketError: () => {
			state.isConnected = false
			state.isReconnecting = true
			scheduleReconnect()
		}
	})

	return client
}

function scheduleReconnect() {
	if (state.reconnectAttempt >= RECONNECT_DELAYS_MS.length - 1) {
		return
	}

	const delay = RECONNECT_DELAYS_MS[state.reconnectAttempt]
	state.reconnectAttempt += 1

	window.setTimeout(() => {
		if (!state.client || state.client.active) return
		state.client.activate()
	}, delay)
}

function subscribeToChat() {
	if (!state.client?.connected) return
	if (state.activeSubscriptions.has(CHAT_SUBSCRIPTION_DESTINATION)) return

	const subscription = state.client.subscribe(
		CHAT_SUBSCRIPTION_DESTINATION,
		(message: IMessage) => {
			try {
				const payload = JSON.parse(message.body) as ChatRealtimeEvent
				state.listeners.forEach(listener => listener(payload))
			} catch (error) {
				console.error('Failed to parse chat realtime payload', error)
			}
		}
	)

	state.activeSubscriptions.set(CHAT_SUBSCRIPTION_DESTINATION, subscription)
}

function ensureConnection() {
	if (state.client?.active || state.client?.connected) return
	if (!state.client) {
		state.client = createClient()
	}
	state.client.activate()
}

export function connectChatRealtime() {
	ensureConnection()
}

export function disconnectChatRealtime() {
	state.client?.deactivate()
	state.client = null
	state.isConnected = false
	state.isReconnecting = false
	state.reconnectAttempt = 0
	state.activeSubscriptions.clear()
}

export function addChatRealtimeListener(listener: ChatRealtimeListener) {
	state.listeners.add(listener)
}

export function removeChatRealtimeListener(listener: ChatRealtimeListener) {
	state.listeners.delete(listener)
}

export function getChatRealtimeStatus() {
	return notifyConnectionStatus()
}

export function sendChatRead(conversationId: string) {
	if (!state.client?.connected) return

	state.client.publish({
		destination: `/app/chats/${conversationId}/read`,
		body: ''
	})
}

export function sendChatTextMessage(
	conversationId: string,
	payload: { text: string; replyToId?: string | null }
) {
	if (!state.client?.connected) return

	state.client.publish({
		destination: `/app/chats/${conversationId}/messages`,
		body: JSON.stringify(payload)
	})
}

export function getChatRealtimeServiceState() {
	return state
}
