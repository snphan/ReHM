//
//  PUB_applewatchApp.swift
//  PUB_applewatch WatchKit Extension
//
//  Created by Steven Phan on 2022-07-05.
//

import SwiftUI

@main
struct PUB_applewatchApp: App {
    @StateObject private var workoutManager = WorkoutManager()
    @SceneBuilder var body: some Scene {
        WindowGroup {
            NavigationView {
                ContentView()
            }.environmentObject(workoutManager)
        }

        WKNotificationScene(controller: NotificationController.self, category: "myCategory")
    }
}
