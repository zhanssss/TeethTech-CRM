'use client';

import { type FormEvent, useMemo, useState } from 'react';

import { useNotifications } from '@/src/features/notifications/useNotifications';
import { getApiErrorMessage } from '@/src/services/apiNotifications';
import { useSearchClinicsQuery } from '@/src/services/api/clinicsApi';
import {
    useLazyGetCompletedWorkActCandidatesQuery,
    usePreviewCompletedWorkActMutation,
} from '@/src/services/api/documentsApi';
import type {
    CompletedWorkAct,
    CompletedWorkActCandidate,
} from '@/src/types/document.types';

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function inputDate(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function defaultStart() {
    const now = new Date();
    return inputDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function defaultEnd() {
    return inputDate(new Date());
}

function apiBoundary(value: string, end: boolean) {
    const [year, month, day] = value.split('-').map(Number);
    const date = end
        ? new Date(year, month - 1, day, 23, 59, 59, 999)
        : new Date(year, month - 1, day, 0, 0, 0, 0);
    return date.toISOString();
}

function money(value?: number | null) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'KZT',
        maximumFractionDigits: 2,
    }).format(value ?? 0);
}

function number(value?: number | null) {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 }).format(value ?? 0);
}

function date(value?: string | null, withTime = false) {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'long',
        ...(withTime ? { timeStyle: 'short' as const } : {}),
    }).format(parsed);
}

function xml(value: unknown) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

function excelCell(value: unknown, type: 'String' | 'Number' = 'String') {
    return `<Cell><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
}

function exportExcel(act: CompletedWorkAct) {
    const headers = [
        'Клиника',
        'Ордер',
        'Дата закрытия',
        'Пациент',
        'Доктор',
        'Работа',
        'Количество',
        'Цена',
        'Скидка %',
        'Скидка сумма',
        'Сумма',
        'Оплачено по ордеру',
        'Долг по ордеру',
    ];
    const rows = act.clinics.flatMap((clinic) =>
        clinic.orders.flatMap((order) => {
            const lines = order.lines.length ? order.lines : [null];
            return lines.map((line) => [
                excelCell(clinic.clinicName),
                excelCell(order.orderNumber),
                excelCell(date(order.completedAt)),
                excelCell(order.patientName),
                excelCell(order.doctorName),
                excelCell(line?.workType ?? ''),
                excelCell(line?.quantity ?? 0, 'Number'),
                excelCell(line?.pricePerUnit ?? 0, 'Number'),
                excelCell(line?.discountPercent ?? 0, 'Number'),
                excelCell(line?.discountAmount ?? 0, 'Number'),
                excelCell(line?.totalAmount ?? order.totalAmount, 'Number'),
                excelCell(order.paidAmount, 'Number'),
                excelCell(order.debtAmount, 'Number'),
            ]);
        })
    );
    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="Акт">
  <Table>
   <Row ss:StyleID="Header">${headers.map((header) => excelCell(header)).join('')}</Row>
   ${rows.map((row) => `<Row>${row.join('')}</Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;
    const blob = new Blob([`\uFEFF${workbook}`], {
        type: 'application/vnd.ms-excel;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${act.documentNumber || 'completed-work-act'}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function printAct(act: CompletedWorkAct) {
    const previousTitle = document.title;
    document.title = act.documentNumber || 'Акт выполненных работ';
    window.print();
    document.title = previousTitle;
}

function Summary({ act }: { act: CompletedWorkAct }) {
    const items = [
        ['Номер акта', act.documentNumber],
        ['Период', `${date(act.startDate)} — ${date(act.endDate)}`],
        ['Сформирован', date(act.generatedAt, true)],
        ['Клиник', number(act.clinicCount)],
        ['Закрытых ордеров', number(act.orderCount)],
        ['Работ', number(act.taskCount)],
        ['Сумма', money(act.totalAmount)],
        ['Оплачено', money(act.paidAmount)],
        ['Долг', money(act.debtAmount)],
    ];
    return (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {items.map(([label, value], index) => (
                <article key={label} className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${
                    index === 8 ? 'border-red-200' : index === 7 ? 'border-emerald-200' : 'border-slate-200 dark:border-slate-700'
                }`}>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                    <p className={`mt-2 text-base font-black ${index === 8 ? 'text-red-700' : index === 7 ? 'text-emerald-700' : 'text-slate-900 dark:text-white'}`}>{value}</p>
                </article>
            ))}
        </section>
    );
}

function ActPreview({ act }: { act: CompletedWorkAct }) {
    return (
        <article className="completed-work-act-print mx-auto max-w-[1120px] bg-white p-6 text-slate-950 shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none">
            <header className="border-b-2 border-slate-900 pb-5 text-center">
                <h2 className="text-2xl font-black">{act.title || 'Акт выполненных работ'}</h2>
                <p className="mt-2 text-sm font-bold">№ {act.documentNumber}</p>
                <p className="mt-1 text-sm">за период {date(act.startDate)} — {date(act.endDate)}</p>
                <p className="mt-1 text-xs text-slate-500">Дата формирования: {date(act.generatedAt, true)}</p>
            </header>

            <div className="mt-8 space-y-10">
                {act.clinics.map((clinic) => (
                    <section key={clinic.clinicId} className="break-inside-avoid-page">
                        <div className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                            <p className="sm:col-span-2"><strong>Заказчик:</strong> {clinic.clinicName}</p>
                            <p><strong>БИН:</strong> {clinic.bin || '—'}</p>
                            <p><strong>Телефон:</strong> {clinic.phone || '—'}</p>
                            <p className="sm:col-span-2"><strong>Адрес:</strong> {clinic.address || '—'}</p>
                        </div>

                        <div className="mt-4 overflow-x-auto print:overflow-visible">
                            <table className="w-full min-w-[980px] border-collapse text-[10px] print:min-w-0 print:text-[8px]">
                                <thead>
                                    <tr>
                                        {['№', 'Ордер', 'Дата закрытия', 'Пациент', 'Доктор', 'Работа', 'Кол-во', 'Цена', 'Скидка %', 'Скидка сумма', 'Сумма'].map((label) => (
                                            <th key={label} className="border border-slate-500 bg-slate-100 px-1.5 py-2 text-left font-black print:bg-white">{label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clinic.orders.flatMap((order) =>
                                        order.lines.map((line) => ({ order, line }))
                                    ).map(({ order, line }, index) => (
                                        <tr key={`${order.orderId}-${line.taskId}`}>
                                            <td className="border border-slate-400 px-1.5 py-2">{index + 1}</td>
                                            <td className="border border-slate-400 px-1.5 py-2 font-bold">{order.orderNumber}</td>
                                            <td className="border border-slate-400 px-1.5 py-2">{date(order.completedAt)}</td>
                                            <td className="border border-slate-400 px-1.5 py-2">{order.patientName || '—'}</td>
                                            <td className="border border-slate-400 px-1.5 py-2">{order.doctorName || '—'}</td>
                                            <td className="border border-slate-400 px-1.5 py-2">{line.workType}</td>
                                            <td className="border border-slate-400 px-1.5 py-2 text-right">{number(line.quantity)}</td>
                                            <td className="border border-slate-400 px-1.5 py-2 text-right">{money(line.pricePerUnit)}</td>
                                            <td className="border border-slate-400 px-1.5 py-2 text-right">{number(line.discountPercent)}%</td>
                                            <td className="border border-slate-400 px-1.5 py-2 text-right">{money(line.discountAmount)}</td>
                                            <td className="border border-slate-400 px-1.5 py-2 text-right font-bold">{money(line.totalAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <dl className="ml-auto mt-4 grid max-w-md grid-cols-[1fr_auto] gap-x-8 gap-y-1 border-t border-slate-400 pt-3 text-sm">
                            <dt>Итого по клинике:</dt><dd className="text-right font-black">{money(clinic.totalAmount)}</dd>
                            <dt>Оплачено:</dt><dd className="text-right font-bold">{money(clinic.paidAmount)}</dd>
                            <dt>Долг:</dt><dd className="text-right font-black text-red-700 print:text-black">{money(clinic.debtAmount)}</dd>
                        </dl>
                    </section>
                ))}
            </div>

            <section className="mt-10 break-inside-avoid border-y-2 border-slate-900 py-4">
                <dl className="ml-auto grid max-w-md grid-cols-[1fr_auto] gap-x-8 gap-y-2 text-sm">
                    <dt className="font-bold">Общая сумма:</dt><dd className="text-right font-black">{money(act.totalAmount)}</dd>
                    <dt>Общая оплата:</dt><dd className="text-right font-black">{money(act.paidAmount)}</dd>
                    <dt>Общий долг:</dt><dd className="text-right font-black">{money(act.debtAmount)}</dd>
                </dl>
            </section>

            <footer className="mt-20 grid grid-cols-3 gap-8 text-sm">
                {['Исполнитель', 'Заказчик', 'Финансист'].map((label) => (
                    <div key={label}>
                        <div className="border-b border-slate-700 pb-8" />
                        <p className="mt-2 text-center">{label}</p>
                    </div>
                ))}
            </footer>
        </article>
    );
}

export default function CompletedWorkActsPage() {
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [clinicId, setClinicId] = useState('');
    const [search, setSearch] = useState('');
    const [onlyWithDebt, setOnlyWithDebt] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const [validationError, setValidationError] = useState('');
    const { notifyError } = useNotifications();
    const { data: clinicResult, isLoading: isClinicsLoading } = useSearchClinicsQuery({
        page: 0,
        size: 250,
        sort: 'name,ASC',
    });
    const [
        getCandidates,
        {
            data: candidates,
            isFetching: isCandidatesFetching,
            isError: isCandidatesError,
        },
    ] = useLazyGetCompletedWorkActCandidatesQuery();
    const [
        previewAct,
        {
            data: act,
            isLoading: isPreviewLoading,
            isError: isPreviewError,
            reset: resetPreview,
        },
    ] = usePreviewCompletedWorkActMutation();
    const isBusy = isCandidatesFetching || isPreviewLoading;
    const filteredCandidates = useMemo(() => {
        const query = search.trim().toLocaleLowerCase('ru-RU');
        return (candidates ?? []).filter((candidate) => {
            const matchesSearch = !query || [
                candidate.orderNumber,
                candidate.patientName,
                candidate.doctorName,
            ].some((value) => value?.toLocaleLowerCase('ru-RU').includes(query));
            return matchesSearch && (!onlyWithDebt || candidate.debtAmount > 0);
        });
    }, [candidates, onlyWithDebt, search]);
    const selectableVisible = filteredCandidates.filter(
        (candidate) => candidate.actStatus === 'NOT_INCLUDED'
    );
    const allVisibleSelected = selectableVisible.length > 0
        && selectableVisible.every((candidate) => selectedIds.has(candidate.orderId));

    const loadCandidates = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setValidationError('');
        if (!startDate || !endDate) {
            setValidationError('Укажите начало и конец периода.');
            return;
        }
        if (startDate > endDate) {
            setValidationError('Начало периода не может быть позже конца.');
            return;
        }
        try {
            resetPreview();
            await getCandidates({
                startDate: apiBoundary(startDate, false),
                endDate: apiBoundary(endDate, true),
                ...(clinicId ? { clinicId } : {}),
            }, true).unwrap();
            setSelectedIds(new Set());
        } catch (error) {
            notifyError(getApiErrorMessage(error, 'completedWorkActCandidates'));
        }
    };

    const toggleCandidate = (candidate: CompletedWorkActCandidate) => {
        if (candidate.actStatus !== 'NOT_INCLUDED') return;
        setSelectedIds((current) => {
            const next = new Set(current);
            if (next.has(candidate.orderId)) next.delete(candidate.orderId);
            else next.add(candidate.orderId);
            return next;
        });
    };

    const toggleVisible = () => {
        setSelectedIds((current) => {
            const next = new Set(current);
            for (const candidate of selectableVisible) {
                if (allVisibleSelected) next.delete(candidate.orderId);
                else next.add(candidate.orderId);
            }
            return next;
        });
    };

    const generatePreview = async () => {
        if (!selectedIds.size) return;
        try {
            await previewAct({ orderIds: Array.from(selectedIds) }).unwrap();
        } catch (error) {
            notifyError(getApiErrorMessage(error, 'completedWorkActPreview'));
        }
    };

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">
            <header className="print-hidden">
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600">Документы</p>
                <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Акт выполненных работ</h1>
                <p className="mt-1 text-sm text-slate-500">Закрытые ордера, выполненные работы, оплаты и задолженность клиник.</p>
            </header>

            <form onSubmit={loadCandidates} className="print-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-end">
                    <label>
                        <span className="mb-1.5 block text-xs font-black text-slate-500">Период с</span>
                        <input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={isBusy} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
                    </label>
                    <label>
                        <span className="mb-1.5 block text-xs font-black text-slate-500">Период по</span>
                        <input type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={isBusy} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
                    </label>
                    <label>
                        <span className="mb-1.5 block text-xs font-black text-slate-500">Клиника</span>
                        <select value={clinicId} onChange={(event) => setClinicId(event.target.value)} disabled={isBusy || isClinicsLoading} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                            <option value="">Все клиники</option>
                            {(clinicResult?.content ?? []).map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
                        </select>
                    </label>
                    <button type="submit" disabled={isBusy} className="min-h-11 rounded-xl bg-violet-600 px-6 text-sm font-black text-white disabled:bg-slate-300">
                        {isCandidatesFetching ? 'Загрузка…' : 'Показать ордера'}
                    </button>
                </div>
                {validationError ? <p className="mt-3 text-sm font-bold text-red-600">{validationError}</p> : null}
                {isCandidatesError ? <p className="mt-3 text-sm font-bold text-red-600">Не удалось загрузить закрытые ордера. Проверьте параметры и повторите попытку.</p> : null}
            </form>

            {candidates !== undefined ? (
                <section className="print-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Закрытые ордера</h2>
                            <p className="mt-1 text-xs text-slate-500">Выбрано: {selectedIds.size} из {candidates.length}</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ордер, пациент или доктор…" className="min-h-10 min-w-72 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
                            <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                <input type="checkbox" checked={onlyWithDebt} onChange={(event) => setOnlyWithDebt(event.target.checked)} className="accent-violet-600" />
                                Только с долгом
                            </label>
                            <button type="button" onClick={() => void generatePreview()} disabled={!selectedIds.size || isPreviewLoading} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white disabled:bg-slate-300">
                                {isPreviewLoading ? 'Формирование…' : 'Сформировать акт'}
                            </button>
                        </div>
                    </div>

                    {isPreviewError ? <p className="mt-3 text-sm font-bold text-red-600">Не удалось сформировать preview по выбранным ордерам.</p> : null}

                    {candidates.length === 0 ? (
                        <p className="p-12 text-center text-sm font-bold text-slate-500">За выбранный период закрытых ордеров нет.</p>
                    ) : filteredCandidates.length === 0 ? (
                        <p className="p-12 text-center text-sm font-bold text-slate-500">По текущим фильтрам ордера не найдены.</p>
                    ) : (
                        <div className="mt-4 max-h-[620px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="min-w-[1450px] w-full text-left">
                                <thead><tr>
                                    <th className="sticky top-0 z-10 bg-slate-100 px-3 py-3 dark:bg-slate-800">
                                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} aria-label="Выбрать все видимые ордера" className="accent-violet-600" />
                                    </th>
                                    {['Ордер', 'Клиника', 'Пациент', 'Доктор', 'Дата закрытия', 'Работ', 'Сумма', 'Оплачено', 'Долг', 'Статус акта'].map((label) => <th key={label} className="sticky top-0 z-10 whitespace-nowrap bg-slate-100 px-3 py-3 text-[9px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800">{label}</th>)}
                                </tr></thead>
                                <tbody>{filteredCandidates.map((candidate) => {
                                    const selected = selectedIds.has(candidate.orderId);
                                    const included = candidate.actStatus !== 'NOT_INCLUDED';
                                    return (
                                        <tr key={candidate.orderId} onClick={() => toggleCandidate(candidate)} className={`${included ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${selected ? 'bg-violet-50 dark:bg-violet-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
                                            <td className="border-t border-slate-100 px-3 py-3 dark:border-slate-800"><input type="checkbox" checked={selected} disabled={included} onChange={() => toggleCandidate(candidate)} onClick={(event) => event.stopPropagation()} className="accent-violet-600" /></td>
                                            <td className="whitespace-nowrap border-t border-slate-100 px-3 py-3 text-xs font-black dark:border-slate-800">{candidate.orderNumber}</td>
                                            <td className="whitespace-nowrap border-t border-slate-100 px-3 py-3 text-xs dark:border-slate-800">{candidate.clinicName}</td>
                                            <td className="whitespace-nowrap border-t border-slate-100 px-3 py-3 text-xs dark:border-slate-800">{candidate.patientName || '—'}</td>
                                            <td className="whitespace-nowrap border-t border-slate-100 px-3 py-3 text-xs dark:border-slate-800">{candidate.doctorName || '—'}</td>
                                            <td className="whitespace-nowrap border-t border-slate-100 px-3 py-3 text-xs dark:border-slate-800">{date(candidate.completedAt)}</td>
                                            <td className="border-t border-slate-100 px-3 py-3 text-xs dark:border-slate-800">{number(candidate.taskCount)}</td>
                                            <td className="whitespace-nowrap border-t border-slate-100 px-3 py-3 text-xs font-bold dark:border-slate-800">{money(candidate.totalAmount)}</td>
                                            <td className="whitespace-nowrap border-t border-slate-100 px-3 py-3 text-xs text-emerald-700 dark:border-slate-800">{money(candidate.paidAmount)}</td>
                                            <td className="whitespace-nowrap border-t border-slate-100 px-3 py-3 text-xs font-bold text-red-700 dark:border-slate-800">{money(candidate.debtAmount)}</td>
                                            <td className="border-t border-slate-100 px-3 py-3 text-xs dark:border-slate-800">
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${included ? 'bg-slate-200 text-slate-600' : selected ? 'bg-violet-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                                                    {included ? `В акте ${candidate.actNumber ?? candidate.actStatus}` : selected ? 'Выбран' : 'Не сформирован'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}</tbody>
                            </table>
                        </div>
                    )}
                </section>
            ) : isCandidatesFetching ? (
                <div className="print-hidden rounded-2xl border border-slate-200 bg-white p-14 text-center text-sm font-bold text-slate-500">Загружаем закрытые ордера…</div>
            ) : (
                <div className="print-hidden rounded-2xl border border-dashed border-slate-300 bg-white/60 p-14 text-center text-sm font-semibold text-slate-400">
                    Выберите период и нажмите «Показать ордера».
                </div>
            )}

            {act?.clinics.length ? (
                <>
                    <div className="print-hidden"><Summary act={act} /></div>
                    <div className="print-hidden flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => printAct(act)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700">Печать</button>
                        <button type="button" onClick={() => exportExcel(act)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white">Экспорт Excel</button>
                        <button type="button" onClick={() => printAct(act)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white">Экспорт PDF</button>
                    </div>
                    <ActPreview act={act} />
                </>
            ) : null}
        </div>
    );
}
