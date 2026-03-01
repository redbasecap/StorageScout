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
    @State private var newName = ""
    @State private var newLocation = ""
    
    var body: some View {
        List {
            Section {
                HStack {
                    Label("Location", systemImage: "mappin")
                    Spacer()
                    Text(box.location.isEmpty ? "Not set" : box.location)
                        .foregroundStyle(box.location.isEmpty ? .tertiary : .primary)
                }
                HStack {
                    Label("Items", systemImage: "cube.box")
                    Spacer()
                    Text("\(box.items.count)")
                }
                HStack {
                    Label("ID", systemImage: "qrcode")
                    Spacer()
                    Text(box.shortId)
                        .monospaced()
                        .foregroundStyle(.secondary)
                }
            }
            
            Section("Items in this Box") {
                if box.items.isEmpty {
                    Text("No items in this box yet")
                        .foregroundStyle(.secondary)
                        .italic()
                } else {
                    ForEach(box.items.sorted(by: { $0.name < $1.name })) { item in
                        NavigationLink(destination: ItemDetailView(item: item)) {
                            ItemRowView(item: item)
                        }
                    }
                }
            }
        }
        .navigationTitle(box.name)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button {
                        showingQRCode = true
                    } label: {
                        Label("Show QR Code", systemImage: "qrcode")
                    }
                    
                    Button {
                        showingAddItem = true
                    } label: {
                        Label("Add Item to Box", systemImage: "plus")
                    }
                    
                    Button {
                        newName = box.name
                        newLocation = box.location
                        showingRename = true
                    } label: {
                        Label("Edit Box", systemImage: "pencil")
                    }
                    
                    Divider()
                    
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
