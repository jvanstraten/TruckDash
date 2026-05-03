
export type GestureType = "click" | "hold" | "left" | "right" | "up" | "down";

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

type DragData = {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    moved: boolean;
    holdTimer: number | null;
};

type SwipeType = false | undefined | "left" | "right" | "up" | "down";

const defaultMinimumDistanceRatio = 0.2;
const defaultConeStrictness = 1.2;
const defaultHoldTimeout = 500;

export function useGestureDetection(
    callback: (gesture: GestureData) => void,
    config?: GestureConfig,
    debug?: Ref<string>,
) {

    const receiveSwipes: boolean = config?.receiveSwipes ?? true;
    const receiveHolds: boolean = config?.receiveHolds ?? true;
    const minimumDistanceRatio: number = config?.minimumDistanceRatio ?? defaultMinimumDistanceRatio;
    const maximumTapDistanceRatio: number = config?.maximumTapDistanceRatio ?? minimumDistanceRatio / 2;
    const coneStrictness: number = config?.coneStrictness ?? defaultConeStrictness;
    const holdTimeout: number = config?.holdTimeout ?? defaultHoldTimeout;

    let dragData: DragData | null = null;
    let pointerIsDown: boolean = false;

    let debugResult: string = "...";

    function updateDebug(cause: string) {
        if (debug === undefined) return;

        let state = pointerIsDown ? "d1" : "d0";
        if (dragData !== null) {
            if (dragData.holdTimer !== undefined) state += "T";
            if (dragData.moved) state += "M";
        }

        debug.value = `${cause}: ${state}${debugResult}`;
        debugResult = "...";
    }

    function isSwipe(data: DragData): SwipeType {
        const dx = data.currentX - data.startX;
        const dy = data.currentY - data.startY;
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

    function finishDrag(type?: GestureType) {
        debugResult = type === undefined ? "none" : type;
        if (type !== undefined) {
            callback({
                type,
                middleX: ((dragData?.startX ?? 0) + (dragData?.currentX ?? 0)) / (window.innerWidth * 2),
                middleY: ((dragData?.startY ?? 0) + (dragData?.currentY ?? 0)) / (window.innerHeight * 2)
            });
        }
        if (dragData && dragData.holdTimer !== null) {
            window.clearTimeout(dragData.holdTimer);
            dragData.holdTimer = null;
        }
        dragData = null;
    }

    function onHoldTimer() {
        const data = dragData;
        if (data === null) return;
        data.holdTimer = null;

        const swipe = isSwipe(data);
        if (swipe === false && !data.moved) {
            finishDrag("hold");
        }
        updateDebug("Ti");
    }

    function onPointerDown(event: PointerEvent) {
        // Ignore anything except left mouse button.
        if (event.button != 0) return;

        event.stopPropagation();
        event.preventDefault();
        const target = event.target as HTMLElement;
        target.setPointerCapture(event.pointerId);

        let holdTimer: number | null = null;
        if (receiveHolds) {
            holdTimer = window.setTimeout(() => onHoldTimer(), holdTimeout);
        }

        pointerIsDown = true;
        dragData = {
            startX: event.clientX,
            startY: event.clientY,
            currentX: event.clientX,
            currentY: event.clientY,
            moved: false,
            holdTimer,
        }
        updateDebug("Do");
    }

    function onPointerMove(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();

        const data = dragData;
        if (data === null) return;

        if (!data.moved) {
            const dx = data.currentX - data.startX;
            const dy = data.currentY - data.startY;
            const distanceSqr = dx * dx + dy * dy;
            const threshold = Math.min(window.innerWidth, window.innerHeight) * maximumTapDistanceRatio;
            if (distanceSqr > threshold * threshold) {
                data.moved = true;
            }
        }

        data.currentX = event.clientX;
        data.currentY = event.clientY;

        if (receiveSwipes) {
            const swipe = isSwipe(data);
            if (typeof swipe == "string") finishDrag(swipe);
        }
        updateDebug("Mo");
    }

    function onPointerUp(event: PointerEvent) {
        event.stopPropagation();
        event.preventDefault();
        onPointerMove(event);
        const data = dragData;
        if (data === null) return;
        finishDrag(data.moved ? undefined : "click");
        updateDebug("Up");
    }

    function onPointerCancel(event: PointerEvent) {
        event.stopPropagation();
        event.preventDefault();
        finishDrag();
        pointerIsDown = false;
        updateDebug("Ca");
    }

    function onClick(event: MouseEvent | KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();

        const isEmulated = event instanceof KeyboardEvent || !pointerIsDown;
        pointerIsDown = false;
        if (isEmulated) {
            finishDrag("click");
            updateDebug("Em");
            return;
        }

        // With onPointerUp now preventing default behavior, this is probably
        // dead code, but I'm too scared to remove it.
        onPointerMove(event);
        const data = dragData;
        if (data === null) return;
        finishDrag(data.moved ? undefined : "click");
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
