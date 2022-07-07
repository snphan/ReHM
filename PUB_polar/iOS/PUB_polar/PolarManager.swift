//
//  PolarManager.swift
//  PUB_polar
//
//  Created by Steven Phan on 2022-07-07.
//

import Foundation
import PolarBleSdk
import RxSwift
import CoreBluetooth


class PolarManager: NSObject, ObservableObject, PolarBleApiObserver, PolarBleApiPowerStateObserver, PolarBleApiDeviceFeaturesObserver, PolarBleApiDeviceHrObserver {
    
    var api = PolarBleApiDefaultImpl.polarImplementation(DispatchQueue.main, features: Features.hr.rawValue)
    var deviceId = "0A3BA92B"
    @Published var heartRate: UInt8 = 0
    var HRDataHandler = DataHandler(frequency: 1, dataType: "HR", serial: "AFCB3621")
    
    override init() {
        super.init()
        api.observer = self
        api.deviceHrObserver = self
        api.powerStateObserver = self
        api.deviceFeaturesObserver = self
    }
    
    func deviceConnecting(_ identifier: PolarDeviceInfo) {
        print("DEVICE CONNECTED: \(identifier)")
        deviceId = identifier.deviceId
    }
    func deviceConnected(_ identifier: PolarDeviceInfo) {
        print("DEVICE CONNECTED: \(identifier)")
        deviceId = identifier.deviceId
    }
    
    func deviceDisconnected(_ identifier: PolarDeviceInfo) {
       print("DISCONNECTED: \(identifier)")
    }
    
    func blePowerOn() {
        print("BLE ON")
    }
    
    func blePowerOff() {
        print("BLE OFF")
    }
    
    func hrFeatureReady(_ identifier: String) {
        print("HR READY")
    }
    
    func ftpFeatureReady(_ identifier: String) {
    }
    
    func streamingFeaturesReady(_ identifier: String, streamingFeatures: Set<DeviceStreamingFeature>) {
        for feature in streamingFeatures {
            print("Feature \(feature) is ready.")
        }
    }
    
    func hrValueReceived(_ identifier: String, data: PolarHrData) {
        print("HR notification: \(data.hr) rrs: \(data.rrs)")
        self.heartRate = data.hr
        self.HRDataHandler.addData(val: [Double(self.heartRate)])
    }
}
