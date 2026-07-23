type ErrorData = {
    message?: unknown;
    detail?: unknown;
    error?: unknown;
    title?: unknown;
    businessMessage?: unknown;
};

const SUCCESS_MESSAGES: Record<string, string | null> = {
    loginUser: 'Вход выполнен',
    registerUser: 'Сотрудник создан',
    createClinic: 'Клиника создана',
    updateClinic: 'Данные клиники сохранены',
    deleteClinic: 'Клиника удалена',
    createOrder: 'Заказ создан',
    updateOrder: 'Изменения заказа сохранены',
    deleteOrder: 'Заказ удалён',
    updateOrderStatus: 'Статус заказа обновлён',
    updateTaskStatus: 'Статус задачи обновлён',
    updateTaskMaterials: 'Материалы задачи сохранены',
    assignTask: 'Исполнитель назначен',
    updateTaskAssignment: 'План ответственных сохранён',
    addTask: 'Задача добавлена',
    updateUser: 'Данные сотрудника сохранены',
    updateUserAdminSetup: 'Настройки сотрудника сохранены',
    changeUserPassword: 'Пароль обновлён',
    createUsersBatch: 'Сотрудники созданы',
    deleteUser: 'Сотрудник удалён',
    createColor: 'Цвет создан',
    updateColor: 'Цвет сохранён',
    deleteColor: 'Цвет удалён',
    createMaterial: 'Материал создан',
    updateMaterial: 'Материал сохранён',
    deleteMaterial: 'Материал удалён',
    createWorkType: 'Тип работы создан',
    updateWorkType: 'Тип работы сохранён',
    deleteWorkType: 'Тип работы удалён',
    createAdminWorkflowStep: 'Шаг workflow сохранён',
    deleteAdminWorkflowStep: 'Шаг workflow удалён',
    createOrderStatus: 'Статус заказа создан',
    updateOrderStatusConfig: 'Статус заказа сохранён',
    deleteOrderStatus: 'Статус заказа удалён',
    returnTaskForRework: 'Задача возвращена на переделку',
    resolveTaskQualityIncident: 'Инцидент закрыт',
    uploadTaskFile: 'Файл загружен',
    initMultipartTaskFileUpload: null,
    uploadMultipartTaskFilePart: null,
    completeMultipartTaskFileUpload: 'Файл загружен',
    abortMultipartTaskFileUpload: null,
    deleteTaskFile: 'Файл удалён',
    upsertSalaryConfig: 'Схема оплаты сохранена',
    createSalaryStatement: 'Ведомость сформирована',
    deleteSalaryStatement: 'Черновик ведомости удалён',
    confirmSalaryStatement: 'Выплата подтверждена',
    createInvoice: 'Счёт создан',
    issueInvoice: 'Счёт выставлен',
    registerPayment: 'Оплата зарегистрирована',
    reversePayment: 'Оплата сторнирована',
    upsertNomenclatureNorm: 'Норма расхода сохранена',
    deleteNomenclatureNorm: 'Норма расхода удалена',
    receiveStock: 'Приход проведён',
    createWarehouseMaterial: 'Материал добавлен на склад',
    createProcurementOrder: 'Заказ поставщику создан',
    submitProcurementOrder: 'Заказ поставщику отправлен в работу',
    receiveProcurementOrder: 'Поставка принята',
    upsertProcurementSupplier: 'Поставщик сохранён',
    createInventoryCheck: 'Инвентаризация создана',
    startInventoryCheck: 'Инвентаризация начата',
    cancelInventoryCheck: 'Инвентаризация отменена',
    completeInventoryCheck: 'Инвентаризация завершена',
    updateInventoryItem: 'Фактическое количество сохранено',
    unlinkTelegram: 'Telegram отключён',
    updateTelegramSettings: 'Настройки Telegram сохранены',
    updateTelegramToken: 'Токен Telegram-бота сохранён',
    regenerateTelegramWebhookSecret: 'Webhook secret обновлён',
    connectTelegramIntegration: 'Webhook Telegram зарегистрирован',
    disconnectTelegramIntegration: 'Webhook Telegram отключён',
};

const SILENT_ERROR_ENDPOINTS = new Set([
    'abortMultipartTaskFileUpload',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function readText(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function getServerMessage(data: unknown) {
    if (typeof data === 'string') return data.trim();
    if (!isRecord(data)) return '';

    const errorData = data as ErrorData;
    return (
        readText(errorData.businessMessage) ||
        readText(errorData.message) ||
        readText(errorData.detail) ||
        readText(errorData.error) ||
        readText(errorData.title)
    );
}

export function shouldNotifyApiError(endpoint: string) {
    return !SILENT_ERROR_ENDPOINTS.has(endpoint);
}

export function getApiErrorMessage(error: unknown, endpoint = '') {
    if (!isRecord(error)) {
        return error instanceof Error && error.message
            ? error.message
            : 'Не удалось выполнить операцию';
    }

    const status = error.status;
    const serverMessage = getServerMessage(error.data);

    if (endpoint === 'loginUser' && status === 401) {
        return 'Неверный email или пароль';
    }

    if (status === 401) return 'Сессия истекла. Войдите в систему повторно';
    if (status === 403) return serverMessage || 'Недостаточно прав для этой операции';
    if (status === 404) return serverMessage || 'Запрашиваемые данные не найдены';
    if (status === 409) return serverMessage || 'Данные изменились. Обновите страницу и повторите попытку';
    if (status === 429) return serverMessage || 'Слишком много запросов. Подождите и повторите попытку';
    if (status === 400 || status === 422) {
        return serverMessage || 'Проверьте введённые данные';
    }
    if (status === 502) return serverMessage || 'Не удалось подключиться к серверу';
    if (typeof status === 'number' && status >= 500) {
        return serverMessage || 'Сервис временно недоступен. Попробуйте позже';
    }
    if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR') {
        return 'Нет соединения с сервером. Проверьте сеть и повторите попытку';
    }
    if (status === 'PARSING_ERROR') {
        return 'Сервер вернул некорректный ответ';
    }

    return serverMessage || readText(error.error) || 'Не удалось выполнить операцию';
}

export function getApiSuccessMessage(endpoint: string, method?: string) {
    if (Object.prototype.hasOwnProperty.call(SUCCESS_MESSAGES, endpoint)) {
        return SUCCESS_MESSAGES[endpoint];
    }

    if (method === 'DELETE') return 'Запись удалена';
    if (method === 'PUT' || method === 'PATCH') return 'Изменения сохранены';
    return 'Операция выполнена успешно';
}
