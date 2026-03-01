import SwiftUI
import SwiftData

struct BoxesListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Box.name) private var boxes: [Box]
    @State private var showingAddBox = false
    @State private var showingScanner = false
    @State private var scannedBoxId: UUID?
    @State private var navigateToScannedBox = false
    @State private var newBoxName = ""
    @State private var newBoxLocation = ""
    @State private var searchText = ""
    
    private var filteredBoxes: [Box] {
        guard !searchText.isEmpty else { return boxes }
        let lower = searchText.lowercased()
        return boxes.filter {
            $0.name.lowercased().contains(lower) ||
            $0.location.lowercased().contains(lower)
        }
    }
    
    var body: some View {
        Group {
            if boxes.isEmpty {
                EmptyStateView(
                    icon: "shippingbox",
                    title: "No Boxes Yet",
                    subtitle: "Create your first box to start organizing your stuff.",
                    buttonTitle: "Create Box",
                    action: { showingAddBox = true }
                )
            } else {
                ScrollView {
                    // Stats bar
                    HStack(spacing: 12) {
                        AnimatedCounter(value: boxes.count, label: "Boxes", icon: "shippingbox.fill", color: .blue)
                        AnimatedCounter(value: boxes.reduce(0) { $0 + $1.items.count }, label: "Items", icon: "cube.fill", color: .indigo)
                    }
                    .padding(.horizontal)
                    .padding(.top, 4)
                    
                    LazyVStack(spacing: 12) {
                        ForEach(filteredBoxes) { box in
                            NavigationLink(destination: BoxDetailView(box: box)) {
                                BoxCard(box: box)
                            }
                            .buttonStyle(.plain)
                            .contextMenu {
                                Button(role: .destructive) {
                                    deleteBox(box)
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 20)
                }
                .searchable(text: $searchText, prompt: "Search boxes…")
            }
        }
        .navigationTitle("Boxes")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                HStack(spacing: 4) {
                    Button {
                        showingScanner = true
                    } label: {
                        Image(systemName: "qrcode.viewfinder")
                            .font(.body.weight(.medium))
                    }
                    Button {
                        showingAddBox = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.body.weight(.medium))
                    }
                }
            }
        }
        .sheet(isPresented: $showingAddBox) {
            AddBoxSheet(modelContext: modelContext)
                .presentationDetents([.height(280)])
                .presentationDragIndicator(.visible)
        }
        .fullScreenCover(isPresented: $showingScanner) {
            QRScannerView { code in
                handleScannedCode(code)
            }
        }
        .navigationDestination(isPresented: $navigateToScannedBox) {
            if let boxId = scannedBoxId, let box = boxes.first(where: { $0.id == boxId }) {
                BoxDetailView(box: box)
            }
        }
    }
    
    private func deleteBox(_ box: Box) {
        withAnimation {
            for item in box.items {
                item.box = nil
                item.boxId = nil
            }
            modelContext.delete(box)
        }
    }
    
    private func handleScannedCode(_ code: String) {
        let uuidString: String
        if code.hasPrefix("storagescout://box/") {
            uuidString = String(code.dropFirst("storagescout://box/".count))
        } else {
            uuidString = code
        }
        
        if let uuid = UUID(uuidString: uuidString) {
            scannedBoxId = uuid
            if boxes.contains(where: { $0.id == uuid }) {
                navigateToScannedBox = true
            }
        }
    }
}

// MARK: - Add Box Sheet

struct AddBoxSheet: View {
    let modelContext: ModelContext
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var location = ""
    @FocusState private var nameFieldFocused: Bool
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                VStack(spacing: 16) {
                    TextField("Box Name", text: $name)
                        .font(.title3)
                        .textFieldStyle(.plain)
                        .padding()
                        .background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: AppTheme.buttonRadius))
                        .focused($nameFieldFocused)
                    
                    TextField("Location (optional)", text: $location)
                        .font(.body)
                        .textFieldStyle(.plain)
                        .padding()
                        .background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: AppTheme.buttonRadius))
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .padding(.top)
            .navigationTitle("New Box")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        let trimmed = name.trimmingCharacters(in: .whitespaces)
                        if !trimmed.isEmpty {
                            let box = Box(name: trimmed, location: location.trimmingCharacters(in: .whitespaces))
                            modelContext.insert(box)
                        }
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear { nameFieldFocused = true }
        }
    }
}

// MARK: - Box Card

struct BoxCard: View {
    let box: Box
    
    var body: some View {
        HStack(spacing: 14) {
            // Photo or icon
            Group {
                if let photoData = box.photoData, let uiImage = UIImage(data: photoData) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                } else {
                    ZStack {
                        AppTheme.softGradient
                        Image(systemName: "shippingbox.fill")
                            .font(.title2)
                            .foregroundStyle(.blue.opacity(0.6))
                    }
                }
            }
            .frame(width: 64, height: 64)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(box.name)
                    .font(.headline)
                    .lineLimit(1)
                
                HStack(spacing: 10) {
                    Label("\(box.items.count)", systemImage: "cube.fill")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    if !box.location.isEmpty {
                        Label(box.location, systemImage: "mappin")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
            }
            
            Spacer()
            
            Text(box.shortId)
                .font(.caption2.monospaced())
                .foregroundStyle(.tertiary)
            
            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.cardRadius))
    }
}
