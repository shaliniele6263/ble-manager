export { useBle } from "./hooks/useBle"

export { startScan, stopScan, shouldIncludeDevice } from "./operations/scan"
export {
    connectToDevice,
    disconnectFromDevice,
    getAlreadyConnectedDevice
} from "./operations/connect"
export { discoverServices } from "./operations/discover"
export { activateDevice } from "./operations/activate"
export { monitorCharacteristic } from "./operations/monitor"
export { setupDisconnectHandler } from "./operations/disconnect"

export { waitForPoweredOn } from "./core/bleStateHandler"
export { requestBlePermissions } from "./core/blePermissions"
export { getBleManager, resetBleManager, destroyBleManager } from "./core/bleInstance"

export {
    BLE_STATUS,
    BLE_ERROR_MESSAGES,
    BLE_ERROR_CODES,
    SCAN_TIMEOUT,
    CONNECTION_TIMEOUT
} from "./constants"
