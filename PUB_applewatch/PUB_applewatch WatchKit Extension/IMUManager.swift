//
//  IMUManager.swift
//  PUB_applewatch WatchKit Extension
//
//  Created by Steven Phan on 2022-07-06.
//

import Foundation
import CoreMotion

class IMUManager: NSObject, ObservableObject {
    let motion = CMMotionManager()
    var timer: Timer?
    var frequency = 10.0
    @Published var accel: Array<Double> = [0.0, 0.0, 0.0]
    
    func startAccelerometers() {
        // Check if Hardware is available
        if self.motion.isAccelerometerAvailable {
            print("Accelerometer is available!")
            self.motion.accelerometerUpdateInterval = 1.0 / self.frequency
            self.motion.startAccelerometerUpdates()
            
            // Callback on record data event.
            let handler: CMAccelerometerHandler = {data, error in
                let x = data!.acceleration.x * 9.81
                let y = data!.acceleration.y * 9.81
                let z = data!.acceleration.z * 9.81
                
                self.accel = [x, y, z]
            }
            motion.startAccelerometerUpdates(to: OperationQueue.current!, withHandler: handler)
        } else {
            print("Accelerometer is unavailable.")
        }
    }
}
