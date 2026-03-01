import SwiftUI
import SwiftData

struct BoxesListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Box.name) private var boxes: [Box]
    @State private var showingAddBox = false
    @State private var showingScanner = false
    @State private var scannedBoxId: UUID?
    @State private var navigateToScannedBox = false
    
    var body: some View {
        List {
            if boxes.isEmpty {
                ContentUnavailableView(
                    "No Boxes Yet",
                    systemImage: "shippingbox",
                    description: Text("Create a box to organize your items.")
                )
            } else {
                ForEach(boxes) { box in
                    NavigationLink(destination: BoxDetailView(box: box)) {
                        BoxRowView(box: box)
                    }
                }
                .onDelete(perform: deleteBoxes)
            }
        }
        .navigationTitle("Boxes")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                HStack {
                    Button {
                        showingScanner = true
                    } label: {
                        Image(systemName: "qrcode.viewfinder")
                    }
                    Button {
                        showingAddBox = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .alert("Add Box", isPresented: $showingAddBox) {
            AddBoxAlert(modelContext: modelContext)
        }
        .sheet(isPresented: $showingScanner) {
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
    
    private func deleteBoxes(at offsets: IndexSet) {
        for index in offsets {
            let box = boxes[index]
            // Unassign items from this box
            for item in box.items {
                item.box = nil
                item.boxId = nil
            }
            modelContext.delete(box)
        }
    }
    
    private func handleScannedCode(_ code: String) {
        // Parse storagescout://box/<UUID> or just UUID
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

struct AddBoxAlert: View {
    let modelContext: ModelContext
    @State private var boxName = ""
    
    var body: some View {
        TextField("Box Name", text: $boxName)
        Button("Cancel", role: .cancel) { }
        Button("Add") {
            let name = boxName.trimmingCharacters(in: .whitespaces)
            if !name.isEmpty {
                let box = Box(name: name)
                modelContext.insert(box)
            }
        }
    }
}

struct BoxRowView: View {
    let box: Box
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(box.name)
                    .font(.headline)
                HStack(spacing: 12) {
                    Label("\(box.items.count) items", systemImage: "cube.box")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if !box.location.isEmpty {
                        Label(box.location, systemImage: "mappin")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            Spacer()
            Text(box.shortId)
                .font(.caption)
                .monospaced()
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}
