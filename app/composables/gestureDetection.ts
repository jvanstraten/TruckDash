
export type GestureType = "click" | "hold" | "left" | "right" | "up" | "down";

export type GestureData = {
    type: GestureType;
    startX: number | undefined;
    startY: number | undefined;
}

export type GestureConfig = {
    receiveSwipes?: boolean;
    receiveHolds?: boolean;
    minimumDistanceRatio?: number;
    coneStrictness?: number;
    holdTimeout?: number;
}

type DragData = {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    moved: boolean;
    holdTimer: number | undefined;
};

type SwipeType = false | undefined | "left" | "right" | "up" | "down";

const defaultMinimumDistanceRatio = 0.1;
const defaultConeStrictness = 1.2;
const defaultHoldTimeout = 500;

export function useGestureDetection(
    callback: (gesture: GestureData) => void,
    config?: GestureConfig,
) {

    const receiveSwipes: boolean = config?.receiveSwipes ?? true;
    const receiveHolds: boolean = config?.receiveHolds ?? true;
    const minimumDistanceRatio: number = config?.minimumDistanceRatio ?? defaultMinimumDistanceRatio;
    const coneStrictness: number = config?.coneStrictness ?? defaultConeStrictness;
    const holdTimeout: number = config?.holdTimeout ?? defaultHoldTimeout;

    const dragData = ref<DragData | null>(null);
    const pointerIsDown = ref<boolean>(false);

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
        if (type !== undefined) {
            callback({
                type,
                startX: (dragData.value?.startX ?? 0) / window.innerWidth,
                startY: (dragData.value?.startY ?? 0) / window.innerHeight
            });
        }
        if (dragData.value && dragData.value.holdTimer !== undefined) {
            window.clearTimeout(dragData.value.holdTimer);
        }
        dragData.value = null;
    }

    function onPointerDown(event: PointerEvent) {
        event.stopPropagation();
        event.preventDefault();
        const target = event.target as HTMLElement;
        target.setPointerCapture(event.pointerId);

        let holdTimer: number | undefined = undefined;
        if (receiveHolds) {
            holdTimer = window.setTimeout(() => onHoldTimer(), holdTimeout);
        }

        pointerIsDown.value = true;
        dragData.value = {
            startX: event.clientX,
            startY: event.clientY,
            currentX: event.clientX,
            currentY: event.clientY,
            moved: false,
            holdTimer,
        }
    }

    function onPointerMove(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();

        const data = dragData.value;
        if (data === null) return;

        if (Math.abs(event.clientX - data.startX) > 1 || Math.abs(event.clientY - data.startY) > 1) {
            data.moved = true;
        }

        data.currentX = event.clientX;
        data.currentY = event.clientY;

        if (receiveSwipes) {
            const swipe = isSwipe(data);
            if (typeof swipe == "string") finishDrag(swipe);
        }
    }

    function onHoldTimer() {
        const data = dragData.value;
        if (data === null) return;
        data.holdTimer = undefined;

        const swipe = isSwipe(data);
        if (swipe === false && !data.moved) {
            finishDrag("hold");
        }
    }

    function onClick(event: MouseEvent | KeyboardEvent) {
        if (event instanceof KeyboardEvent || !pointerIsDown.value) {
            pointerIsDown.value = false;
            finishDrag("click");
            return;
        }
        pointerIsDown.value = false;

        event.stopPropagation();
        event.preventDefault();

        onPointerMove(event);
        const data = dragData.value;
        if (data === null) return;
        finishDrag(data.moved ? undefined : "click");
    }

    return {
        onPointerDown,
        onPointerMove,
        onClick,
    };
}
