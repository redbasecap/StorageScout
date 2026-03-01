import SwiftUI
import SwiftData
import PhotosUI

struct AddItemView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Box.name) private var boxes: [Box]
    @Query(sort: \Location.name) private var locations: [Location]
    
    @State private var name = ""
    @State private var itemDescription = ""
    @State private var selectedBox: Box?
    @State private var location = ""
    @State private var tagInput = ""
    @State private var tags: [String] = []
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var photoData: [Data] = []
    @State private var showingCamera = false
    
    var editingItem: Item?
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Name", text: $name)
                    TextField("Description", text: $itemDescription, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("Box") {
                    Picker("Box", selection: $selectedBox) {
                        Text("None").tag(nil as Box?)
                        ForEach(boxes) { box in
                            Text(box.name).tag(box as Box?)
                        }
                    }
                }
                
                Section("Location") {
                    if locations.isEmpty {
                        TextField("Location", text: $location)
                    } else {
                        Picker("Location", selection: $location) {
                            Text("None").tag("")
                            ForEach(locations) { loc in
                                Text(loc.name).tag(loc.name)
                            }
                        }
                        TextField("Or enter new…", text: $location)
                    }
                }
                
                Section("Tags") {
                    HStack {
                        TextField("Add tag", text: $tagInput)
                            .onSubmit { addTag() }
                        Button("Add") { addTag() }
                            .disabled(tagInput.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                    if !tags.isEmpty {
                        FlowLayout(spacing: 6) {
                            ForEach(tags, id: \.self) { tag in
                                HStack(spacing: 4) {
                                    Text(tag)
                                        .font(.caption)
                                    Button {
                                        tags.removeAll { $0 == tag }
                                    } label: {
                                        Image(systemName: "xmark.circle.fill")
                                            .font(.caption2)
                                    }
                                }
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(.blue.opacity(0.1))
                                .clipShape(Capsule())
                            }
                        }
                    }
                }
                
                Section("Photos") {
                    PhotosPicker(selection: $selectedPhotos, maxSelectionCount: 5, matching: .images) {
                        Label("Choose from Library", systemImage: "photo.on.rectangle")
                    }
                    .onChange(of: selectedPhotos) { _, newItems in
                        Task {
                            for item in newItems {
                                if let data = try? await item.loadTransferable(type: Data.self) {
                                    photoData.append(data)
                                }
                            }
                            selectedPhotos = []
                        }
                    }
                    
                    if !photoData.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(Array(photoData.enumerated()), id: \.offset) { index, data in
                                    if let uiImage = UIImage(data: data) {
                                        ZStack(alignment: .topTrailing) {
                                            Image(uiImage: uiImage)
                                                .resizable()
                                                .scaledToFill()
                                                .frame(width: 80, height: 80)
                                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                            
                                            Button {
                                                photoData.remove(at: index)
                                            } label: {
                                                Image(systemName: "xmark.circle.fill")
                                                    .foregroundStyle(.white, .red)
                                            }
                                            .offset(x: 4, y: -4)
                                        }
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .navigationTitle(editingItem == nil ? "Add Item" : "Edit Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear {
                if let item = editingItem {
                    name = item.name
                    itemDescription = item.itemDescription
                    selectedBox = item.box
                    location = item.location
                    tags = item.tags
                    photoData = item.photoData
                }
            }
        }
    }
    
    private func addTag() {
        let tag = tagInput.trimmingCharacters(in: .whitespaces)
        if !tag.isEmpty && !tags.contains(tag) {
            tags.append(tag)
        }
        tagInput = ""
    }
    
    private func save() {
        let trimmedLocation = location.trimmingCharacters(in: .whitespaces)
        
        // Auto-create location if it doesn't exist
        if !trimmedLocation.isEmpty && !locations.contains(where: { $0.name == trimmedLocation }) {
            let newLocation = Location(name: trimmedLocation)
            modelContext.insert(newLocation)
        }
        
        if let item = editingItem {
            item.name = name.trimmingCharacters(in: .whitespaces)
            item.itemDescription = itemDescription
            item.box = selectedBox
            item.boxId = selectedBox?.id
            item.location = trimmedLocation
            item.tags = tags
            item.photoData = photoData
        } else {
            let item = Item(
                name: name.trimmingCharacters(in: .whitespaces),
                itemDescription: itemDescription,
                boxId: selectedBox?.id,
                location: trimmedLocation,
                tags: tags,
                photoData: photoData
            )
            item.box = selectedBox
            modelContext.insert(item)
        }
        
        dismiss()
    }
}

// Simple flow layout for tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 6
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = computeLayout(proposal: proposal, subviews: subviews)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = computeLayout(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }
    
    private func computeLayout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var maxX: CGFloat = 0
        
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
            maxX = max(maxX, x)
        }
        
        return (CGSize(width: maxX, height: y + rowHeight), positions)
    }
}
