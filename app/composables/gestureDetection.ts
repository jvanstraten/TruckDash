
export type GestureType =
    // Down -> up with little movement.
    "click"

    // Down -> timer with little movement.
    | "hold"

    // Down -> movement.
    | "left" | "right" | "up" | "down"

    // Circular move (only for two fingers).
    | "cw" | "ccw"

    // If the callback returns true, a followup event will be sent when either
    // a second gesture is detected (without releasing pointers), or all
    // pointers have been released. This is the latter.
    | "release";

export type GestureData = {
    // The type of gesture that was detected.
    type: GestureType;

    // Number of pointers (= fingers) used for the gesture. 1 for mouse events,
    // 0 for emulated events.
    fingers: number;

    // If set, this is the first event reported for the current gesture.
    first: boolean;

    // If set, this gesture type cannot be captured.
    last: boolean;

    // Average position of the pointers in normalized client space (0..1 for
    // left to right and for top to bottom).
    middleX: number | undefined;
    middleY: number | undefined;
}

export type GestureConfig = {
    receiveSwipes?: boolean;
    receiveHolds?: boolean;
    receiveRotations?: boolean;
    receiveMultiTouch?: boolean;
    minimumDistanceRatio?: () => number;
    maximumTapDistanceRatio?: () => number;
    coneStrictness?: () => number;
    holdTimeout?: () => number;
}

export function useGestureDetection(
    callback: (gesture: GestureData) => boolean | undefined | void,
    config?: GestureConfig,
    debug?: Ref<string>,
) {

    type PointerState = {
        // Start coordinate in client space. If a gesture is
        // continued/captured by the callback, this holds the position of the
        // latest continue/capture event.
        startX: number;
        startY: number;

        // Most recent coordinate in client space.
        currentX: number;
        currentY: number;
    }

    type GestureState = {
        // Pointer state records.
        pointers: Map<number, PointerState>;

        // Rotation accumulator when two fingers are down. Rotation is stored
        // as a complex number to avoid overflow shenanigans.
        rotRe: number;
        rotIm: number;

        // Whether any pointer moved from its start location by more than the
        // maximum tap distance.
        moved: boolean;

        // Window timeout ID for the hold timer, or null if the hold timer
        // expired or was stopped for some other reason.
        holdTimer: number | null;

        // Whether we've called the gesture callback at least once already
        // without the user releasing all pointers.
        continued: boolean;

        // Set when the gesture was canceled by the browser, or by us if we
        // can't handle it. No more gesture events will be generated, but
        // pointer up/down is still tracked.
        cancelled: boolean;
    };

    type SwipeType = false | undefined | "left" | "right" | "up" | "down";

    // Configuration defaults.
    const defaultMinimumDistanceRatio = 0.2;
    const defaultConeStrictness = 1.2;
    const defaultHoldTimeout = 500;

    // Actual configuration.
    const receiveSwipes: boolean = config?.receiveSwipes ?? false;
    const receiveHolds: boolean = config?.receiveHolds ?? false;
    const receiveRotations: boolean = config?.receiveRotations ?? false;
    const receiveMultiTouch: boolean = config?.receiveMultiTouch ?? false;
    const minimumDistanceRatio: () => number = config?.minimumDistanceRatio ?? (() => defaultMinimumDistanceRatio);
    const maximumTapDistanceRatio: () => number = config?.maximumTapDistanceRatio ?? (() => minimumDistanceRatio() / 2);
    const coneStrictness: () => number = config?.coneStrictness ?? (() => defaultConeStrictness);
    const holdTimeout: () => number = config?.holdTimeout ?? (() => defaultHoldTimeout);

    // Current state of gesture detection.
    let gestureState: GestureState | null = null;

    // Set by finishGesture when we call the gesture callback, to keep track of
    // the gesture type we sent for the next call to updateDebug().
    let debugResult: string = "...";

    // Called at the end of event handlers to update the current state in the
    // gesture debug log.
    function updateDebug(cause: string) {
        if (debug === undefined) return;

        let state: string;
        if (gestureState !== null) {
            state = `d${gestureState.pointers.size}`;
            if (gestureState.holdTimer !== undefined) state += "T";
            if (gestureState.moved) state += "M";
        } else {
            state = "u";
        }

        debug.value = `${cause}: ${state}-${debugResult}`;
        debugResult = "...";
    }


    // Makes a new pointer state record from a pointer down event.
    function makePointer(event: PointerEvent): PointerState {
        return {
            startX: event.clientX,
            startY: event.clientY,
            currentX: event.clientX,
            currentY: event.clientY,
        };
    }

    // Resets the state of a pointer record to prepare for a followup gesture.
    function resetPointer(state: PointerState | null) {
        if (state === null) return;
        state.startX = state.currentX;
        state.startY = state.currentY;
    }

    // Handles the hold timer event.
    function onHoldTimer() {
        if (gestureState === null) return;
        gestureState.holdTimer = null;

        if (!gestureState.cancelled) {
            const swipe = isSwipe();
            if (swipe === false && !gestureState.moved) {
                finishGesture("hold");
            }
        }
        updateDebug("Ti");
    }

    // Starts or stops the hold timer.
    function runHoldTimer(run: boolean) {
        if (gestureState === null) return;
        if (gestureState.holdTimer !== null) {
            window.clearTimeout(gestureState.holdTimer);
            gestureState.holdTimer = null;
        }
        if (run && receiveHolds) {
            gestureState.holdTimer = window.setTimeout(() => onHoldTimer(), holdTimeout());
        }
    }

    // Returns whether the current movement qualifies as a swipe, and if so,
    // in which direction.
    function isSwipe(): SwipeType {
        if (gestureState === null || gestureState.cancelled) return undefined;

        // Determine averaged finger movement from the start position.
        let dx = 0;
        let dy = 0;
        for (const pointerState of gestureState.pointers.values()) {
            dx += pointerState.currentX - pointerState.startX;
            dy += pointerState.currentY - pointerState.startY;
        }
        dx /= gestureState.pointers.size;
        dy /= gestureState.pointers.size;

        const distanceSqr = dx * dx + dy * dy;
        const threshold = Math.min(window.innerWidth, window.innerHeight) * minimumDistanceRatio();
        if (distanceSqr < threshold * threshold) return false;
        if (Math.abs(dx) > Math.abs(dy) * coneStrictness()) {
            return dx > 0 ? "right" : "left";
        }
        if (Math.abs(dy) > Math.abs(dx) * coneStrictness()) {
            return dy > 0 ? "down" : "up";
        }
        return undefined;
    }

    // Calls the user callback to finish the current gesture.
    function finishGesture(type?: GestureType) {
        let capture = false;
        debugResult = type === undefined ? "none" : type;
        if (type !== undefined) {
            let middleX = 0;
            let middleY = 0;
            let fingers = 0;
            let first = true;

            if (gestureState !== null) {
                debugResult += `-${fingers}`;
                for (const pointerState of gestureState.pointers.values()) {
                    middleX += pointerState.currentX + pointerState.startX;
                    middleY += pointerState.currentY + pointerState.startY;
                }
                middleX /= window.innerWidth * gestureState.pointers.size * 2;
                middleY /= window.innerHeight * gestureState.pointers.size * 2;
                fingers = gestureState.pointers.size;
                first = !gestureState.continued;
            }

            const last = type == "click" || type == "release";

            // Actually call the callback, at least if there aren't too many
            // fingers.
            if (fingers <= 1 || receiveMultiTouch) {
                capture = callback({type, fingers, first, last, middleX, middleY}) ?? false;
            }

            // Some gesture types cannot be continued.
            if (capture && last) {
                console.warn(`ignoring gesture callback's attempt to capture ${type}!`);
                capture = false;
            }
            if (capture) {
                debugResult += "...";
            }
        }
        if (gestureState !== null) {
            if (capture) {
                // Reset movement states.
                for (const pointerState of gestureState.pointers.values()) {
                    resetPointer(pointerState);
                }
                gestureState.rotRe = 1.0;
                gestureState.rotIm = 0.0;

                // Restart the hold timer if we haven't moved yet, so longer
                // holds can be detected.
                runHoldTimer(!gestureState.moved);

                // Set continued flag so clicks are disabled and release events
                // are generated.
                gestureState.continued = true;
            } else {
                // Cancel the gesture, so no further events are generated.
                runHoldTimer(false);
                gestureState.cancelled = true;
            }
        }
    }

    // Some mobile browsers will generate click events regardless of
    // preventDefault on the pointer events. We want to ignore those, because
    // we'd get send two taps instead of one otherwise. But we DO want to
    // handle emulated clicks from keyboard navigation. There is undoubtedly
    // a better way, but a timer suffices; we ignore onclick if a pointer up
    // event has fired recently.
    let noClickTimer: number | undefined = undefined;
    function noClicks(event: MouseEvent, isUp?: boolean) {
        event.stopPropagation();
        event.preventDefault();
        if (isUp) {
            if (noClickTimer !== undefined) window.clearTimeout(noClickTimer);
            noClickTimer = window.setTimeout(() => noClickTimer = undefined, 100);
        }
    }

    function onPointerDown(event: PointerEvent) {
        // Only acknowledge the primary button of the pointing device.
        if (event.button != 0) {
            updateDebug(`Do${event.button}`);
            return;
        }

        // Capture everything else.
        noClicks(event);
        const target = event.target as HTMLElement;
        target.setPointerCapture(event.pointerId);

        // Handle the start of a gesture.
        if (gestureState === null) {
            const pointers = new Map();
            pointers.set(event.pointerId, makePointer(event));
            gestureState = {
                pointers,
                rotRe: 1.0,
                rotIm: 0.0,
                moved: false,
                holdTimer: null,
                continued: false,
                cancelled: false,
            }
            runHoldTimer(true);
            updateDebug("D1");
            return;
        }

        // We should have a new pointer here, but check to be sure.
        if (gestureState.pointers.has(event.pointerId)) {
            // Wait what?
            updateDebug("D!");
            return;
        }

        // Make a new pointer record.
        gestureState.pointers.set(event.pointerId, makePointer(event));

        // If we've reached the maximum number of pointers supported, finish
        // the gesture. As a safeguard, delete it entirely; sometimes pointers
        // get "stuck on" somehow. Not sure why that happens.
        if (gestureState.pointers.size >= 5) {
            finishGesture(gestureState.cancelled ? undefined : "click");
            gestureState = null;
        }

        updateDebug(`D${gestureState?.pointers?.size ?? 0}`);
    }

    function onPointerMove(event: PointerEvent) {
        noClicks(event);

        // Are we tracking this pointer? If so, get its state record.
        if (gestureState === null || gestureState.cancelled) return;
        let pointerState = gestureState.pointers.get(event.pointerId);
        if (pointerState === undefined) return;

        // Accumulate rotation.
        if (gestureState.pointers.size == 2) {
            let otherId = null;
            for (otherId of gestureState.pointers.keys()) {
                if (otherId != event.pointerId) break;
            }
            const otherState = gestureState.pointers.get(otherId!)!;
            const dxBefore = pointerState.currentX - otherState.currentX;
            const dyBefore = pointerState.currentY - otherState.currentY;
            const dxAfter = event.clientX - otherState.currentX;
            const dyAfter = event.clientY - otherState.currentY;

            // Compute before * conj(after) to subtract the angles.
            let re = dxBefore * dxAfter + dyBefore * dyAfter;
            let im = dyBefore * dxAfter - dxBefore * dyAfter;

            // Normalize. Ignore if the norm is too small. The norm will be the
            // square of the pixel distance between the two pointers, so it
            // should really be quite bit.
            const norm = Math.hypot(re, im);
            if (norm > 100) {
                re /= norm;
                im /= norm;

                // Multiply with rotation accumulator to add the angle. Float
                // error aside, this should stay normalized, and float error
                // *should* not be significant here, so we'll avoid doing it.
                const newRe = re * gestureState.rotRe - im * gestureState.rotIm;
                const newIm = re * gestureState.rotIm + im * gestureState.rotRe;
                gestureState.rotRe = newRe;
                gestureState.rotIm = newIm;
            }
        }

        // Update pointer state.
        pointerState.currentX = event.clientX;
        pointerState.currentY = event.clientY;

        // Detect movement to cancel click and hold gestures.
        if (!gestureState.moved) {
            const dx = pointerState.currentX - pointerState.startX;
            const dy = pointerState.currentY - pointerState.startY;
            const distanceSqr = dx * dx + dy * dy;
            const threshold = Math.min(window.innerWidth, window.innerHeight) * maximumTapDistanceRatio();
            if (distanceSqr > threshold * threshold) {
                gestureState.moved = true;
            }
        }

        // Check for rotations. Since we start the accumulator at (real) 1,
        // the imaginary part will go up and down with rotation. We'll stop at
        // +/- 0.5i, corresponding to 30 degrees of rotation.
        if (receiveRotations) {
            if (gestureState.rotIm < -0.5) {
                finishGesture("cw");
            } else if (gestureState.rotIm > 0.5) {
                finishGesture("ccw");
            }
        }

        // Check for swipes.
        if (receiveSwipes) {
            let swipe = isSwipe();
            if (typeof swipe == "string") {
                finishGesture(swipe);
            }
        }
        updateDebug("Mo");
    }

    function onPointerUp(event: PointerEvent) {
        noClicks(event, true);
        if (gestureState === null) return;

        // Just in case there's movement data in the event that hasn't been
        // reported yet, handle that movement first.
        onPointerMove(event);

        // Which pointer is this?
        const pointerState = gestureState.pointers.get(event.pointerId);
        if (pointerState === undefined) {
            // Released pointer that we're not tracking, ignore.
            updateDebug("U?");
            return;
        } else if (gestureState.pointers.size > 1) {
            if (!gestureState.moved && !gestureState.continued && !gestureState.cancelled) {
                // Multi-touch tap.
                finishGesture("click");
            }

            // Clean up pointer state.
            gestureState.pointers.delete(event.pointerId);
        } else {
            if (gestureState.cancelled) {
                // Gesture was canceled; don't return anything, but clean up.
                finishGesture();
            } else if (gestureState.continued) {
                // Released the final pointer after a gesture continuation.
                finishGesture("release");
            } else if (!gestureState.moved) {
                // Released the pointer within the hold time period, without
                // moving, and without adding a second one (those would have
                // triggered different gestures).
                finishGesture("click");
            } else {
                // No gesture was detected, movement was detected but not a
                // valid swipe.
                finishGesture();
            }

            // This was the last pointer; clean up the whole gesture state.
            gestureState = null;
        }
        updateDebug("Up");
    }

    function onPointerCancel(event: PointerEvent) {
        noClicks(event, true);

        // At least one pointer was canceled by the browser. Stop the tracking
        // of gestures immediately.
        finishGesture();
        gestureState = null;
        updateDebug("Ca");
    }

    function onClick(event: MouseEvent | KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();

        // I think all clicks should be emulated at this point, since we're
        // capturing pointer up and down. But just in case...
        const isEmulated = event instanceof KeyboardEvent || noClickTimer === undefined;
        if (isEmulated) {
            finishGesture("click");
            updateDebug("Em");
            return;
        }

        // Fallback behavior: kill any ongoing gesture.
        finishGesture();
        updateDebug("Cl");
    }

    return {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        onClick,
    };
}
