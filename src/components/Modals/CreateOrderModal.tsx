'use client';

import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react';
import type { CreateOrderDto, CreateOrderTaskDto } from '@/src/types/order.types';
import type { TaskAttachment, TaskImage } from '@/src/types/task.types';
import Modal from '@/src/components/ui/Modal';
import ErrorModal from '@/src/components/ui/ErrorModal';
import { useGetClinicDoctorsQuery, useGetClinicPatientsQuery, useGetClinicsQuery } from '@/src/services/api/clinicsApi';
import { useGetUsersQuery } from '@/src/services/api/usersApi';
import { useGetWorkTypesQuery } from '@/src/services/api/laboratory/workTypesApi';
import { useGetMaterialsQuery } from '@/src/services/api/laboratory/materialApi';
import { useGetColorsQuery } from '@/src/services/api/laboratory/colorsApi';
import type { User } from '@/src/types/user.types';

type CreateOrderModalProps = {
    isOpen: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (order: CreateOrderDto) => Promise<void> | void;
};

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const CLINICS_LOOKUP_PARAMS = {
    page: 0,
    size: 100,
    sort: 'name,ASC',
};
const DOCTORS_LOOKUP_PARAMS = {
    page: 0,
    size: 100,
    sort: 'fullName,ASC',
};
const PATIENTS_LOOKUP_PARAMS = {
    page: 0,
    size: 100,
    sort: 'fullName,ASC',
};
const MAX_AUTOCOMPLETE_OPTIONS = 8;

const createEmptyTask = (): CreateOrderTaskDto => ({
    workTypeId: '',
    quantity: 1,
    toothNumbers: [],
    orderId: '',
    colorId: '',
    materialId: '',
    pricePerUnit: 0,
    discountPercent: 0,
    attachments: [],
    images: [],
});

function normalizeRoleValue(value: string | undefined) {
    return (value ?? '').toLowerCase().replace(/[-_/]+/g, ' ');
}

function getUserRoleValues(user: User) {
    return [
        user.role,
        ...(user.roles ?? []),
        user.specialization,
    ].filter((value): value is string => Boolean(value));
}

function filterUsersByRole(users: User[], tokens: string[]) {
    const normalizedTokens = tokens.map(normalizeRoleValue);

    return users.filter((user) => {
        const normalizedUserRoles = getUserRoleValues(user)
            .map(normalizeRoleValue)
            .join(' ');

        return normalizedTokens.some((token) =>
            normalizedUserRoles.includes(token)
        );
    });
}

function getUserLabel(user: User) {
    const meta = getUserRoleValues(user).join(' / ');
    return meta ? `${user.fullName} (${meta})` : user.fullName;
}

function formatFileSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function createPreviewId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function prepareAttachments(files: File[]): TaskAttachment[] {
    return files.map((file) => ({
        id: createPreviewId(),
        name: file.name,
        url: URL.createObjectURL(file),
        size: formatFileSize(file.size),
        type: file.type || 'file',
    }));
}

function prepareImages(files: File[]): TaskImage[] {
    return files.map((file) => ({
        id: createPreviewId(),
        name: file.name,
        url: URL.createObjectURL(file),
        size: formatFileSize(file.size),
    }));
}

function normalizePersonSearch(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getUniqueFullNames(items: Array<{ fullName: string }>) {
    return Array.from(new Set(items.map((item) => item.fullName).filter(Boolean)));
}

type PersonAutocompleteInputProps = {
    label: string;
    placeholder: string;
    value: string;
    options: string[];
    isLoading?: boolean;
    disabledMessage?: string;
    emptyMessage: string;
    noMatchMessage: string;
    loadingMessage: string;
    onChange: (value: string) => void;
};

function PersonAutocompleteInput({
    label,
    placeholder,
    value,
    options,
    isLoading = false,
    disabledMessage,
    emptyMessage,
    noMatchMessage,
    loadingMessage,
    onChange,
}: PersonAutocompleteInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const normalizedValue = normalizePersonSearch(value);
    const filteredOptions = useMemo(() => {
        if (!normalizedValue) {
            return options.slice(0, MAX_AUTOCOMPLETE_OPTIONS);
        }

        return options
            .filter((option) => normalizePersonSearch(option).includes(normalizedValue))
            .slice(0, MAX_AUTOCOMPLETE_OPTIONS);
    }, [normalizedValue, options]);
    const showDropdown = isFocused;
    const hasOptions = filteredOptions.length > 0;
    const statusMessage = disabledMessage ?? (
        isLoading
            ? loadingMessage
            : normalizedValue
                ? noMatchMessage
                : emptyMessage
    );

    return (
        <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
            <input
                required
                type="text"
                autoComplete="off"
                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                placeholder={placeholder}
                value={value}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => onChange(e.target.value)}
            />

            {showDropdown && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    {hasOptions ? (
                        <div className="max-h-60 overflow-y-auto py-1">
                            {filteredOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        onChange(option);
                                        setIsFocused(false);
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400">
                            {statusMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function CreateOrderModal({
    isOpen,
    isSubmitting = false,
    onClose,
    onSubmit,
}: CreateOrderModalProps) {
    const { data: clinicsPage, isLoading: isClinicsLoading } = useGetClinicsQuery(CLINICS_LOOKUP_PARAMS);
    const clinics = clinicsPage?.content ?? [];
    const { data: users = [], isLoading: isUsersLoading } = useGetUsersQuery();
    const { data: workTypes = [], isLoading: isWorkTypesLoading } = useGetWorkTypesQuery();
    const { data: materials = [], isLoading: isMaterialsLoading } = useGetMaterialsQuery();
    const { data: colors = [], isLoading: isColorsLoading } = useGetColorsQuery(true);

    const [submitError, setSubmitError] = useState('');
    const [formData, setFormData] = useState<CreateOrderDto>({
        clinicId: '',
        patientFullName: '',
        doctorFullName: '',
        deadline: '',
        dentalTechnicianId: '',
        cadCamOperatorId: '',
        comment: '',
        tasks: [createEmptyTask()],
    });
    const {
        data: doctorsPage,
        isLoading: isDoctorsLoading,
    } = useGetClinicDoctorsQuery(
        {
            id: formData.clinicId,
            ...DOCTORS_LOOKUP_PARAMS,
        },
        {
            skip: !formData.clinicId,
        }
    );
    const {
        data: patientsPage,
        isLoading: isPatientsLoading,
    } = useGetClinicPatientsQuery(
        {
            id: formData.clinicId,
            ...PATIENTS_LOOKUP_PARAMS,
        },
        {
            skip: !formData.clinicId,
        }
    );
    const doctorOptions = useMemo(
        () => formData.clinicId ? getUniqueFullNames(doctorsPage?.content ?? []) : [],
        [doctorsPage?.content, formData.clinicId]
    );
    const patientOptions = useMemo(
        () => formData.clinicId ? getUniqueFullNames(patientsPage?.content ?? []) : [],
        [patientsPage?.content, formData.clinicId]
    );

    const technicianOptions = useMemo(
        () => filterUsersByRole(users, ['керамист', 'зуб техник', 'technician', 'ceramist', 'dental technician', 'ROLE_CERAMIST']),
        [users]
    );

    const operatorOptions = useMemo(
        () => filterUsersByRole(users, ['cad', 'cam', 'оператор', 'operator', 'моделировщик', 'modeler', 'ROLE_OPERATOR']),
        [users]
    );

    const handleClinicChange = (clinicId: string) => {
        setFormData((prev) => ({
            ...prev,
            clinicId,
            doctorFullName: '',
        }));
    };

    if (!isOpen) return null;

    const total = formData.tasks.reduce((sum, task) => {
        const subtotal = Number(task.quantity) * Number(task.pricePerUnit);
        const taskTotal = Math.max(
            subtotal - subtotal * (Number(task.discountPercent) / 100),
            0
        );

        return sum + taskTotal;
    }, 0);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        try {
            await onSubmit({
                ...formData,
                tasks: formData.tasks.map((task) => ({
                    ...task,
                    quantity: Number(task.quantity),
                    pricePerUnit: Number(task.pricePerUnit),
                    discountPercent: Number(task.discountPercent),
                    orderId: task.orderId || '',
                    toothNumbers: task.toothNumbers,
                })),
            });
            onClose();
        } catch (error) {
            console.error('Ошибка создания заказа:', error);
            setSubmitError('Не удалось создать заказ');
        }
    };

    const handleAddNewTask = () => {
        setFormData((prev) => ({
            ...prev,
            tasks: [...prev.tasks, createEmptyTask()],
        }));
    };

    const handleRemoveTask = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            tasks: prev.tasks.filter((_, taskIndex) => taskIndex !== index),
        }));
    };

    const handleTaskChange = <Field extends keyof CreateOrderTaskDto>(
        index: number,
        field: Field,
        value: CreateOrderTaskDto[Field]
    ) => {
        setFormData((prev) => {
            const updatedTasks = [...prev.tasks];

            updatedTasks[index] = {
                ...updatedTasks[index],
                [field]: value,
            };

            return {
                ...prev,
                tasks: updatedTasks,
            };
        });
    };

    const handleToothToggle = (taskIndex: number, toothNumber: number) => {
        setFormData((prev) => {
            const updatedTasks = [...prev.tasks];
            const task = updatedTasks[taskIndex];
            const hasTooth = task.toothNumbers.includes(toothNumber);
            const toothNumbers = hasTooth
                ? task.toothNumbers.filter((number) => number !== toothNumber)
                : [...task.toothNumbers, toothNumber].sort((a, b) => a - b);

            updatedTasks[taskIndex] = {
                ...task,
                toothNumbers,
                quantity: toothNumbers.length || task.quantity,
            };

            return {
                ...prev,
                tasks: updatedTasks,
            };
        });
    };

    const handleTaskImagesChange = (taskIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);

        if (!files.length) return;

        const images = prepareImages(files);

        setFormData((prev) => {
            const updatedTasks = [...prev.tasks];
            const task = updatedTasks[taskIndex];

            updatedTasks[taskIndex] = {
                ...task,
                images: [...(task.images ?? []), ...images],
            };

            return {
                ...prev,
                tasks: updatedTasks,
            };
        });

        event.target.value = '';
    };

    const handleTaskAttachmentsChange = (taskIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);

        if (!files.length) return;

        const attachments = prepareAttachments(files);

        setFormData((prev) => {
            const updatedTasks = [...prev.tasks];
            const task = updatedTasks[taskIndex];

            updatedTasks[taskIndex] = {
                ...task,
                attachments: [...(task.attachments ?? []), ...attachments],
            };

            return {
                ...prev,
                tasks: updatedTasks,
            };
        });

        event.target.value = '';
    };

    const handleRemoveTaskImage = (taskIndex: number, imageId: string) => {
        setFormData((prev) => {
            const updatedTasks = [...prev.tasks];
            const task = updatedTasks[taskIndex];

            updatedTasks[taskIndex] = {
                ...task,
                images: (task.images ?? []).filter((image) => image.id !== imageId),
            };

            return {
                ...prev,
                tasks: updatedTasks,
            };
        });
    };

    const handleRemoveTaskAttachment = (taskIndex: number, attachmentId: string) => {
        setFormData((prev) => {
            const updatedTasks = [...prev.tasks];
            const task = updatedTasks[taskIndex];

            updatedTasks[taskIndex] = {
                ...task,
                attachments: (task.attachments ?? []).filter((attachment) => attachment.id !== attachmentId),
            };

            return {
                ...prev,
                tasks: updatedTasks,
            };
        });
    };

    const isLoadingDictionaries =
        isClinicsLoading ||
        isDoctorsLoading ||
        isPatientsLoading ||
        isUsersLoading ||
        isWorkTypesLoading ||
        isMaterialsLoading ||
        isColorsLoading;

    return (
        <Modal contentClassName="max-w-6xl p-0">
            {submitError && (
                <ErrorModal onClose={() => setSubmitError('')}>
                    {submitError}
                </ErrorModal>
            )}

            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Регистрация наряда</h2>
                    <p className="text-xs text-slate-500">Заказ, команда и технические задачи лаборатории</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-7">
                {isLoadingDictionaries && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                        Загрузка справочников...
                    </div>
                )}

                <section>
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" /> Заказчик и пациент
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Клиника</label>
                            <select
                                required
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.clinicId}
                                onChange={(e) => handleClinicChange(e.target.value)}
                            >
                                <option value="">Выберите клинику</option>
                                {clinics.map((clinic) => (
                                    <option key={clinic.id} value={clinic.id}>
                                        {clinic.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <PersonAutocompleteInput
                                label="Врач"
                                placeholder="ФИО врача"
                                value={formData.doctorFullName}
                                options={doctorOptions}
                                isLoading={isDoctorsLoading}
                                disabledMessage={!formData.clinicId ? 'Выберите клинику, чтобы увидеть врачей' : undefined}
                                emptyMessage="Нет сохраненных врачей у выбранной клиники"
                                noMatchMessage="Совпадений нет. Можно оставить введенное ФИО"
                                loadingMessage="Загрузка врачей..."
                                onChange={(doctorFullName) => setFormData((prev) => ({ ...prev, doctorFullName }))}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Срок</label>
                            <input
                                required
                                type="date"
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <PersonAutocompleteInput
                                label="ФИО пациента"
                                placeholder="ФИО пациента"
                                value={formData.patientFullName}
                                options={patientOptions}
                                isLoading={isPatientsLoading}
                                disabledMessage={!formData.clinicId ? 'Выберите клинику, чтобы увидеть пациентов' : undefined}
                                emptyMessage="Нет сохраненных пациентов у выбранной клиники"
                                noMatchMessage="Совпадений нет. Можно оставить введенное ФИО"
                                loadingMessage="Загрузка пациентов..."
                                onChange={(patientFullName) => setFormData((prev) => ({ ...prev, patientFullName }))}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Керамист</label>
                            <select
                                required
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.dentalTechnicianId}
                                onChange={(e) => setFormData({ ...formData, dentalTechnicianId: e.target.value })}
                            >
                                <option value="">Выбрать</option>
                                {technicianOptions.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {getUserLabel(user)}
                                    </option>
                                ))}
                                {!technicianOptions.length && (
                                    <option value="" disabled>
                                        Нет доступных керамистов
                                    </option>
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CAD/CAM оператор</label>
                            <select
                                required
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.cadCamOperatorId}
                                onChange={(e) => setFormData({ ...formData, cadCamOperatorId: e.target.value })}
                            >
                                <option value="">Выбрать</option>
                                {operatorOptions.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {getUserLabel(user)}
                                    </option>
                                ))}
                                {!operatorOptions.length && (
                                    <option value="" disabled>
                                        Нет доступных операторов
                                    </option>
                                )}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="flex flex-col">
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" /> Техническое задание
                    </h3>

                    {formData.tasks.map((task, index) => {
                        const subtotal = Number(task.quantity) * Number(task.pricePerUnit);
                        const taskTotal = Math.max(subtotal - subtotal * (Number(task.discountPercent) / 100), 0);

                        return (
                            <div key={index} className="border border-slate-200 rounded-2xl p-4 mb-4 bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-black text-slate-700">
                                        Техническая задача #{index + 1}
                                    </h4>

                                    {formData.tasks.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTask(index)}
                                            className="text-xs font-bold text-red-500 hover:text-red-700"
                                        >
                                            Удалить
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Вид работы
                                                </label>
                                                <select
                                                    required
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                                    value={task.workTypeId}
                                                    onChange={(e) => handleTaskChange(index, 'workTypeId', e.target.value)}
                                                >
                                                    <option value="">Выбрать работу</option>
                                                    {workTypes.map((workType) => (
                                                        <option key={workType.id} value={workType.id}>
                                                            {workType.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Кол-во
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                                    value={task.quantity}
                                                    onChange={(e) => handleTaskChange(index, 'quantity', Number(e.target.value))}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Цвет
                                                </label>
                                                <select
                                                    required
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                                    value={task.colorId}
                                                    onChange={(e) => handleTaskChange(index, 'colorId', e.target.value)}
                                                >
                                                    <option value="">Выбрать</option>
                                                    {colors.map((color) => (
                                                        <option key={color.id} value={color.id}>
                                                            {color.code} - {color.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Материал
                                                </label>
                                                <select
                                                    required
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                                    value={task.materialId}
                                                    onChange={(e) => handleTaskChange(index, 'materialId', e.target.value)}
                                                >
                                                    <option value="">Выбрать</option>
                                                    {materials.map((material) => (
                                                        <option key={material.id} value={material.id}>
                                                            {material.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Цена за 1 ед.
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                                    value={task.pricePerUnit}
                                                    onChange={(e) => handleTaskChange(index, 'pricePerUnit', Number(e.target.value))}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Скидка %
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                                    value={task.discountPercent}
                                                    onChange={(e) => handleTaskChange(index, 'discountPercent', Number(e.target.value))}
                                                />
                                            </div>

                                            <div className="bg-slate-900 text-white rounded-xl px-4 py-3 flex flex-col justify-center">
                                                <span className="text-[10px] uppercase text-slate-400 font-bold">
                                                    Итого задачи
                                                </span>
                                                <span className="text-lg font-black">
                                                    {taskTotal.toLocaleString('ru-RU')} ₸
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h5 className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                                                        Скрины
                                                    </h5>

                                                    <label className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-blue-700">
                                                        Добавить
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(e) => handleTaskImagesChange(index, e)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>

                                                {task.images?.length ? (
                                                    <div className="mt-3 space-y-2">
                                                        {task.images.map((image) => (
                                                            <div
                                                                key={image.id}
                                                                className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white px-3 py-2"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-xs font-bold text-slate-800">
                                                                        {image.name}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400">
                                                                        {image.size}
                                                                    </p>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveTaskImage(index, image.id)}
                                                                    className="text-sm font-black text-slate-300 hover:text-red-500"
                                                                    aria-label={`Удалить ${image.name}`}
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="mt-3 rounded-xl border border-dashed border-blue-200 bg-white/70 px-3 py-3 text-xs font-semibold text-slate-400">
                                                        Скрины не добавлены
                                                    </p>
                                                )}
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        Файлы
                                                    </h5>

                                                    <label className="cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-slate-800">
                                                        Прикрепить
                                                        <input
                                                            type="file"
                                                            multiple
                                                            onChange={(e) => handleTaskAttachmentsChange(index, e)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>

                                                {task.attachments?.length ? (
                                                    <div className="mt-3 space-y-2">
                                                        {task.attachments.map((file) => (
                                                            <div
                                                                key={file.id}
                                                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-xs font-bold text-slate-800">
                                                                        {file.name}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400">
                                                                        {file.size}
                                                                    </p>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveTaskAttachment(index, file.id)}
                                                                    className="text-sm font-black text-slate-300 hover:text-red-500"
                                                                    aria-label={`Удалить ${file.name}`}
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-400">
                                                        Файлы не добавлены
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-black text-blue-700 uppercase">
                                                Зубы
                                            </label>
                                            <span className="text-[10px] font-bold text-slate-500">
                                                {task.toothNumbers.length ? task.toothNumbers.join(', ') : 'не выбраны'}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {[upperTeeth, lowerTeeth].map((row, rowIndex) => (
                                                <div key={rowIndex} className="grid grid-cols-8 gap-1.5">
                                                    {row.map((toothNumber) => {
                                                        const isSelected = task.toothNumbers.includes(toothNumber);

                                                        return (
                                                            <button
                                                                key={toothNumber}
                                                                type="button"
                                                                onClick={() => handleToothToggle(index, toothNumber)}
                                                                className={`h-8 rounded-full border text-[11px] font-black transition ${
                                                                    isSelected
                                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                                                        : 'border-blue-200 bg-white text-blue-700 hover:border-blue-500'
                                                                }`}
                                                            >
                                                                {toothNumber}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <button
                        type="button"
                        onClick={handleAddNewTask}
                        className="w-10 h-10 cursor-pointer self-end my-2 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                        +
                    </button>
                </section>

                <section>
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" /> Комментарий к заказу
                    </h3>

                    <textarea
                        rows={4}
                        placeholder="Например: срочный заказ, особенности посадки, пожелания врача..."
                        className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition resize-none"
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    />
                </section>

                <div className="flex justify-end">
                    <div className="bg-slate-900 text-white rounded-2xl px-6 py-4 min-w-[220px]">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">
                            Общая сумма заказа
                        </p>
                        <p className="text-2xl font-black">
                            {total.toLocaleString('ru-RU')} ₸
                        </p>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-10 py-3 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                        {isSubmitting ? 'Создание...' : 'Создать заказ'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
