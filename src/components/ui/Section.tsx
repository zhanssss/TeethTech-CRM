interface SectionProps {
    style?: string,
    children: React.ReactNode
}


const Section = ({style, children}:SectionProps) => {
    return ( 
        <section
            className={`overflow-hidden my-4 p-2 rounded-2xl border border-slate-200 bg-white shadow-sm ${style}`}
        >
            {children}
        </section> 
    );
}
 
export default Section;