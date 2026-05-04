
export type GestureType =
    // Down -> up with little movement.
    "click"

    // Down -> timer with little movement.
    | "hold"

    // Down -> movement.
    | "left" | "right" | "up" | "down"

    // Two fingers: down -> down2 -> up/timer/linear move/circular move.
    | "2click" | "2hold" | "2left" | "2right" | "2up" | "2down" | "2cw" | "2ccw"

    // Down -> down2 -> down3. 3 fingers is the max we do anything with; we
    // don't distinguish between gesture types.
    | "3click"

    // If the callback returns true, a followup event will be sent when either
    // a second gesture is detected (without releasing pointers), or all
    // pointers have been released. This is the latter.
    | "release";

export type GestureData = {
    type: GestureType;
    middleX: number | undefined;
    middleY: number | undefined;
}

export type GestureConfig = {
    receiveSwipes?: boolean;
    receiveHolds?: boolean;
    minimumDistanceRatio?: number;
    maximumTapDistanceRatio?: number;
    coneStrictness?: number;
    holdTimeout?: number;
}

export function useGestureDetection(
    callback: (gesture: GestureData) => boolean | undefined,
    config?: GestureConfig,
    debug?: Ref<string>,
) {

    type PointerState = {
        id: number,
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
    }

    type GestureState = {
        // Pointer state records for tracking up to two pointers.
        p1: PointerState;
        p2: PointerState | null;

        // Whether we've called the gesture callback at least once already
        // without the user releasing all pointers.
        continued: boolean;

        // Whether any pointer moved from its start location by more than the
        // maximum tap distance.
        moved: boolean;

        // Window timeout ID for the hold timer, or null if the hold timer
        // expired or was stopped for some other reason.
        holdTimer: number | null;
    };

    type SwipeType = false | undefined | "left" | "right" | "up" | "down";

    // Configuration defaults.
    const defaultMinimumDistanceRatio = 0.2;
    const defaultConeStrictness = 1.2;
    const defaultHoldTimeout = 500;

    // Actual configuration.
    const receiveSwipes: boolean = config?.receiveSwipes ?? true;
    const receiveHolds: boolean = config?.receiveHolds ?? true;
    const minimumDistanceRatio: number = config?.minimumDistanceRatio ?? defaultMinimumDistanceRatio;
    const maximumTapDistanceRatio: number = (config?.maximumTapDistanceRatio ?? minimumDistanceRatio) / 2;
    const coneStrictness: number = config?.coneStrictness ?? defaultConeStrictness;
    const holdTimeout: number = config?.holdTimeout ?? defaultHoldTimeout;

    // Current state of gesture detection. Becomes null when a complete gesture
    // has been detected, even if one or more pointers are still down.
    let gestureState: GestureState | null = null;

    // Set of pointer IDs that are currently down. Used for emulated click
    // detection.
    let pointersDown: Set<number> = new Set();

    // Set by finishGesture when we call the gesture callback, to keep track of
    // the gesture type we sent for the next call to updateDebug().
    let debugResult: string = "...";

    // Called at the end of event handlers to update the current state in the
    // gesture debug log.
    function updateDebug(cause: string) {
        if (debug === undefined) return;

        let state = `d${pointersDown.size}`;
        if (gestureState !== null) {
            if (gestureState.holdTimer !== undefined) state += "T";
            if (gestureState.moved) state += "M";
        }

        debug.value = `${cause}: ${state}-${debugResult}`;
        debugResult = "...";
    }


    // Returns which pointer in our data structure the given pointer ID is for.
    // Should I refactor to a map? Probably!
    function whichPointer(id: number): "new" | "p1" | "p2" {
        if (gestureState === null) return "new";
        if (id === gestureState.p1.id) return "p1";
        if (gestureState.p2 === null) return "new";
        if (id === gestureState.p2.id) return "p2";
        return "new";
    }

    // Makes a new pointer state record from a pointer down event.
    function makePointer(event: PointerEvent): PointerState {
        return {
            id: event.pointerId,
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

        const swipe = isSwipe(gestureState);
        if (swipe === false && !gestureState.moved) {
            if (gestureState.p2 === null) {
                finishGesture("hold");
            } else {
                finishGesture("2hold");
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
            gestureState.holdTimer = window.setTimeout(() => onHoldTimer(), holdTimeout);
        }
    }

    // Resets the gesture state.
    function resetState() {
        runHoldTimer(false);
        gestureState = null;
    }

    // Returns whether the current movement qualifies as a swipe, and if so,
    // in which direction.
    function isSwipe(state: GestureState): SwipeType {
        let dx = state.p1.currentX - state.p1.startX;
        let dy = state.p1.currentY - state.p1.startY;
        if (state.p2 !== null) {
            dx += state.p2.currentX - state.p2.startX;
            dy += state.p2.currentY - state.p2.startY;
            dx /= 2;
            dy /= 2;
        }
        const distanceSqr = dx * dx + dy * dy;
        const threshold = Math.min(window.innerWidth, window.innerHeight) * minimumDistanceRatio;
        if (distanceSqr < threshold * threshold) return false;
        if (Math.abs(dx) > Math.abs(dy) * coneStrictness) {
            return dx > 0 ? "right" : "left";
        }
        if (Math.abs(dy) > Math.abs(dx) * coneStrictness) {
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

            if (gestureState !== null) {
                middleX = (gestureState.p1.startX + gestureState.p1.currentX) / 2;
                middleY = (gestureState.p1.startY + gestureState.p1.currentY) / 2;

                if (gestureState.p2 !== null) {
                    middleX += (gestureState.p2.startX + gestureState.p2.currentX) / 2;
                    middleY += (gestureState.p2.startY + gestureState.p2.currentY) / 2;
                    middleX /= 2;
                    middleY /= 2;
                }

                middleX /= window.innerWidth;
                middleY /= window.innerHeight;
            }

            capture = callback({ type, middleX, middleY }) ?? false;

            // Some gesture types cannot be continued.
            if (capture && (type.endsWith("click") || type == "release")) {
                console.warn(`ignoring gesture callback's attempt to capture ${type}!`);
                capture = false;
            }
        }
        if (gestureState && capture) {
            resetPointer(gestureState.p1);
            resetPointer(gestureState.p2);
            runHoldTimer(!gestureState.moved);
            gestureState.continued = true;
        } else {
            resetState();
        }
    }

    function onPointerDown(event: PointerEvent) {
        // Only acknowledge the left mouse button.
        if (event.button != 0) {
            updateDebug(`Do${event.button}`);
            return;
        }

        // Capture everything else.
        event.stopPropagation();
        event.preventDefault();
        pointersDown.add(event.pointerId);
        const target = event.target as HTMLElement;
        target.setPointerCapture(event.pointerId);

        // Handle the start of a gesture.
        if (gestureState === null) {
            gestureState = {
                p1: makePointer(event),
                p2: null,
                continued: false,
                moved: false,
                holdTimer: null,
            }
            runHoldTimer(true);
            updateDebug("D1");
            return;
        }

        // We should have a new pointer here, but check to be sure.
        if (whichPointer(event.pointerId) != "new") {
            // Wait what?
            updateDebug("D!");
            return;
        }

        // If we don't have a record for pointer 2, make one.
        if (gestureState.p2 === null) {
            gestureState.p2 = makePointer(event);
            updateDebug("D2");
            return;
        }

        // A third pointer has entered the chat.
        finishGesture("3click");
        updateDebug("D3");
    }

    function onPointerMove(event: PointerEvent) {
        event.stopPropagation();
        event.preventDefault();

        // Are we tracking this pointer? If so, get its state record.
        if (gestureState === null) return;
        const id = whichPointer(event.pointerId);
        if (id == "new") return;
        let pointerState = id == "p1" ? gestureState.p1 : gestureState.p2;
        if (pointerState === null) return;

        // Update pointer state.
        pointerState.currentX = event.clientX;
        pointerState.currentY = event.clientY;

        // Detect movement to cancel click and hold gestures.
        if (!gestureState.moved) {
            const dx = pointerState.currentX - pointerState.startX;
            const dy = pointerState.currentY - pointerState.startY;
            const distanceSqr = dx * dx + dy * dy;
            const threshold = Math.min(window.innerWidth, window.innerHeight) * maximumTapDistanceRatio;
            if (distanceSqr > threshold * threshold) {
                gestureState.moved = true;
            }
        }

        // Check for swipes.
        if (receiveSwipes) {
            let swipe = isSwipe(gestureState);
            if (typeof swipe == "string") {
                finishGesture(gestureState.p2 === null ? swipe : `2${swipe}`);
            }
        }
        updateDebug("Mo");
    }

    function onPointerUp(event: PointerEvent) {
        event.stopPropagation();
        event.preventDefault();
        pointersDown.delete(event.pointerId);
        if (gestureState === null) return;

        // Just in case there's movement data in the event that hasn't been
        // reported yet, handle that movement first.
        onPointerMove(event);

        // Which pointer is this?
        const id = whichPointer(event.pointerId);
        if (id == "new") {
            // Released pointer that we're not tracking, ignore.
            updateDebug("U?");
            return;
        } else if (id == "p2" || gestureState.p2 !== null) {
            if (!gestureState.continued && !gestureState.moved) {
                // Two-finger tap.
                finishGesture("2click");
            } else {
                // Inconclusive; just get rid of the second pointer's state
                // record.
                if (id == "p1") gestureState.p1 = gestureState.p2!;
                gestureState.p2 = null;
            }
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
            finishGesture(undefined)
        }
        updateDebug("Up");
    }

    function onPointerCancel(event: PointerEvent) {
        event.stopPropagation();
        event.preventDefault();
        pointersDown.delete(event.pointerId);

        // At least one pointer was canceled by the browser. Stop the tracking
        // of gestures immediately.
        finishGesture();
        updateDebug("Ca");
    }

    function onClick(event: MouseEvent | KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();

        // I think all clicks should be emulated at this point, since we're
        // capturing pointer up and down. But just in case...
        const isEmulated = event instanceof KeyboardEvent || pointersDown.size == 0;
        if (isEmulated) {
            finishGesture("click");
            updateDebug("Em");
            return;
        }

        // Fallback behavior to kill an ongoing gesture.
        const data = gestureState;
        if (data === null) return;
        finishGesture(data.moved ? undefined : "click");
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
