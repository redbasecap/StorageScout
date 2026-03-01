import Foundation
import SwiftData

@Model
final class Item {
    var id: UUID
    var name: String
    var itemDescription: String
    var boxId: UUID?
    var location: String
    var tags: [String]
    var photoData: [Data]
    var createdAt: Date
    
    @Relationship(inverse: \Box.items)
    var box: Box?
    
    init(
        name: String,
        itemDescription: String = "",
        boxId: UUID? = nil,
        location: String = "",
        tags: [String] = [],
        photoData: [Data] = []
    ) {
        self.id = UUID()
        self.name = name
        self.itemDescription = itemDescription
        self.boxId = boxId
        self.location = location
        self.tags = tags
        self.photoData = photoData
        self.createdAt = Date()
    }
}
