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
            VStack(spacing: 0) {
                // Photos carousel
                if !item.photoData.isEmpty {
                    TabView {
                        ForEach(Array(item.photoData.enumerated()), id: \.offset) { index, data in
                            if let uiImage = UIImage(data: data) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(height: 280)
                                    .clipped()
                                    .onTapGesture {
                                        selectedPhotoIndex = index
                                    }
                            }
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: item.photoData.count > 1 ? .always : .never))
                    .frame(height: 280)
                }
                
                VStack(alignment: .leading, spacing: 20) {
                    // Description
                    if !item.itemDescription.isEmpty {
                        Text(item.itemDescription)
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 4)
                    }
                    
                    // Info card
                    VStack(spacing: 1) {
                        if let box = item.box {
                            InfoCardRow(icon: "shippingbox.fill", label: "Box", value: box.name)
                        }
                        if !item.location.isEmpty {
                            InfoCardRow(icon: "mappin", label: "Location", value: item.location)
                        }
                        InfoCardRow(icon: "calendar", label: "Added", value: item.createdAt.formatted(date: .abbreviated, time: .shortened))
                    }
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.cardRadius))
                    
                    // Tags
                    if !item.tags.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Tags")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.secondary)
                            
                            FlowLayout(spacing: 8) {
                                ForEach(item.tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.subheadline)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(.blue.opacity(0.08), in: Capsule())
                                        .foregroundStyle(.blue)
                                }
                            }
                        }
                    }
                }
                .padding()
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
        .statusBarHidden()
        .onAppear { currentIndex = initialIndex }
    }
}
