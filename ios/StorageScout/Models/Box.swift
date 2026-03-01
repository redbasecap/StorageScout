import Foundation
import SwiftData

@Model
final class Box {
    var id: UUID
    var name: String
    var location: String
    var createdAt: Date
    
    @Relationship
    var items: [Item]
    
    init(name: String, location: String = "") {
        self.id = UUID()
        self.name = name
        self.location = location
        self.createdAt = Date()
        self.items = []
    }
    
    /// Short ID for display (first 8 chars of UUID)
    var shortId: String {
        String(id.uuidString.prefix(8))
    }
    
    /// QR code content — the full UUID
    var qrContent: String {
        "storagescout://box/\(id.uuidString)"
    }
}
