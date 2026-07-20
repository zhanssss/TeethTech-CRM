import {ReactNode} from "react";

interface props {
    children : ReactNode | ReactNode[];
    contentClassName?: string;
}

const Modal = ({children, contentClassName = 'max-w-xl p-4 sm:p-6'} : props) => {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-md sm:items-center sm:p-4">
            <div className={`flex max-h-[94dvh] w-full flex-col overflow-y-auto rounded-t-[28px] border border-white/60 bg-white shadow-[0_28px_90px_-24px_rgba(15,23,42,.55)] dark:border-slate-700 dark:bg-slate-900 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] ${contentClassName}`}>
                {children}
            </div>
        </div>
    )
}

export default Modal;
