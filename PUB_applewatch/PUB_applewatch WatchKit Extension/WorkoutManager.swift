//
//  WorkoutManager.swift
//  PUB_applewatch WatchKit Extension
//
//  Created by Steven Phan on 2022-07-05.
//

import Foundation
import HealthKit

class WorkoutManager: NSObject, ObservableObject {
    let healthStore = HKHealthStore()
    var session: HKWorkoutSession?
    var builder: HKLiveWorkoutBuilder?
    
    @Published var heartRate: Double = 0
}
