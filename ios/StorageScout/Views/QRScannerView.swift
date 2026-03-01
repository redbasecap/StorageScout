import SwiftUI
import AVFoundation

struct QRScannerView: View {
    let onCodeScanned: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var scannedCode: String?
    @State private var showPermissionDenied = false
    @State private var torchOn = false
    
    var body: some View {
        ZStack {
            // Camera layer
            QRCameraPreview(onCodeScanned: { code in
                guard scannedCode == nil else { return }
                scannedCode = code
                let generator = UIImpactFeedbackGenerator(style: .medium)
                generator.impactOccurred()
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    onCodeScanned(code)
                    dismiss()
                }
            }, showPermissionDenied: $showPermissionDenied)
            .ignoresSafeArea()
            
            // Overlay
            VStack {
                // Top bar
                HStack {
                    Spacer()
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title)
                            .symbolRenderingMode(.palette)
                            .foregroundStyle(.white, .white.opacity(0.3))
                    }
                }
                .padding()
                
                Spacer()
                
                // Scan frame
                ZStack {
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(.white.opacity(0.6), lineWidth: 2)
                        .frame(width: 260, height: 260)
                        .background(
                            RoundedRectangle(cornerRadius: 20)
                                .fill(.clear)
                        )
                    
                    // Corner accents
                    ForEach(0..<4, id: \.self) { corner in
                        CornerAccent()
                            .rotationEffect(.degrees(Double(corner) * 90))
                    }
                    .frame(width: 260, height: 260)
                    
                    if scannedCode != nil {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(.green)
                            .transition(.scale.combined(with: .opacity))
                    }
                }
                .animation(.spring(response: 0.3), value: scannedCode)
                
                Spacer()
                
                // Bottom label
                VStack(spacing: 8) {
                    Text("Scan Box QR Code")
                        .font(.headline)
                        .foregroundStyle(.white)
                    
                    Text("Point the camera at a StorageScout QR code")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.7))
                }
                .padding(.bottom, 60)
            }
            
            // Permission denied overlay
            if showPermissionDenied {
                VStack(spacing: 16) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.secondary)
                    
                    Text("Camera Access Required")
                        .font(.title3.weight(.semibold))
                    
                    Text("Enable camera access in Settings to scan QR codes.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Button("Open Settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                    .buttonStyle(PillButtonStyle())
                    
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.secondary)
                }
                .padding(40)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 24))
                .padding()
            }
        }
        .background(.black)
        .statusBarHidden()
    }
}

// MARK: - Corner Accent

private struct CornerAccent: View {
    var body: some View {
        GeometryReader { geo in
            Path { path in
                let length: CGFloat = 30
                let offset: CGFloat = 0
                path.move(to: CGPoint(x: offset, y: offset + length))
                path.addLine(to: CGPoint(x: offset, y: offset))
                path.addLine(to: CGPoint(x: offset + length, y: offset))
            }
            .stroke(.white, style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round))
        }
    }
}

// MARK: - Camera Preview (UIKit)

struct QRCameraPreview: UIViewControllerRepresentable {
    let onCodeScanned: (String) -> Void
    @Binding var showPermissionDenied: Bool
    
    func makeUIViewController(context: Context) -> QRCameraVC {
        let vc = QRCameraVC()
        vc.onCodeScanned = onCodeScanned
        vc.onPermissionDenied = {
            DispatchQueue.main.async {
                showPermissionDenied = true
            }
        }
        return vc
    }
    
    func updateUIViewController(_ uiViewController: QRCameraVC, context: Context) {}
}

class QRCameraVC: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCodeScanned: ((String) -> Void)?
    var onPermissionDenied: (() -> Void)?
    
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        checkPermissionAndSetup()
    }
    
    private func checkPermissionAndSetup() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            setupCamera()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    if granted {
                        self?.setupCamera()
                    } else {
                        self?.onPermissionDenied?()
                    }
                }
            }
        default:
            onPermissionDenied?()
        }
    }
    
    private func setupCamera() {
        let session = AVCaptureSession()
        session.sessionPreset = .high
        captureSession = session
        
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: device) else {
            return
        }
        
        if session.canAddInput(input) {
            session.addInput(input)
        }
        
        let output = AVCaptureMetadataOutput()
        if session.canAddOutput(output) {
            session.addOutput(output)
            output.setMetadataObjectsDelegate(self, queue: .main)
            output.metadataObjectTypes = [.qr]
        }
        
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.frame = view.bounds
        layer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(layer)
        previewLayer = layer
        
        DispatchQueue.global(qos: .userInitiated).async {
            session.startRunning()
        }
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession?.stopRunning()
    }
    
    // MARK: - AVCaptureMetadataOutputObjectsDelegate
    
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let code = object.stringValue else { return }
        
        captureSession?.stopRunning()
        onCodeScanned?(code)
    }
}
