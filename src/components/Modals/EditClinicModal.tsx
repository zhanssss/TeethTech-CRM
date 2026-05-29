'use client';

import {useState} from 'react';
import Modal from '@/src/components/ui/Modal'
import {useUpdateClinicMutation} from '@/src/services/api/clinicsApi'
import {UpdateClinicDto} from "@/src/types/clinic.types";

type EditClinicModalProps = {
    isOpen: boolean;
    clinic: UpdateClinicDto | null;
    onClose: () => void;
};

export default function EditClinicModal({
                                            isOpen,
                                            clinic,
                                            onClose,
                                        }: EditClinicModalProps) {
    const [formData, setFormData] = useState<UpdateClinicDto>(clinic ?? {
        id: '',
        name: '',
        phone: '',
        address: '',
        contactPerson: '',
        email: '',
        bin: ''
    });



    const [ updateClinic, {isLoading}] = useUpdateClinicMutation();

    if (!isOpen || !clinic) return null;

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
       e.preventDefault();

       if(!clinic.id){
           console.log('Clinic id is missing')
           return;
       }

       const body: UpdateClinicDto = {
           name: formData.name,
           phone: formData.phone,
           address: formData.address,
           contactPerson: formData.contactPerson,
           email: formData.email,
           bin: formData.bin,
       }


       try {
           console.log('Patch data', {
               id: clinic.id,
               body,
           })
           await updateClinic({
               id: clinic.id,
               body: formData,
           }).unwrap();
           onClose();
       } catch (e) {
           console.error(e);
       }
    }



    return (
        <Modal>
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">
                        Редактировать клинику
                    </h2>
                    <p className="text-xs text-slate-500">
                        Изменение данных клиники в базе
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

            <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
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
                                setFormData({
                                    ...formData,
                                    contactPerson: e.target.value,
                                })
                            }
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
                                setFormData({...formData, address: e.target.value})
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                        />
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
                    </div>
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
                        {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
