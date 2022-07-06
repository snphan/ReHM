//
//  ContentView.swift
//  PUB_applewatch WatchKit Extension
//
//  Created by Steven Phan on 2022-07-05.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var workoutManager: WorkoutManager
    
    var body: some View {
        VStack {
            Text("Heart Rate: \(self.workoutManager.heartRate.formatted(.number.precision(.fractionLength(0)))) BPM").padding()
            Text("a: 0.1, 0.1, 0.1")
        }.onAppear {
            workoutManager.requestAuthorization()
            workoutManager.startWorkout()
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
