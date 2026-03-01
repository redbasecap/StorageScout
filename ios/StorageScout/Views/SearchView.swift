import SwiftUI
import SwiftData

struct SearchView: View {
    @Query(sort: \Item.name) private var allItems: [Item]
    @Query(sort: \Box.name) private var allBoxes: [Box]
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
    
    private var filteredBoxes: [Box] {
        guard !searchText.trimmingCharacters(in: .whitespaces).isEmpty else { return [] }
        let lower = searchText.lowercased()
        return allBoxes.filter {
            $0.name.lowercased().contains(lower) ||
            $0.location.lowercased().contains(lower)
        }
    }
    
    var body: some View {
        Group {
            if searchText.isEmpty {
                EmptyStateView(
                    icon: "magnifyingglass",
                    title: "Search Everything",
                    subtitle: "Find items by name, description, location, tags, or box."
                )
            } else if filteredItems.isEmpty && filteredBoxes.isEmpty {
                EmptyStateView(
                    icon: "magnifyingglass",
                    title: "No Results",
                    subtitle: "Nothing matched \"\(searchText)\". Try a different search."
                )
            } else {
                List {
                    if !filteredBoxes.isEmpty {
                        Section("Boxes") {
                            ForEach(filteredBoxes) { box in
                                NavigationLink(destination: BoxDetailView(box: box)) {
                                    HStack(spacing: 12) {
                                        Image(systemName: "shippingbox.fill")
                                            .foregroundStyle(.blue)
                                            .frame(width: 32)
                                        
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(box.name)
                                                .font(.body.weight(.medium))
                                            if !box.location.isEmpty {
                                                Text(box.location)
                                                    .font(.caption)
                                                    .foregroundStyle(.secondary)
                                            }
                                        }
                                        
                                        Spacer()
                                        
                                        Text("\(box.items.count) items")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }
                    
                    if !filteredItems.isEmpty {
                        Section("Items (\(filteredItems.count))") {
                            ForEach(filteredItems) { item in
                                NavigationLink(destination: ItemDetailView(item: item)) {
                                    ItemRowView(item: item)
                                }
                            }
                        }
                    }
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("Search")
        .searchable(text: $searchText, prompt: "Items, boxes, locations…")
    }
}
