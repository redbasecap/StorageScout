import SwiftUI

struct QRCodeView: View {
    let box: Box
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                if let qrImage = QRCodeGenerator.generate(from: box.qrContent) {
                    Image(uiImage: qrImage)
                        .interpolation(.none)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 250, height: 250)
                        .padding()
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .shadow(radius: 4)
                }
                
                VStack(spacing: 8) {
                    Text(box.name)
                        .font(.title2.bold())
                    Text(box.shortId)
                        .font(.subheadline.monospaced())
                        .foregroundStyle(.secondary)
                    if !box.location.isEmpty {
                        Label(box.location, systemImage: "mappin")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                
                ShareLink(item: box.qrContent) {
                    Label("Share Box ID", systemImage: "square.and.arrow.up")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .padding(.horizontal, 40)
                
                if let qrImage = QRCodeGenerator.generate(from: box.qrContent) {
                    ShareLink(
                        item: Image(uiImage: qrImage),
                        preview: SharePreview("QR Code for \(box.name)", image: Image(uiImage: qrImage))
                    ) {
                        Label("Share QR Image", systemImage: "photo")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .padding(.horizontal, 40)
                }
            }
            .padding()
            .navigationTitle("QR Code")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
