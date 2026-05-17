"use client"

import { useEffect } from "react"
import 'aos/dist/aos.css'


export function AosInit(){

    useEffect(() => {
        let isMounted = true

        const initAos = () => {
            void import("aos").then((module) => {
                if (!isMounted) {
                    return
                }

                const Aos = module.default
                Aos.init({
                    duration: 800,
                    once: true,
                })
                Aos.refreshHard()
            })
        }

        let timeoutId: number | null = null
        if (document.readyState === "complete") {
            timeoutId = window.setTimeout(initAos, 0)
        } else {
            window.addEventListener("load", initAos, { once: true })
        }

        return () => {
            isMounted = false
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId)
            }
            window.removeEventListener("load", initAos)
        }
    }, [])

    return null
}
