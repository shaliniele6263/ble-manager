import { getBleManager } from "../core/bleInstance"

/**
 * Sets up a listener for device disconnection
 * @param {object} options
 * @param {string} options.deviceId
 * @param {Function} options.onDisconnected - () => void
 * @param {Function} options.onError - (message) => void
 * @returns {{ remove: Function }} subscription
 */
export const setupDisconnectHandler = options => {
    const { deviceId, onDisconnected, onError } = options
    const manager = getBleManager()

    const subscription = manager.onDeviceDisconnected(deviceId, error => {
        if (error) {
            onError?.(error?.message)
            return
        }
        onDisconnected?.()
    })

    return subscription
}
