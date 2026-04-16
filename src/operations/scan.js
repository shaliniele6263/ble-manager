import { Platform } from "react-native"
import { ScanMode } from "react-native-ble-plx"
import { getBleManager } from "../core/bleInstance"
import { SCAN_TIMEOUT, BLE_ERROR_MESSAGES } from "../constants"

/**
 * Removes duplicate devices by id
 * @param {Array} existingDevices
 * @param {object} newDevice
 * @returns {Array}
 */
export const deduplicateDevice = (existingDevices, newDevice) => {
    const exists = existingDevices.find(d => d.id === newDevice.id)
    if (exists) return existingDevices
    return [...existingDevices, newDevice]
}

/**
 * Merges devices found in a rescan:
 * - Removes devices not found in new scan
 * - Adds new devices found in rescan
 * @param {Array} prevDevices
 * @param {Array} newDevices
 * @returns {Array}
 */
export const mergeScanAgainDevices = (prevDevices, newDevices) => {
    const stillVisible = prevDevices.filter(prev => newDevices.some(nd => nd.id === prev.id))
    newDevices.forEach(nd => {
        if (!stillVisible.some(d => d.id === nd.id)) {
            stillVisible.push(nd)
        }
    })
    return stillVisible
}

/**
 * Filters a device based on config
 * - if deviceFilter function provided → use it
 * - if devicePrefix string provided → match prefix
 * - if neither → allow all devices with a name
 * @param {object} device
 * @param {object} config
 * @returns {boolean}
 */
export const shouldIncludeDevice = (device, config) => {
    if (!device?.name) return false

    if (typeof config?.deviceFilter === "function") {
        return config.deviceFilter(device)
    }

    if (typeof config?.devicePrefix === "string") {
        return device.name.startsWith(config.devicePrefix)
    }

    return true
}

/**
 * Starts BLE device scan
 * @param {object} options
 * @param {string} [options.devicePrefix]
 * @param {Function} [options.deviceFilter]
 * @param {boolean} [options.isScanAgain]
 * @param {number} [options.timeout]
 * @param {Function} options.onDeviceFound - (device) => void
 * @param {Function} options.onDevicesUpdated - (updaterFn) => void  for state updates
 * @param {Function} options.onScanStopped - called when scan timeout ends
 * @param {Function} options.onError - (message) => void
 * @returns {Function} stopScan
 */
export const startScan = options => {
    const {
        devicePrefix,
        deviceFilter,
        isScanAgain = false,
        timeout = SCAN_TIMEOUT,
        onDeviceFound,
        onDevicesUpdated,
        onScanStopped,
        onError
    } = options

    const manager = getBleManager()
    const newDevicesBuffer = []

    const scanOptions = {
        scanMode: Platform.OS === "android" ? ScanMode.LowLatency : undefined
    }

    const timer = setTimeout(() => {
        manager.stopDeviceScan()
        onScanStopped?.()
    }, timeout)

    manager.startDeviceScan(null, scanOptions, (error, device) => {
        if (error) {
            clearTimeout(timer)
            onError?.(error?.message || BLE_ERROR_MESSAGES.SCAN_FAILED)
            return
        }

        if (!shouldIncludeDevice(device, { devicePrefix, deviceFilter })) {
            return
        }

        if (!isScanAgain) {
            onDevicesUpdated?.(prev => deduplicateDevice(prev, device))
            onDeviceFound?.(device)
            return
        }

        // scan again mode - buffer new devices
        if (!newDevicesBuffer.find(d => d.id === device.id)) {
            newDevicesBuffer.push(device)
        }
        onDevicesUpdated?.(prev => mergeScanAgainDevices(prev, newDevicesBuffer))
    })

    const stopScan = () => {
        clearTimeout(timer)
        manager.stopDeviceScan()
        onScanStopped?.()
    }

    return stopScan
}

export const stopScan = () => {
    const manager = getBleManager()
    manager.stopDeviceScan()
}
