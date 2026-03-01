import SwiftUI

struct ItemDetailView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Bindable var item: Item
    @State private var showingEdit = false
    @State private var showingDeleteAlert = false
    @State private var selectedPhotoIndex: Int?
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Photos
                if !item.photoData.isEmpty {
                    TabView {
                        ForEach(Array(item.photoData.enumerated()), id: \.offset) { index, data in
                            if let uiImage = UIImage(data: data) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFit()
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                    .onTapGesture {
                                        selectedPhotoIndex = index
                                    }
                            }
                        }
                    }
                    .tabViewStyle(.page)
                    .frame(height: 250)
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    // Description
                    if !item.itemDescription.isEmpty {
                        Text(item.itemDescription)
                            .foregroundStyle(.secondary)
                    }
                    
                    Divider()
                    
                    // Info rows
                    if let box = item.box {
                        InfoRow(icon: "shippingbox", label: "Box", value: box.name)
                    }
                    
                    if !item.location.isEmpty {
                        InfoRow(icon: "mappin", label: "Location", value: item.location)
                    }
                    
                    InfoRow(icon: "calendar", label: "Added", value: item.createdAt.formatted(date: .abbreviated, time: .shortened))
                    
                    // Tags
                    if !item.tags.isEmpty {
                        Divider()
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Tags")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            FlowLayout(spacing: 6) {
                                ForEach(item.tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.caption)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(.blue.opacity(0.1))
                                        .clipShape(Capsule())
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .navigationTitle(item.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button {
                        showingEdit = true
                    } label: {
                        Label("Edit", systemImage: "pencil")
                    }
                    
                    Button(role: .destructive) {
                        showingDeleteAlert = true
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingEdit) {
            AddItemView(editingItem: item)
        }
        .alert("Delete Item", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                modelContext.delete(item)
                dismiss()
            }
        } message: {
            Text("Are you sure you want to delete \"\(item.name)\"?")
        }
        .fullScreenCover(item: $selectedPhotoIndex) { index in
            PhotoFullScreenView(photoData: item.photoData, initialIndex: index)
        }
    }
}

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Label(label, systemImage: icon)
                .foregroundStyle(.secondary)
                .frame(width: 110, alignment: .leading)
            Text(value)
        }
        .font(.subheadline)
    }
}

extension Int: @retroactive Identifiable {
    public var id: Int { self }
}

struct PhotoFullScreenView: View {
    let photoData: [Data]
    let initialIndex: Int
    @Environment(\.dismiss) private var dismiss
    @State private var currentIndex: Int = 0
    
    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()
            
            TabView(selection: $currentIndex) {
                ForEach(Array(photoData.enumerated()), id: \.offset) { index, data in
                    if let uiImage = UIImage(data: data) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFit()
                            .tag(index)
                    }
                }
            }
            .tabViewStyle(.page)
            
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.title)
                    .foregroundStyle(.white.opacity(0.8))
                    .padding()
            }
        }
        .onAppear { currentIndex = initialIndex }
    }
}
