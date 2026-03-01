import SwiftUI
import SwiftData

struct BoxDetailView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Bindable var box: Box
    @State private var showingQRCode = false
    @State private var showingAddItem = false
    @State private var showingRename = false
    @State private var showingDeleteAlert = false
    @State private var showingCamera = false
    @State private var showingPhotoFullScreen = false
    @State private var newName = ""
    @State private var newLocation = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero photo area
                ZStack(alignment: .bottomTrailing) {
                    if let photoData = box.photoData, let uiImage = UIImage(data: photoData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 220)
                            .clipped()
                            .onTapGesture { showingPhotoFullScreen = true }
                    } else {
                        ZStack {
                            AppTheme.softGradient
                                .frame(height: 180)
                            
                            VStack(spacing: 12) {
                                Image(systemName: "camera.fill")
                                    .font(.system(size: 32, weight: .light))
                                    .foregroundStyle(.secondary)
                                Text("Add a photo of this box")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .onTapGesture { showingCamera = true }
                    }
                    
                    // Camera button overlay
                    Button {
                        showingCamera = true
                    } label: {
                        Image(systemName: box.photoData != nil ? "camera.fill" : "camera.badge.plus")
                            .font(.body.weight(.medium))
                            .foregroundStyle(.white)
                            .padding(10)
                            .background(.ultraThinMaterial, in: Circle())
                    }
                    .padding(12)
                }
                
                VStack(spacing: 20) {
                    // Info cards
                    VStack(spacing: 1) {
                        InfoCardRow(icon: "mappin", label: "Location", value: box.location.isEmpty ? "Not set" : box.location, isPlaceholder: box.location.isEmpty)
                        InfoCardRow(icon: "cube.fill", label: "Items", value: "\(box.items.count)")
                        InfoCardRow(icon: "qrcode", label: "ID", value: box.shortId, isMonospaced: true)
                        InfoCardRow(icon: "calendar", label: "Created", value: box.createdAt.formatted(date: .abbreviated, time: .omitted))
                    }
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.cardRadius))
                    
                    // Quick actions
                    HStack(spacing: 12) {
                        QuickActionButton(icon: "qrcode", label: "QR Code") {
                            showingQRCode = true
                        }
                        QuickActionButton(icon: "plus", label: "Add Item") {
                            showingAddItem = true
                        }
                        QuickActionButton(icon: "pencil", label: "Edit") {
                            newName = box.name
                            newLocation = box.location
                            showingRename = true
                        }
                    }
                    
                    // Items section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Items")
                            .font(.title3.weight(.semibold))
                            .padding(.horizontal, 4)
                        
                        if box.items.isEmpty {
                            VStack(spacing: 10) {
                                Image(systemName: "cube")
                                    .font(.title2)
                                    .foregroundStyle(.tertiary)
                                Text("No items yet")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 30)
                            .background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: AppTheme.cardRadius))
                        } else {
                            VStack(spacing: 1) {
                                ForEach(box.items.sorted(by: { $0.name < $1.name })) { item in
                                    NavigationLink(destination: ItemDetailView(item: item)) {
                                        CompactItemRow(item: item)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.cardRadius))
                        }
                    }
                }
                .padding()
            }
        }
        .navigationTitle(box.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button {
                        showingQRCode = true
                    } label: {
                        Label("Show QR Code", systemImage: "qrcode")
                    }
                    Button {
                        showingCamera = true
                    } label: {
                        Label("Take Photo", systemImage: "camera")
                    }
                    Button {
                        showingAddItem = true
                    } label: {
                        Label("Add Item", systemImage: "plus")
                    }
                    Button {
                        newName = box.name
                        newLocation = box.location
                        showingRename = true
                    } label: {
                        Label("Edit Box", systemImage: "pencil")
                    }
                    
                    Divider()
                    
                    if box.photoData != nil {
                        Button(role: .destructive) {
                            withAnimation { box.photoData = nil }
                        } label: {
                            Label("Remove Photo", systemImage: "photo.badge.minus")
                        }
                    }
                    
                    Button(role: .destructive) {
                        showingDeleteAlert = true
                    } label: {
                        Label("Delete Box", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingQRCode) {
            QRCodeView(box: box)
        }
        .sheet(isPresented: $showingAddItem) {
            AddItemView(editingItem: nil)
        }
        .fullScreenCover(isPresented: $showingCamera) {
            CameraView { data in
                withAnimation { box.photoData = data }
            }
        }
        .fullScreenCover(isPresented: $showingPhotoFullScreen) {
            if let photoData = box.photoData {
                BoxPhotoFullScreen(photoData: photoData)
            }
        }
        .alert("Edit Box", isPresented: $showingRename) {
            TextField("Name", text: $newName)
            TextField("Location", text: $newLocation)
            Button("Cancel", role: .cancel) { }
            Button("Save") {
                let name = newName.trimmingCharacters(in: .whitespaces)
                if !name.isEmpty {
                    box.name = name
                    box.location = newLocation.trimmingCharacters(in: .whitespaces)
                }
            }
        }
        .alert("Delete Box", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                for item in box.items {
                    item.box = nil
                    item.boxId = nil
                }
                modelContext.delete(box)
                dismiss()
            }
        } message: {
            Text("This will unassign all items from this box. The items themselves won't be deleted.")
        }
    }
}

// MARK: - Info Card Row

struct InfoCardRow: View {
    let icon: String
    let label: String
    let value: String
    var isPlaceholder: Bool = false
    var isMonospaced: Bool = false
    
    var body: some View {
        HStack {
            Label(label, systemImage: icon)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(width: 120, alignment: .leading)
            
            Spacer()
            
            Text(value)
                .font(isMonospaced ? .subheadline.monospaced() : .subheadline)
                .foregroundStyle(isPlaceholder ? .tertiary : .primary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

// MARK: - Quick Action Button

struct QuickActionButton: View {
    let icon: String
    let label: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.title3)
                Text(label)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: AppTheme.buttonRadius))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Compact Item Row

struct CompactItemRow: View {
    let item: Item
    
    var body: some View {
        HStack(spacing: 12) {
            if let firstPhoto = item.photoData.first, let uiImage = UIImage(data: firstPhoto) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 40, height: 40)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(.tertiarySystemFill))
                    .frame(width: 40, height: 40)
                    .overlay {
                        Image(systemName: "cube")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
            }
            
            Text(item.name)
                .font(.subheadline)
                .lineLimit(1)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}

// MARK: - Box Photo Full Screen

struct BoxPhotoFullScreen: View {
    let photoData: Data
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()
            
            if let uiImage = UIImage(data: photoData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFit()
            }
            
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
    }
}
