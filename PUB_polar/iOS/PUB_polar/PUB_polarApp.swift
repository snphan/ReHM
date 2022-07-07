//
//  PUB_polarApp.swift
//  PUB_polar
//
//  Created by Steven Phan on 2022-07-07.
//

import SwiftUI

@main
struct PUB_polarApp: App {
    @StateObject private var polarManager = PolarManager()
    
    var body: some Scene {
        WindowGroup {
            NavigationView {
                ContentView()
            }.environmentObject(polarManager)
        }
    }
}
