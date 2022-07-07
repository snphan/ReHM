//
//  ContentView.swift
//  PUB_polar
//
//  Created by Steven Phan on 2022-07-07.
//

import SwiftUI
import RxSwift

struct deviceInfo: Hashable, Identifiable {
    let name: String
    var deviceSerial: String
    let id = UUID()
}

struct ContentView: View {
    @EnvironmentObject var polarManager: PolarManager
    @State private var devicesFound: Array<deviceInfo> = []
    
    var body: some View {
        ScrollView {
         VStack {
            Text("Heart Rate: \(polarManager.heartRate) BPM")
                .padding()
            }
            ForEach($devicesFound, id: \.id) { $oneDevice in
                let newSerial = $oneDevice.wrappedValue.deviceSerial
                Button {
                    print("\(newSerial) was tapped")
                    do {
                        try polarManager.api.connectToDevice(newSerial)
                        polarManager.setSerial(serial: newSerial)
                     } catch let err {
                         print("error \(err)")
                     }
                } label: {
                    Text("\(newSerial)")
                }
            }
        }.onAppear {
        polarManager.api.searchForDevice().observe(on: MainScheduler.instance).subscribe { e in
                switch e {
                case .completed:
                    print("search complete")
                case .error(let err):
                    print("search error \(err)")
                case .next(let item):
                    print("Polar device found: \(item.name) connectable: \(item.connectable) address: \(item.address.uuidString)")
                    let newDevice = deviceInfo(name: item.name, deviceSerial: item.name.components(separatedBy: (" "))[2])
                    devicesFound.append(newDevice)
                }
            }
    }

    }
   
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
