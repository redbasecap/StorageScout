import SwiftUI
import SwiftData

struct SearchView: View {
    @Query(sort: \Item.name) private var allItems: [Item]
    @State private var searchText = ""
    
    private var filteredItems: [Item] {
        guard !searchText.trimmingCharacters(in: .whitespaces).isEmpty else { return [] }
        let lower = searchText.lowercased()
        return allItems.filter { item in
            item.name.lowercased().contains(lower) ||
            item.itemDescription.lowercased().contains(lower) ||
            item.location.lowercased().contains(lower) ||
            item.tags.contains(where: { $0.lowercased().contains(lower) }) ||
            (item.box?.name.lowercased().contains(lower) ?? false)
        }
    }
    
    var body: some View {
        List {
            if searchText.isEmpty {
                ContentUnavailableView(
                    "Search Items",
                    systemImage: "magnifyingglass",
                    description: Text("Search by name, description, location, tags, or box.")
                )
            } else if filteredItems.isEmpty {
                ContentUnavailableView.search(text: searchText)
            } else {
                Text("\(filteredItems.count) result\(filteredItems.count == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .listRowBackground(Color.clear)
                
                ForEach(filteredItems) { item in
                    NavigationLink(destination: ItemDetailView(item: item)) {
                        ItemRowView(item: item)
                    }
                }
            }
        }
        .navigationTitle("Search")
        .searchable(text: $searchText, prompt: "Search items…")
    }
}
