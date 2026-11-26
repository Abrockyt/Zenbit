import SwiftUI
import VisionKit
import PhotosUI

/// Scan & Pay. Real camera scanning via VisionKit's DataScanner on device; on the Simulator
/// (no camera) it shows sample QR codes so every branch can still be tested.
struct ScanView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var error: String?
    @State private var photo: PhotosPickerItem?
    @State private var showMyQR = false
    @State private var scanLine = false

    private var cameraAvailable: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if cameraAvailable {
                QRScanner { handle($0) }.ignoresSafeArea()
            }
            viewfinder
            VStack {
                HStack {
                    GlassIconButton(systemName: "xmark", label: "Close") { dismiss() }
                    Spacer()
                    PhotosPicker(selection: $photo, matching: .images) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: ZB.minTarget, height: ZB.minTarget)
                            .glassEffect(.clear.interactive(), in: .circle)
                    }
                    .accessibilityLabel("Scan a QR from Photos")
                }
                .padding(.horizontal, ZB.Space.margin)
                Spacer()
                bottom
            }
        }
        .environment(\.colorScheme, .dark)
        .onChange(of: photo) { _, item in Task { await scanPhoto(item) } }
        .sheet(isPresented: $showMyQR) { MyQRView().presentationDetents([.large]) }
        .sensoryFeedback(.error, trigger: error)
    }

    private var viewfinder: some View {
        let side: CGFloat = 250
        return ZStack {
            CornerBrackets()
                .stroke(.white, style: StrokeStyle(lineWidth: 5, lineCap: .round, lineJoin: .round))
                .frame(width: side, height: side)
            Rectangle()
                .fill(LinearGradient(colors: [.clear, ZB.Palette.green.opacity(0.9), .clear], startPoint: .leading, endPoint: .trailing))
                .frame(width: side - 30, height: 2)
                .offset(y: scanLine ? side / 2 - 20 : -side / 2 + 20)
                .shadow(color: ZB.Palette.green, radius: 6)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) { scanLine = true }
        }
        .accessibilityHidden(true)
    }

    private var bottom: some View {
        VStack(spacing: ZB.Space.md) {
            Text(error ?? "Point at any UPI QR code")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(error == nil ? .white : Color(hex: 0xFF8A80))
                .multilineTextAlignment(.center)
                .contentTransition(.opacity)

            if !cameraAvailable {
                VStack(alignment: .leading, spacing: ZB.Space.xs) {
                    Text("No camera in Simulator · try a sample")
                        .font(.caption.weight(.semibold)).foregroundStyle(.white.opacity(0.6))
                    HStack(spacing: ZB.Space.xs) {
                        sample("Café · ₹340", "upi://pay?pa=bluetokai.koramangala@okhdfc&pn=Blue%20Tokai%20Coffee&am=340&tn=Cold%20brew")
                        sample("Riya", "upi://pay?pa=riya.sharma@okzen&pn=Riya%20Sharma")
                        sample("Not UPI", "https://example.com/promo")
                    }
                }
            }

            Button { showMyQR = true } label: {
                Label("Show my QR to receive", systemImage: "qrcode")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, ZB.Space.lg)
                    .frame(minHeight: 48)
            }
            .glassEffect(.clear.interactive(), in: .capsule)
        }
        .padding(ZB.Space.margin)
    }

    private func sample(_ title: String, _ payload: String) -> some View {
        Button(title) { handle(payload) }
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, ZB.Space.sm)
            .frame(minHeight: 36)
            .glassEffect(.clear.interactive(), in: .capsule)
    }

    private func handle(_ payload: String) {
        guard let link = UPILink(string: payload) else {
            withAnimation { error = "That isn't a UPI QR code. Try another one." }
            Analytics.track("scan_invalid")
            return
        }
        Haptics.success()
        Analytics.track("scan_ok", ["fixed_amount": "\(link.amount != nil)"])
        let payee = model.resolve(link: link)
        dismiss()
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(350))
            model.startPay(payee, amount: link.amount, note: link.note ?? "", locked: link.amount != nil, source: "scan")
        }
    }

    private func scanPhoto(_ item: PhotosPickerItem?) async {
        guard let item, let data = try? await item.loadTransferable(type: Data.self),
              let ci = CIImage(data: data) else { return }
        let detector = CIDetector(ofType: CIDetectorTypeQRCode, context: nil, options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])
        let message = (detector?.features(in: ci).first as? CIQRCodeFeature)?.messageString
        if let message { handle(message) } else { withAnimation { error = "No QR code found in that photo." } }
    }
}

private struct CornerBrackets: Shape {
    func path(in r: CGRect) -> Path {
        let l: CGFloat = 36, c: CGFloat = 18
        var p = Path()
        for (x, y, sx, sy) in [(r.minX, r.minY, 1.0, 1.0), (r.maxX, r.minY, -1.0, 1.0),
                               (r.minX, r.maxY, 1.0, -1.0), (r.maxX, r.maxY, -1.0, -1.0)] {
            p.move(to: CGPoint(x: x, y: y + sy * l))
            p.addLine(to: CGPoint(x: x, y: y + sy * c))
            p.addQuadCurve(to: CGPoint(x: x + sx * c, y: y), control: CGPoint(x: x, y: y))
            p.addLine(to: CGPoint(x: x + sx * l, y: y))
        }
        return p
    }
}

private struct QRScanner: UIViewControllerRepresentable {
    var onCode: (String) -> Void

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let vc = DataScannerViewController(recognizedDataTypes: [.barcode(symbologies: [.qr])],
                                           qualityLevel: .balanced, isHighlightingEnabled: false)
        vc.delegate = context.coordinator
        try? vc.startScanning()
        return vc
    }
    func updateUIViewController(_ vc: DataScannerViewController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(onCode: onCode) }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onCode: (String) -> Void
        private var fired = false
        init(onCode: @escaping (String) -> Void) { self.onCode = onCode }
        func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
            guard !fired else { return }
            for item in addedItems {
                if case .barcode(let b) = item, let s = b.payloadStringValue {
                    fired = true
                    onCode(s)
                    return
                }
            }
        }
    }
}
