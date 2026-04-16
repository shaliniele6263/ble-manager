export const SCAN_TIMEOUT = 30000
export const CONNECTION_TIMEOUT = 10000

export const BLE_STATUS = {
    IDLE: "idle",
    SCANNING: "scanning",
    CONNECTING: "connecting",
    DISCOVERING: "discovering",
    ACTIVATING: "activating",
    MONITORING: "monitoring",
    DISCONNECTED: "disconnected",
    DEVICE_ALREADY_CONNECTED: "device_already_connected",
    ERROR: "error"
}

export const BLE_ERROR_CODES = {
    DEVICE_ALREADY_CONNECTED: 203
}

export const BLE_ERROR_MESSAGES = {
    SCAN_FAILED: "Scan failed",
    CONNECT_FAILED: "Connection failed",
    DISCOVER_FAILED: "Service discovery failed",
    WRITE_FAILED: "Write failed",
    MONITOR_FAILED: "Monitor failed",
    PERMISSION_DENIED: "Bluetooth permission denied",
    POWERED_OFF: "Bluetooth is powered off",
    LOCATION_DISABLED: "Location services are disabled",
    DEVICE_NOT_CONNECTED: "Device is not connected",
    OPERATION_CANCELLED: "Operation was cancelled",
    OPERATION_TIMED_OUT: "Operation timed out"
}
