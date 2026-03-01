import SwiftUI
import SwiftData

struct ItemsListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Item.createdAt, order: .reverse) private var items: [Item]
    @State private var showingAddItem = false
    
    var body: some View {
        Group {
            if items.isEmpty {
                EmptyStateView(
                    icon: "cube",
                    title: "No Items Yet",
                    subtitle: "Add items to keep track of your belongings.",
                    buttonTitle: "Add Item",
                    action: { showingAddItem = true }
                )
            } else {
                List {
                    ForEach(items) { item in
                        NavigationLink(destination: ItemDetailView(item: item)) {
                            ItemRowView(item: item)
                        }
                    }
                    .onDelete(perform: deleteItems)
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("Items")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: { showingAddItem = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.body.weight(.medium))
                }
            }
        }
        .sheet(isPresented: $showingAddItem) {
            AddItemView()
        }
    }
    
    private func deleteItems(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(items[index])
        }
    }
}

struct ItemRowView: View {
    let item: Item
    
    var body: some View {
        HStack(spacing: 14) {
            // Thumbnail
            Group {
                if let firstPhoto = item.photoData.first, let uiImage = UIImage(data: firstPhoto) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                } else {
                    ZStack {
                        AppTheme.softGradient
                        Image(systemName: "cube.fill")
                            .foregroundStyle(.blue.opacity(0.5))
                    }
                }
            }
            .frame(width: 56, height: 56)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.body.weight(.medium))
                    .lineLimit(1)
                
                HStack(spacing: 8) {
                    if let box = item.box {
                        Label(box.name, systemImage: "shippingbox.fill")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    
                    if !item.location.isEmpty {
                        Label(item.location, systemImage: "mappin")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
                
                if !item.tags.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(item.tags.prefix(3), id: \.self) { tag in
                            Text(tag)
                                .font(.caption2)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 2)
                                .background(.blue.opacity(0.08), in: Capsule())
                                .foregroundStyle(.blue)
                        }
                        if item.tags.count > 3 {
                            Text("+\(item.tags.count - 3)")
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                        }
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}
