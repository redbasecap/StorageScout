import SwiftUI
import SwiftData

struct LocationsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Location.name) private var locations: [Location]
    @Query(sort: \Item.name) private var allItems: [Item]
    @State private var showingAddLocation = false
    @State private var newLocationName = ""
    
    var body: some View {
        List {
            if locations.isEmpty {
                ContentUnavailableView(
                    "No Locations",
                    systemImage: "mappin.and.ellipse",
                    description: Text("Locations are created automatically when you add items, or you can add them manually.")
                )
            } else {
                ForEach(locations) { location in
                    NavigationLink(destination: LocationDetailView(locationName: location.name, items: itemsForLocation(location.name))) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(location.name)
                                    .font(.headline)
                                let count = itemsForLocation(location.name).count
                                let boxCount = boxesForLocation(location.name).count
                                Text("\(count) item\(count == 1 ? "" : "s") · \(boxCount) box\(boxCount == 1 ? "" : "es")")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                        .padding(.vertical, 4)
                    }
                }
                .onDelete(perform: deleteLocations)
            }
        }
        .navigationTitle("Locations")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showingAddLocation = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .alert("Add Location", isPresented: $showingAddLocation) {
            TextField("Location Name", text: $newLocationName)
            Button("Cancel", role: .cancel) { newLocationName = "" }
            Button("Add") {
                let name = newLocationName.trimmingCharacters(in: .whitespaces)
                if !name.isEmpty && !locations.contains(where: { $0.name == name }) {
                    modelContext.insert(Location(name: name))
                }
                newLocationName = ""
            }
        }
    }
    
    private func itemsForLocation(_ name: String) -> [Item] {
        allItems.filter { $0.location == name }
    }
    
    private func boxesForLocation(_ name: String) -> Set<UUID> {
        Set(itemsForLocation(name).compactMap { $0.boxId })
    }
    
    private func deleteLocations(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(locations[index])
        }
    }
}

struct LocationDetailView: View {
    let locationName: String
    let items: [Item]
    
    var body: some View {
        List {
            if items.isEmpty {
                Text("No items at this location")
                    .foregroundStyle(.secondary)
                    .italic()
            } else {
                ForEach(items) { item in
                    NavigationLink(destination: ItemDetailView(item: item)) {
                        ItemRowView(item: item)
                    }
                }
            }
        }
        .navigationTitle(locationName)
    }
}
