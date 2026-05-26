import {ReactNode} from "react";

interface props {
    children : ReactNode | ReactNode[];
}

const Modal = ({children} : props) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-h-[80vh] overflow-auto max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                {children}
            </div>
        </div>
    )
}

export default Modal;