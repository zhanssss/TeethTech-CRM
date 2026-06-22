'use client';

import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

type WorkflowStep = {
    id: string;
    name: string;
};

type Workflow = {
    id: string;
    name: string;
    description: string;
    startName: string;
    endName: string;
    steps: WorkflowStep[];
    createdAt: string;
};

const STORAGE_KEY = 'teeth-tech-custom-workflows';

function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function SortableStep({
    step,
    index,
    onRemove,
}: {
    step: WorkflowStep;
    index: number;
    onRemove: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step.id });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
            <button
                type="button"
                aria-label={`Переместить этап ${step.name}`}
                className="cursor-grab rounded-lg bg-slate-100 px-2.5 py-2 text-slate-400 active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                ⋮⋮
            </button>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                {index + 2}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">
                {step.name}
            </p>
            <button
                type="button"
                onClick={() => onRemove(step.id)}
                className="rounded-lg px-2.5 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50"
            >
                Удалить
            </button>
        </div>
    );
}

export default function LaboratoryWorkflowsPage() {
    const [workflowName, setWorkflowName] = useState('');
    const [description, setDescription] = useState('');
    const [startName, setStartName] = useState('Новая задача');
    const [endName, setEndName] = useState('Готово');
    const [newStepName, setNewStepName] = useState('');
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [error, setError] = useState('');
    const [isStorageReady, setIsStorageReady] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    );

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved) setWorkflows(JSON.parse(saved) as Workflow[]);
        } catch {
            setWorkflows([]);
        } finally {
            setIsStorageReady(true);
        }
    }, []);

    useEffect(() => {
        if (!isStorageReady) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    }, [isStorageReady, workflows]);

    const addStep = () => {
        const name = newStepName.trim();
        if (!name) return;

        setSteps((current) => [
            ...current,
            { id: createId('step'), name },
        ]);
        setNewStepName('');
        setError('');
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        setSteps((current) => {
            const oldIndex = current.findIndex((step) => step.id === active.id);
            const newIndex = current.findIndex((step) => step.id === over.id);

            return arrayMove(current, oldIndex, newIndex);
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!workflowName.trim() || !startName.trim() || !endName.trim()) {
            setError('Заполните название workflow, начало и завершение');
            return;
        }

        if (steps.length === 0) {
            setError('Добавьте хотя бы один промежуточный этап');
            return;
        }

        const workflow: Workflow = {
            id: createId('workflow'),
            name: workflowName.trim(),
            description: description.trim(),
            startName: startName.trim(),
            endName: endName.trim(),
            steps,
            createdAt: new Date().toISOString(),
        };

        setWorkflows((current) => [workflow, ...current]);
        setWorkflowName('');
        setDescription('');
        setStartName('Новая задача');
        setEndName('Готово');
        setNewStepName('');
        setSteps([]);
        setError('');
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">
                    Конструктор workflow
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                    Диспетчер может создать свой тип задачи, назвать первый и последний этапы,
                    добавить промежуточные шаги и расставить их перетаскиванием.
                </p>
            </header>

            <form
                onSubmit={handleSubmit}
                className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(22rem,1.2fr)]"
            >
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="font-bold text-slate-900">Новый тип задачи</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Название будет видно диспетчеру при выборе процесса.
                    </p>

                    <div className="mt-5 space-y-4">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Название workflow
                            </span>
                            <input
                                value={workflowName}
                                onChange={(event) => setWorkflowName(event.target.value)}
                                placeholder="Например, Коронка из циркония"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Описание
                            </span>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Для каких заказов используется этот процесс"
                                rows={3}
                                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label>
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Начальный этап
                                </span>
                                <input
                                    value={startName}
                                    onChange={(event) => setStartName(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>

                            <label>
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Финальный этап
                                </span>
                                <input
                                    value={endName}
                                    onChange={(event) => setEndName(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>
                        </div>

                        {error && (
                            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            Сохранить workflow
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Этапы процесса</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Начало и завершение фиксированы, середину можно менять местами.
                            </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                            {steps.length + 2} этапа
                        </span>
                    </div>

                    <div className="mt-5 flex gap-2">
                        <input
                            value={newStepName}
                            onChange={(event) => setNewStepName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addStep();
                                }
                            }}
                            placeholder="Название промежуточного этапа"
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={addStep}
                            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                        >
                            + Этап
                        </button>
                    </div>

                    <div className="mt-5 space-y-3">
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                                1
                            </span>
                            <p className="text-sm font-bold text-emerald-900">
                                {startName.trim() || 'Начало'}
                            </p>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={steps.map((step) => step.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {steps.map((step, index) => (
                                        <SortableStep
                                            key={step.id}
                                            step={step}
                                            index={index}
                                            onRemove={(id) =>
                                                setSteps((current) =>
                                                    current.filter((item) => item.id !== id)
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {steps.length === 0 && (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-400">
                                Добавьте этапы между началом и завершением
                            </div>
                        )}

                        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                                {steps.length + 2}
                            </span>
                            <p className="text-sm font-bold text-blue-900">
                                {endName.trim() || 'Завершение'}
                            </p>
                        </div>
                    </div>
                </section>
            </form>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="font-bold text-slate-900">Сохраненные workflow</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Локальные настройки диспетчера для прототипа интерфейса.
                        </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {workflows.length}
                    </span>
                </div>

                {workflows.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-400">
                        Пока нет сохраненных процессов
                    </div>
                ) : (
                    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {workflows.map((workflow) => (
                            <article
                                key={workflow.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900">
                                            {workflow.name}
                                        </h3>
                                        {workflow.description && (
                                            <p className="mt-1 text-xs text-slate-500">
                                                {workflow.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setWorkflows((current) =>
                                                current.filter((item) => item.id !== workflow.id)
                                            )
                                        }
                                        className="text-xs font-bold text-red-500 transition hover:text-red-700"
                                    >
                                        Удалить
                                    </button>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                                        {workflow.startName}
                                    </span>
                                    {workflow.steps.map((step) => (
                                        <span key={step.id} className="contents">
                                            <span className="text-slate-300">→</span>
                                            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                                {step.name}
                                            </span>
                                        </span>
                                    ))}
                                    <span className="text-slate-300">→</span>
                                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">
                                        {workflow.endName}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
