import SwiftUI

struct ContentView: View {
    @State private var selectedTab: Tab = .boxes
    
    enum Tab: String {
        case boxes, items, search, settings
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                BoxesListView()
            }
            .tabItem {
                Label("Boxes", systemImage: "shippingbox.fill")
            }
            .tag(Tab.boxes)
            
            NavigationStack {
                ItemsListView()
            }
            .tabItem {
                Label("Items", systemImage: "cube.fill")
            }
            .tag(Tab.items)
            
            NavigationStack {
                SearchView()
            }
            .tabItem {
                Label("Search", systemImage: "magnifyingglass")
            }
            .tag(Tab.search)
            
            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape.fill")
            }
            .tag(Tab.settings)
        }
        .tint(.blue)
    }
}
