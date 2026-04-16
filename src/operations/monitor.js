import { getBleManager } from "../core/bleInstance"
import { BLE_ERROR_MESSAGES } from "../constants"

/**
 * Monitors a characteristic for incoming data (multiple responses supported)
 * @param {object} options
 * @param {object} options.device
 * @param {string} options.serviceUUID
 * @param {string} options.characteristicUUID
 * @param {Function} options.onResponse - (value: string) => void  base64 value
 * @param {Function} options.onError - (message) => void
 * @returns {{ remove: Function }} subscription
 */
export const monitorCharacteristic = options => {
    const { device, serviceUUID, characteristicUUID, onResponse, onError } = options

    if (!device || typeof device?.monitorCharacteristicForService !== "function") {
        onError?.(BLE_ERROR_MESSAGES.DEVICE_NOT_CONNECTED)
        return null
    }

    const manager = getBleManager()

    const subscription = manager.monitorCharacteristicForDevice(
        device.id,
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
            if (error) {
                onError?.(error?.message || BLE_ERROR_MESSAGES.MONITOR_FAILED)
                return
            }
            if (characteristic?.value) {
                onResponse?.(characteristic.value)
            }
        }
    )

    return subscription
}
