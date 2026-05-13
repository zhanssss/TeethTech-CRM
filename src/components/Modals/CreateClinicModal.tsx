'use client';

import { useState } from 'react';
import type { ClinicFormData, ClinicListItem } from '@/src/types/clinic.types';

type CreateClinicModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (clinic: ClinicListItem) => void;
};

export default function CreateClinicModal({
                                              isOpen,
                                              onClose,
                                              onSubmit,
                                          }: CreateClinicModalProps) {
    const [formData, setFormData] = useState<ClinicFormData>({
        name: '',
        address: '',
        phone: '',
        email: '',
        contactPerson: '',
        comment: '',
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newClinic = {
            id: Date.now(),
            ...formData,
            ordersCount: 0,
            activeOrders: 0,
            completedOrders: 0,
        };

        onSubmit(newClinic);
        onClose();

        setFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            contactPerson: '',
            comment: '',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Добавить клинику
                        </h2>
                        <p className="text-xs text-slate-500">
                            Заполните данные клиники для добавления в базу
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-2xl font-bold text-slate-400 transition hover:text-slate-700"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                                Название клиники
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="Dental Care Astana"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                                Контактное лицо
                            </label>
                            <input
                                type="text"
                                value={formData.contactPerson}
                                onChange={(e) =>
                                    setFormData({ ...formData, contactPerson: e.target.value })
                                }
                                placeholder="ФИО администратора / врача"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                                Телефон
                            </label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                placeholder="+7 777 000 00 00"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                placeholder="clinic@mail.com"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                                Адрес
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData({ ...formData, address: e.target.value })
                                }
                                placeholder="г. Астана, ул. ..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </div>

                        {/*<div className="md:col-span-2">*/}
                        {/*    <label className="mb-1 block text-xs font-bold uppercase text-slate-400">*/}
                        {/*        Комментарий*/}
                        {/*    </label>*/}
                        {/*    <textarea*/}
                        {/*        value={formData.comment}*/}
                        {/*        onChange={(e) =>*/}
                        {/*            setFormData({ ...formData, comment: e.target.value })*/}
                        {/*        }*/}
                        {/*        placeholder="Например: особые условия, цены, заметки по работе..."*/}
                        {/*        rows={4}*/}
                        {/*        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"*/}
                        {/*    />*/}
                        {/*</div>*/}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-400 transition hover:text-slate-700"
                        >
                            Отмена
                        </button>

                        <button
                            type="submit"
                            className="rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-95"
                        >
                            Добавить клинику
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
