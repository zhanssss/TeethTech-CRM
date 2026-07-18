'use client';

import {useState} from 'react';
import {  CreateClinicDto} from '@/src/types/clinic.types';
import Modal from "../ui/Modal";
import {useCreateClinicMutation} from "@/src/services/api/clinicsApi";

type CreateClinicModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function CreateClinicModal({
                                              isOpen,
                                              onClose,
                                          }: CreateClinicModalProps) {
    const [formData, setFormData] = useState<CreateClinicDto>({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        bin: '',
    });
    const [createClinic, {isLoading}] = useCreateClinicMutation();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(formData)
        try {
            await createClinic(formData).unwrap();
            setFormData({
                name: '',
                contactPerson: '',
                phone: '',
                email: '',
                address: '',
                bin: ''
            });
            onClose();
        } catch (e) {
            console.error(e);
        }
    };



    return (
        <Modal>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
                <div className="min-w-0">
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

            <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
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
                                setFormData({...formData, name: e.target.value})
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
                                setFormData({...formData, contactPerson: e.target.value})
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
                                setFormData({...formData, phone: e.target.value})
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
                                setFormData({...formData, email: e.target.value})
                            }
                            placeholder="clinic@mail.com"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                            BIN
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.bin}
                            onChange={(e) =>
                                setFormData({...formData, bin: e.target.value})
                            }
                            placeholder="12 цифр"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                        <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                            Адрес
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.address}
                            onChange={(e) =>
                                setFormData({...formData, address: e.target.value})
                            }
                            placeholder="г. Астана, ул. ..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl px-5 py-2.5 text-sm font-bold text-slate-400 transition hover:text-slate-700 sm:w-auto"
                    >
                        Отмена
                    </button>

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-95 sm:w-auto"
                    >
                        {isLoading ? 'Создание...' : 'Добавить клинику'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
