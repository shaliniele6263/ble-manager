import { getBleManager } from "./bleInstance"

/**
 * Waits for BLE to be powered on then calls onReady once
 * @param {Function} onReady
 * @param {Function} onError
 * @returns {Function} cleanup
 */
export const waitForPoweredOn = (onReady, onError) => {
    const manager = getBleManager()

    const subscription = manager.onStateChange(state => {
        if (state === "PoweredOn") {
            onReady()
            subscription.remove()
        }
        if (state === "PoweredOff") {
            onError?.("Bluetooth is powered off")
        }
        if (state === "Unauthorized") {
            onError?.("Bluetooth is unauthorized")
        }
    }, true)

    return () => subscription.remove()
}
