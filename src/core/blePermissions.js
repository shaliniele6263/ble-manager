import { Platform, PermissionsAndroid } from "react-native"
import { BLE_ERROR_MESSAGES } from "../constants"

const requestAndroidPermissions = async () => {
    if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ])
        return (
            result["android.permission.BLUETOOTH_SCAN"] === "granted" &&
            result["android.permission.BLUETOOTH_CONNECT"] === "granted" &&
            result["android.permission.ACCESS_FINE_LOCATION"] === "granted"
        )
    }

    const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    )
    return result === "granted"
}

/**
 * Requests BLE permissions for Android and iOS
 * @returns {Promise<{ granted: boolean, error: string | null }>}
 */
export const requestBlePermissions = async () => {
    try {
        if (Platform.OS === "ios") {
            return { granted: true, error: null }
        }
        const granted = await requestAndroidPermissions()
        return {
            granted,
            error: granted ? null : BLE_ERROR_MESSAGES.PERMISSION_DENIED
        }
    } catch (error) {
        return { granted: false, error: error?.message }
    }
}
