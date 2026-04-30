"use client"

import { useEffect } from "react"
import Aos from "aos"
import 'aos/dist/aos.css'


export function AosInit(){

    useEffect(() => {
        const initAos = () => {
            Aos.init({
                duration: 800,
                once: true,
            })
            Aos.refreshHard()
        }

        let timeoutId: number | null = null
        if (document.readyState === "complete") {
            timeoutId = window.setTimeout(initAos, 0)
        } else {
            window.addEventListener("load", initAos, { once: true })
        }

        return () => {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId)
            }
            window.removeEventListener("load", initAos)
        }
    }, [])

    return null
}
