import { BleErrorCode } from "react-native-ble-plx"
import { BLE_ERROR_MESSAGES } from "../constants"

/**
 * Discovers all services and characteristics for a connected device
 * DeviceAlreadyConnected error is treated as success (device services already known)
 * @param {object} options
 * @param {object} options.device
 * @param {Function} options.onSuccess - (device) => void
 * @param {Function} options.onError - (message) => void
 */
export const discoverServices = async options => {
    const { device, onSuccess, onError } = options

    if (!device) {
        onError?.(BLE_ERROR_MESSAGES.DEVICE_NOT_CONNECTED)
        return
    }

    try {
        const result = await device.discoverAllServicesAndCharacteristics()
        onSuccess?.(result)
    } catch (error) {
        if (error?.errorCode === BleErrorCode.DeviceAlreadyConnected) {
            // services already discovered, safe to proceed
            onSuccess?.(device)
            return
        }
        onError?.(error?.message || BLE_ERROR_MESSAGES.DISCOVER_FAILED)
    }
}
