import { BleManager } from "react-native-ble-plx"

let instance = null

export const getBleManager = () => {
    if (!instance) {
        instance = new BleManager()
    }
    return instance
}

export const resetBleManager = async () => {
    if (instance) {
        await instance.stopDeviceScan()
        instance.destroy()
        instance = null
    }
    return getBleManager()
}

export const destroyBleManager = () => {
    if (instance) {
        instance.destroy()
        instance = null
    }
}
