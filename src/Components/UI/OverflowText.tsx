import React from 'react';
import './styles.css';

export default ({ children }: { children: string | React.ReactNode | React.ReactNode[] }) => {
    const [isOverflow, setIsOverflow] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    const refs = React.useRef<HTMLSpanElement>(null)
    React.useEffect(() => {
        if (ref.current && refs.current && children !== undefined) {
            if ((refs.current.offsetWidth < ref.current.scrollWidth)) {
                setIsOverflow(true);
            } else {
                setIsOverflow(false);
            }
        }
    }, [ref, refs, children])

    return (
        <div className={"one-line" + (isOverflow ? " overflowed" : "")} ref={ref}>
            <span ref={refs}>{children}</span>
        </div>
    )
}