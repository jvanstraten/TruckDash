export function useAnimation(callback: (elapsed: number) => void) {
    let previousTimestamp: number = 0;
    let animator: number | undefined = undefined;

    function animate(timestamp: number) {
        const elapsed = (previousTimestamp === undefined) ? 0.0 : timestamp - previousTimestamp;
        previousTimestamp = timestamp;

        callback(elapsed);

        // If another animator callback loop is running at the same time, cancel it.
        if (animator !== undefined) {
            window.cancelAnimationFrame(animator);
        }

        // Request next frame.
        animator = window.requestAnimationFrame(animate);
    }

    if (window !== undefined) {
        onMounted(() => {
            // Start animation loop.
            animate(0);
        });
        onUnmounted(() => {
            // Stop animation loop.
            if (animator !== undefined) {
                window.cancelAnimationFrame(animator);
                animator = undefined;
            }
        });
    }
}
