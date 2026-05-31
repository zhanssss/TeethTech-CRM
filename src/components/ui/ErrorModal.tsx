'use client';

import {ReactNode, useId, useState} from 'react';
import Modal from './Modal';

type ErrorModalProps = {
    children: ReactNode;
    title?: string;
    closeLabel?: string;
    isDismissible?: boolean;
    onClose?: () => void;
};

const ErrorModal = ({
                        children,
                        title = 'Ошибка',
                        closeLabel = 'Закрыть',
                        isDismissible = true,
                        onClose,
                    }: ErrorModalProps) => {
    const titleId = useId();
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = () => {
        if (onClose) {
            onClose();
            return;
        }

        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <Modal>
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="space-y-5"
            >
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
                        !
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 id={titleId} className="text-lg font-bold text-slate-900">
                            {title}
                        </h2>

                        <div className="mt-2 text-sm leading-6 text-slate-600">
                            {children}
                        </div>
                    </div>

                    {isDismissible && (
                        <button
                            type="button"
                            aria-label={closeLabel}
                            onClick={handleClose}
                            className="text-2xl font-bold leading-none text-slate-400 transition hover:text-slate-700"
                        >
                            &times;
                        </button>
                    )}
                </div>

                {isDismissible && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                        >
                            {closeLabel}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ErrorModal;
