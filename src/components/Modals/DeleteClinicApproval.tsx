import Modal from "@/src/components/ui/Modal";
import {useDeleteClinicMutation} from "@/src/services/api/clinicsApi";
import {useRouter} from "next/navigation";
import {useState} from 'react';
import ErrorModal from '@/src/components/ui/ErrorModal';

type props = {
    isOpen: boolean;
    onClose: () => void;
    clinicId: string
}

const DeleteClinicApproval = ({isOpen, onClose, clinicId}: props) => {

    const router = useRouter();
    const [deleteClinic, {isLoading}] = useDeleteClinicMutation();
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const handleDelete = async () => {
        setErrorMessage('');

        try {
            await deleteClinic(clinicId).unwrap();
            onClose()
            router.push('/clinics');
        } catch (e) {
            console.error(e);
            setErrorMessage('Не удалось удалить клинику');
        }
    }

    return (
        <Modal>
            {errorMessage && (
                <ErrorModal onClose={() => setErrorMessage('')}>
                    {errorMessage}
                </ErrorModal>
            )}

            <div>
                <h1 className="text-xl font-bold text-slate-900">
                    Удалить клинику?
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Вы уверены, что хотите удалить клинику из реестра? Это действие нельзя отменить.
                </p>
            </div>
            {isLoading ?
                <h2>Удаление ожидайте...</h2>
                :
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 sm:w-auto"
                    >
                        Нет
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="w-full rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                        {isLoading ? 'Удаление...' : 'Да, удалить'}
                    </button>
                </div>
            }
        </Modal>
    )
}

export default DeleteClinicApproval
