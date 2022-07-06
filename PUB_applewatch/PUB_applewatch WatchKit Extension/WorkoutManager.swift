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
    @Published var running = false
    
    func requestAuthorization() {
        let typesToShare: Set = [
            HKQuantityType.workoutType()
        ]
        
        let typesToRead: Set = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        ]
        
        healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead) { success, error in}
    }
    
    func startWorkout() {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .running
        configuration.locationType = .outdoor
        
        // Create the session
        do {
            session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            builder = session?.associatedWorkoutBuilder()
        } catch {
            return
        }
        
        // Assign delegates to monitor the workout session and builder
        session?.delegate = self
        builder?.delegate = self
        
        // Assign the live datasource object to workout builder
        builder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)
        
        // Start the workout session and begin data collection
        let startDate = Date()
        session?.startActivity(with: startDate)
        builder?.beginCollection(withStart: startDate) {success, error in }
    }
   
    // MARK: - Session State Control
    func togglePause() {
        if running == true {
            pause()
        } else {
            resume()
        }
    }
    
    func pause() {
        session?.pause()
    }
    
    func resume() {
        session?.resume()
    }
    
    func endWorkout() {
        session?.end()
    }
    
    // MARK: - Update the data
    func updateData(_ statistics: HKStatistics?) {
        guard let statistics = statistics else { return }
        
        DispatchQueue.main.async {
            switch statistics.quantityType {
            case HKQuantityType.quantityType(forIdentifier: .heartRate):
                // Retrieve the heartrate from the statistics and send it to our cloud broker.
                let heartRateUnit = HKUnit.count().unitDivided(by: HKUnit.minute())
                self.heartRate = statistics.mostRecentQuantity()?.doubleValue(for: heartRateUnit) ?? 0
                print(self.heartRate, "@ \(Int(NSDate().timeIntervalSince1970*1000))")
            default:
                print("nothing.")
            }
        }
    }
}


// MARK: - Session Delegate
extension WorkoutManager: HKWorkoutSessionDelegate {
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        DispatchQueue.main.sync {
            self.running = toState == .running
        }
        
        // Wait for the session to transition states before ending the builder.
        if toState == .ended {
            builder?.endCollection(withEnd: date) { (success, error) in self.builder?.finishWorkout {(workout, error) in }}
        }
    }
    
    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
    }
}

// MARK: - Builder Delegate
extension WorkoutManager: HKLiveWorkoutBuilderDelegate {
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType else {
                return
            }
            let statistics = workoutBuilder.statistics(for: quantityType)
            updateData(statistics)
        }
    }
    
    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {
    }
}
