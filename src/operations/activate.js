import { BLE_ERROR_MESSAGES } from "../constants"

/**
 * Writes a value to a characteristic (activates the device)
 * @param {object} options
 * @param {object} options.device
 * @param {string} options.serviceUUID
 * @param {string} options.characteristicUUID
 * @param {string} options.payload - base64 encoded string
 * @param {Function} options.onSuccess
 * @param {Function} options.onError
 */
export const activateDevice = async options => {
    const { device, serviceUUID, characteristicUUID, payload, onSuccess, onError } = options

    if (!device) {
        onError?.(BLE_ERROR_MESSAGES.DEVICE_NOT_CONNECTED)
        return
    }

    if (!payload) {
        onError?.("Activation payload is required")
        return
    }

    try {
        await device.writeCharacteristicWithResponseForService(
            serviceUUID,
            characteristicUUID,
            payload
        )
        onSuccess?.()
    } catch (error) {
        onError?.(error?.message || BLE_ERROR_MESSAGES.WRITE_FAILED)
    }
}
