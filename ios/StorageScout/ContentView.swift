import SwiftUI

struct ContentView: View {
    @State private var selectedTab: Tab = .items
    
    enum Tab {
        case items, boxes, locations, search, settings
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                ItemsListView()
            }
            .tabItem {
                Label("Items", systemImage: "cube.box")
            }
            .tag(Tab.items)
            
            NavigationStack {
                BoxesListView()
            }
            .tabItem {
                Label("Boxes", systemImage: "shippingbox")
            }
            .tag(Tab.boxes)
            
            NavigationStack {
                SearchView()
            }
            .tabItem {
                Label("Search", systemImage: "magnifyingglass")
            }
            .tag(Tab.search)
            
            NavigationStack {
                LocationsView()
            }
            .tabItem {
                Label("Locations", systemImage: "mappin.and.ellipse")
            }
            .tag(Tab.locations)
            
            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
            .tag(Tab.settings)
        }
    }
}
