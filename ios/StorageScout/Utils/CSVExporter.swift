import Foundation

struct CSVExporter {
    static func export(items: [Item]) -> String {
        let headers = "Name,Description,Box,Location,Tags,Created At"
        let rows = items.map { item in
            let fields = [
                escapeCsvField(item.name),
                escapeCsvField(item.itemDescription),
                escapeCsvField(item.box?.name ?? ""),
                escapeCsvField(item.location),
                escapeCsvField(item.tags.joined(separator: "; ")),
                ISO8601DateFormatter().string(from: item.createdAt)
            ]
            return fields.joined(separator: ",")
        }
        return ([headers] + rows).joined(separator: "\n")
    }
    
    private static func escapeCsvField(_ value: String) -> String {
        if value.isEmpty { return "" }
        if value.contains(",") || value.contains("\"") || value.contains("\n") {
            return "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
        }
        return value
    }
}
