"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";

const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

// 3 minutes real, 10 sec for testing (if needed, but keeping 3 mins as per spec)
export function useIdle(timeout: number) {
    const [isIdle, setIsIdle] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const startTimer = () => {
            // Clear existing timer
            if (timer) clearTimeout(timer);
            // Set new timer
            timer = setTimeout(() => {
                setIsIdle(true);
            }, timeout);
        };

        const handleActivity = () => {
            if (!isIdle) {
                startTimer();
            }
        };

        // Events that reset the timer
        const events = ["mousemove", "keydown", "click", "scroll"];

        // Initial start
        startTimer();

        // Attach listeners only if NOT idle
        // If isIdle is true, we Stop listening to movement, so it doesn't auto-unlock
        if (!isIdle) {
            events.forEach((event) => window.addEventListener(event, handleActivity));
        }

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach((event) => window.removeEventListener(event, handleActivity));
        };
    }, [timeout, isIdle]); // Re-run effect when isIdle changes

    return { isIdle, reset: () => setIsIdle(false) };
}

export function IdleLockScreen() {
    const { isIdle, reset } = useIdle(IDLE_TIMEOUT_MS);

    if (!isIdle) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm text-foreground animate-in fade-in duration-300">
            <div className="text-center space-y-6 p-8">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <LockKeyhole className="h-12 w-12 text-primary" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">รอคุณกลับเข้าสู่ระบบ</h1>

                <div className="pt-2">
                    <Button
                        size="lg"
                        className="font-semibold text-lg px-8 py-6 h-auto shadow-lg"
                        onClick={reset}
                    >
                        กลับเข้าสู่ระบบ
                    </Button>
                </div>
            </div>
        </div>
    );
}
