import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var items: [Item]
    @Query private var boxes: [Box]
    @Query private var locations: [Location]
    @State private var showingExportShare = false
    @State private var csvURL: URL?
    @State private var showingDeleteAllAlert = false
    @State private var showingImportPicker = false
    
    var body: some View {
        List {
            // Stats overview
            Section {
                HStack(spacing: 12) {
                    AnimatedCounter(value: items.count, label: "Items", icon: "cube.fill", color: .blue)
                    AnimatedCounter(value: boxes.count, label: "Boxes", icon: "shippingbox.fill", color: .indigo)
                    AnimatedCounter(value: locations.count, label: "Places", icon: "mappin", color: .orange)
                }
                .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
                .listRowBackground(Color.clear)
            }
            
            Section("Data") {
                Button {
                    exportCSV()
                } label: {
                    Label("Export as CSV", systemImage: "square.and.arrow.up")
                }
                .disabled(items.isEmpty)
                
                Button {
                    showingImportPicker = true
                } label: {
                    Label("Import from CSV", systemImage: "square.and.arrow.down")
                }
            }
            
            Section {
                Button(role: .destructive) {
                    showingDeleteAllAlert = true
                } label: {
                    Label("Delete All Data", systemImage: "trash")
                        .foregroundStyle(.red)
                }
            }
            
            Section("About") {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundStyle(.secondary)
                }
                HStack {
                    Text("Storage")
                    Spacer()
                    Text("Local (SwiftData)")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Settings")
        .sheet(isPresented: $showingExportShare) {
            if let url = csvURL {
                ShareSheetView(items: [url])
            }
        }
        .fileImporter(isPresented: $showingImportPicker, allowedContentTypes: [.commaSeparatedText]) { result in
            switch result {
            case .success(let url):
                importCSV(from: url)
            case .failure:
                break
            }
        }
        .alert("Delete All Data", isPresented: $showingDeleteAllAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete Everything", role: .destructive) {
                deleteAllData()
            }
        } message: {
            Text("This will permanently delete all items, boxes, and locations. This cannot be undone.")
        }
    }
    
    private func exportCSV() {
        let csv = CSVExporter.export(items: items)
        let fileName = "StorageScout_Export_\(Date().formatted(.iso8601.year().month().day())).csv"
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        
        do {
            try csv.write(to: tempURL, atomically: true, encoding: .utf8)
            csvURL = tempURL
            showingExportShare = true
        } catch {
            print("Export failed: \(error)")
        }
    }
    
    private func importCSV(from url: URL) {
        guard url.startAccessingSecurityScopedResource() else { return }
        defer { url.stopAccessingSecurityScopedResource() }
        
        guard let content = try? String(contentsOf: url, encoding: .utf8) else { return }
        
        let lines = content.components(separatedBy: .newlines).filter { !$0.isEmpty }
        guard lines.count > 1 else { return }
        
        for line in lines.dropFirst() {
            let fields = parseCSVLine(line)
            guard fields.count >= 1 else { continue }
            
            let name = fields[0]
            let description = fields.count > 1 ? fields[1] : ""
            let boxName = fields.count > 2 ? fields[2] : ""
            let location = fields.count > 3 ? fields[3] : ""
            let tagsStr = fields.count > 4 ? fields[4] : ""
            let tags = tagsStr.split(separator: ";").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
            
            var box: Box?
            if !boxName.isEmpty {
                let existingBoxes = (try? modelContext.fetch(FetchDescriptor<Box>(predicate: #Predicate { $0.name == boxName }))) ?? []
                if let existing = existingBoxes.first {
                    box = existing
                } else {
                    let newBox = Box(name: boxName, location: location)
                    modelContext.insert(newBox)
                    box = newBox
                }
            }
            
            if !location.isEmpty {
                let existingLocations = (try? modelContext.fetch(FetchDescriptor<Location>(predicate: #Predicate { $0.name == location }))) ?? []
                if existingLocations.isEmpty {
                    modelContext.insert(Location(name: location))
                }
            }
            
            let item = Item(
                name: name,
                itemDescription: description,
                boxId: box?.id,
                location: location,
                tags: tags
            )
            item.box = box
            modelContext.insert(item)
        }
    }
    
    private func parseCSVLine(_ line: String) -> [String] {
        var fields: [String] = []
        var current = ""
        var inQuotes = false
        var i = line.startIndex
        
        while i < line.endIndex {
            let ch = line[i]
            if inQuotes {
                if ch == "\"" {
                    let next = line.index(after: i)
                    if next < line.endIndex && line[next] == "\"" {
                        current.append("\"")
                        i = line.index(after: next)
                        continue
                    } else {
                        inQuotes = false
                    }
                } else {
                    current.append(ch)
                }
            } else {
                if ch == "\"" {
                    inQuotes = true
                } else if ch == "," {
                    fields.append(current)
                    current = ""
                } else {
                    current.append(ch)
                }
            }
            i = line.index(after: i)
        }
        fields.append(current)
        return fields
    }
    
    private func deleteAllData() {
        do {
            try modelContext.delete(model: Item.self)
            try modelContext.delete(model: Box.self)
            try modelContext.delete(model: Location.self)
        } catch {
            print("Delete failed: \(error)")
        }
    }
}

struct ShareSheetView: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
