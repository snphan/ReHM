//
//  ContentView.swift
//  PUB_polar
//
//  Created by Steven Phan on 2022-07-07.
//

import SwiftUI
import RxSwift

struct ContentView: View {
    @EnvironmentObject var polarManager: PolarManager
    
    var body: some View {
        VStack {
            Text("Heart Rate: \(polarManager.heartRate) BPM")
                .padding()
        }.onAppear {
        polarManager.api.searchForDevice().observe(on: MainScheduler.instance).subscribe { e in
                switch e {
                case .completed:
                    print("search complete")
                case .error(let err):
                    print("search error \(err)")
                case .next(let item):
                    print("Polar device found: \(item.name) connectable: \(item.connectable) address: \(item.address.uuidString)")
                }
            }
        do {
            try polarManager.api.connectToDevice("AFCB3621")
        } catch let err {
            print("error \(err)")
        }
    }

    }
   
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
