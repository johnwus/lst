import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 1024;

function getIsMobile() {
    if (typeof window === "undefined") {
        return false;
    }

    return window.innerWidth < MOBILE_BREAKPOINT;
}

export default function useIsMobileView() {
    const [isMobile, setIsMobile] = useState(getIsMobile);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(getIsMobile());
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return isMobile;
}
