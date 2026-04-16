import { getBleManager, resetBleManager } from "../core/bleInstance"
import { CONNECTION_TIMEOUT, BLE_ERROR_CODES, BLE_ERROR_MESSAGES } from "../constants"

/**
 * Checks if error is a retryable connection error
 * @param {Error} error
 * @returns {boolean}
 */
const isRetryableError = error => {
    return (
        error?.message?.includes("Operation was cancelled") ||
        error?.message?.includes("Operation timed out")
    )
}

/**
 * Connects to a BLE device
 * @param {object} options
 * @param {string} options.deviceId
 * @param {number} [options.timeout]
 * @param {Function} options.onSuccess - (device) => void
 * @param {Function} options.onAlreadyConnected - (device) => void
 * @param {Function} options.onRetry - called when manager resets and retries
 * @param {Function} options.onError - (message) => void
 */
export const connectToDevice = async options => {
    const {
        deviceId,
        timeout = CONNECTION_TIMEOUT,
        onSuccess,
        onAlreadyConnected,
        onRetry,
        onError
    } = options

    const manager = getBleManager()

    try {
        const device = await manager.connectToDevice(deviceId, {
            refreshGatt: "OnConnected",
            timeout
        })
        onSuccess?.(device)
    } catch (error) {
        if (error?.errorCode === BLE_ERROR_CODES.DEVICE_ALREADY_CONNECTED) {
            // device is already connected to OS, treat as success
            try {
                const device = await manager.devices([deviceId])
                onAlreadyConnected?.(device?.[0] || null)
            } catch {
                onAlreadyConnected?.(null)
            }
            return
        }

        if (isRetryableError(error)) {
            await resetBleManager()
            onRetry?.()
            return
        }

        onError?.(error?.message || BLE_ERROR_MESSAGES.CONNECT_FAILED)
    }
}

/**
 * Disconnects from a BLE device
 * @param {object} options
 * @param {object} options.device - connected device object
 * @param {Function} options.onSuccess
 * @param {Function} options.onRetry
 * @param {Function} options.onError
 */
export const disconnectFromDevice = async options => {
    const { device, onSuccess, onRetry, onError } = options

    if (!device) {
        onError?.(BLE_ERROR_MESSAGES.DEVICE_NOT_CONNECTED)
        return
    }

    try {
        await device.cancelConnection()
        onSuccess?.()
    } catch (error) {
        if (isRetryableError(error)) {
            await resetBleManager()
            onRetry?.()
            return
        }
        onError?.(error?.message || BLE_ERROR_MESSAGES.CONNECT_FAILED)
    }
}

/**
 * Gets devices already connected to the OS
 * @param {string[]} serviceUUIDs
 * @param {string} deviceId
 * @returns {Promise<object|null>}
 */
export const getAlreadyConnectedDevice = async (serviceUUIDs, deviceId) => {
    const manager = getBleManager()
    const devices = await manager.getConnectedDevices(serviceUUIDs)
    return devices.find(d => d.id === deviceId) || null
}
