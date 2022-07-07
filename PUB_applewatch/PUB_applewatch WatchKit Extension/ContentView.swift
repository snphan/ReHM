//
//  ContentView.swift
//  PUB_applewatch WatchKit Extension
//
//  Created by Steven Phan on 2022-07-05.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var workoutManager: WorkoutManager
    @EnvironmentObject var imuManager: IMUManager
    
    var body: some View {
        ScrollView{
            VStack {
                Text("Heart Rate: \(self.workoutManager.heartRate.formatted(.number.precision(.fractionLength(0)))) BPM").padding()
                Text("a: \(self.imuManager.accel.map{ String($0.formatted(.number.precision(.fractionLength(2)))) }.joined(separator: ", "))")
            }.onAppear {
                workoutManager.requestAuthorization()
                workoutManager.startWorkout()
                imuManager.startAccelerometers()
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
