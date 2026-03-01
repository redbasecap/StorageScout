import SwiftUI

struct QRCodeView: View {
    let box: Box
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                Spacer()
                
                // QR Code
                if let qrImage = QRCodeGenerator.generate(from: box.qrContent) {
                    Image(uiImage: qrImage)
                        .interpolation(.none)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 240, height: 240)
                        .padding(24)
                        .background(.white, in: RoundedRectangle(cornerRadius: 24))
                        .shadow(color: .black.opacity(0.08), radius: 16, x: 0, y: 4)
                }
                
                // Box info
                VStack(spacing: 6) {
                    Text(box.name)
                        .font(.title2.weight(.bold))
                    
                    Text(box.shortId)
                        .font(.subheadline.monospaced())
                        .foregroundStyle(.secondary)
                    
                    if !box.location.isEmpty {
                        Label(box.location, systemImage: "mappin")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                
                Spacer()
                
                // Share buttons
                VStack(spacing: 12) {
                    ShareLink(item: box.qrContent) {
                        Label("Share Box ID", systemImage: "square.and.arrow.up")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 4)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.blue)
                    
                    if let qrImage = QRCodeGenerator.generate(from: box.qrContent) {
                        ShareLink(
                            item: Image(uiImage: qrImage),
                            preview: SharePreview("QR Code — \(box.name)", image: Image(uiImage: qrImage))
                        ) {
                            Label("Share QR Image", systemImage: "photo")
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 4)
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 20)
            }
            .padding()
            .navigationTitle("QR Code")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                        .fontWeight(.medium)
                }
            }
        }
    }
}
