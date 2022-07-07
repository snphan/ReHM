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
    @AppStorage("serial") private var serial = ""
    @State private var newSerial: String = ""
    
    var body: some View {
        ScrollView{
            VStack {
                Text("Heart Rate: \(self.workoutManager.heartRate.formatted(.number.precision(.fractionLength(0)))) BPM").padding()
                Text("a: \(self.imuManager.accel.map{ String($0.formatted(.number.precision(.fractionLength(2)))) }.joined(separator: ", "))")
                Text("Current Serial: \(serial)")
                TextField (
                    "New Serial",
                    text: $newSerial
                )
                Button("Set Serial") {
                    serial = newSerial
                    newSerial = ""
                    startSensors(withSerial: serial)
                    
                }
            }.onAppear {
                workoutManager.requestAuthorization()
                if (serial.count > 0) {
                    startSensors(withSerial: serial)
                }
            }
        }
    }
    
    func startSensors(withSerial: String) {
        workoutManager.setSerial(serial: serial)
        imuManager.setSerial(serial: serial)
        
        if (!workoutManager.running) {
            workoutManager.startWorkout()
            imuManager.startAccelerometers()
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
