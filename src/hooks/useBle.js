import { useState, useEffect, useRef, useCallback } from "react"
import { requestBlePermissions } from "../core/blePermissions"
import { waitForPoweredOn } from "../core/bleStateHandler"
import { startScan, stopScan } from "../operations/scan"
import { connectToDevice, disconnectFromDevice } from "../operations/connect"
import { discoverServices } from "../operations/discover"
import { activateDevice } from "../operations/activate"
import { monitorCharacteristic } from "../operations/monitor"
import { setupDisconnectHandler } from "../operations/disconnect"
import { BLE_STATUS } from "../constants"

/**
 * @param {object} config
 * @param {string} [config.devicePrefix]
 * @param {Function} [config.deviceFilter]
 * @param {string} config.serviceUUID
 * @param {string} config.characteristicUUID
 * @param {string} [config.activationPayload]
 * @param {number} [config.scanTimeout]
 * @param {number} [config.connectionTimeout]
 * @param {Function} [config.onResponse]
 * @param {Function} [config.onError]
 * @param {Function} [config.onStatusChange]
 */
export const useBle = config => {
    const {
        devicePrefix,
        deviceFilter,
        serviceUUID,
        characteristicUUID,
        activationPayload,
        scanTimeout,
        connectionTimeout,
        onResponse,
        onError,
        onStatusChange
    } = config

    const [status, setStatus] = useState(BLE_STATUS.IDLE)
    const [devices, setDevices] = useState([])
    const [connectedDevice, setConnectedDevice] = useState(null)
    const [error, setError] = useState(null)

    const monitorSubscription = useRef(null)
    const disconnectSubscription = useRef(null)
    const stopScanRef = useRef(null)

    const updateStatus = useCallback(
        newStatus => {
            setStatus(newStatus)
            onStatusChange?.(newStatus)
        },
        [onStatusChange]
    )

    const handleError = useCallback(
        message => {
            setError(message)
            updateStatus(BLE_STATUS.ERROR)
            onError?.(message)
        },
        [onError, updateStatus]
    )

    const cleanupSubscriptions = useCallback(() => {
        monitorSubscription.current?.remove()
        disconnectSubscription.current?.remove()
        monitorSubscription.current = null
        disconnectSubscription.current = null
    }, [])

    const scan = useCallback(
        async (isScanAgain = false) => {
            const { granted, error: permError } = await requestBlePermissions()
            if (!granted) {
                handleError(permError)
                return
            }

            updateStatus(BLE_STATUS.SCANNING)

            stopScanRef.current = startScan({
                devicePrefix,
                deviceFilter,
                isScanAgain,
                timeout: scanTimeout,
                onDevicesUpdated: setDevices,
                onScanStopped: () => updateStatus(BLE_STATUS.IDLE),
                onError: handleError
            })
        },
        [devicePrefix, deviceFilter, scanTimeout, handleError, updateStatus]
    )

    const connect = useCallback(
        async device => {
            updateStatus(BLE_STATUS.CONNECTING)

            await connectToDevice({
                deviceId: device.id,
                timeout: connectionTimeout,
                onSuccess: async connectedDev => {
                    setConnectedDevice(connectedDev)
                    updateStatus(BLE_STATUS.DISCOVERING)

                    await discoverServices({
                        device: connectedDev,
                        onSuccess: () => updateStatus(BLE_STATUS.DEVICE_ALREADY_CONNECTED),
                        onError: handleError
                    })
                },
                onAlreadyConnected: async connectedDev => {
                    setConnectedDevice(connectedDev)
                    updateStatus(BLE_STATUS.DEVICE_ALREADY_CONNECTED)
                },
                onRetry: () => scan(),
                onError: handleError
            })
        },
        [connectionTimeout, handleError, updateStatus, scan]
    )

    const activate = useCallback(
        async (device, payload) => {
            const activePayload = payload || activationPayload
            stopScan()
            updateStatus(BLE_STATUS.ACTIVATING)

            await activateDevice({
                device: device || connectedDevice,
                serviceUUID,
                characteristicUUID,
                payload: activePayload,
                onSuccess: () => {
                    updateStatus(BLE_STATUS.MONITORING)
                    monitorSubscription.current = monitorCharacteristic({
                        device: device || connectedDevice,
                        serviceUUID,
                        characteristicUUID,
                        onResponse: value => onResponse?.(value),
                        onError: handleError
                    })
                },
                onError: handleError
            })
        },
        [
            activationPayload,
            connectedDevice,
            serviceUUID,
            characteristicUUID,
            onResponse,
            handleError,
            updateStatus
        ]
    )

    const disconnect = useCallback(async () => {
        cleanupSubscriptions()
        await disconnectFromDevice({
            device: connectedDevice,
            onSuccess: () => {
                setConnectedDevice(null)
                updateStatus(BLE_STATUS.DISCONNECTED)
            },
            onRetry: () => scan(),
            onError: handleError
        })
    }, [connectedDevice, cleanupSubscriptions, handleError, updateStatus, scan])

    const stopMonitor = useCallback(() => {
        monitorSubscription.current?.remove()
        monitorSubscription.current = null
    }, [])

    // setup disconnect listener when device connects
    useEffect(() => {
        if (!connectedDevice) return

        disconnectSubscription.current = setupDisconnectHandler({
            deviceId: connectedDevice.id,
            onDisconnected: () => {
                setConnectedDevice(null)
                cleanupSubscriptions()
                updateStatus(BLE_STATUS.DISCONNECTED)
            },
            onError: handleError
        })

        return () => disconnectSubscription.current?.remove()
    }, [connectedDevice, cleanupSubscriptions, handleError, updateStatus])

    // wait for BLE to be powered on then auto scan
    useEffect(() => {
        const cleanup = waitForPoweredOn(
            () => scan(),
            err => handleError(err)
        )
        return () => {
            cleanup()
            stopScanRef.current?.()
            cleanupSubscriptions()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return {
        // state
        status,
        devices,
        connectedDevice,
        error,
        // actions
        scan,
        connect,
        activate,
        disconnect,
        stopMonitor
    }
}
