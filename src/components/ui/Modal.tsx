import {ReactNode} from "react";

interface props {
    children : ReactNode | ReactNode[];
    contentClassName?: string;
}

const Modal = ({children, contentClassName = 'max-w-xl p-6'} : props) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className={`w-full max-h-[80vh] overflow-auto rounded-2xl bg-white shadow-2xl ${contentClassName}`}>
                {children}
            </div>
        </div>
    )
}

export default Modal;
