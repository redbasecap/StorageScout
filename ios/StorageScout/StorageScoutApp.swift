import SwiftUI
import SwiftData

@main
struct StorageScoutApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Item.self, Box.self, Location.self])
    }
}
