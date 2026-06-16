import {ReactNode} from "react";

interface props {
    children : ReactNode | ReactNode[];
    contentClassName?: string;
}

const Modal = ({children, contentClassName = 'max-w-xl p-4 sm:p-6'} : props) => {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className={`flex max-h-[100dvh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl ${contentClassName}`}>
                {children}
            </div>
        </div>
    )
}

export default Modal;
