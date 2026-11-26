import SwiftUI
import UIKit
import os
import CoreImage.CIFilterBuiltins

// MARK: - Haptics (imperative; views prefer `.sensoryFeedback`)

enum Haptics {
    static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
    static func error() { UINotificationFeedbackGenerator().notificationOccurred(.error) }
    static func warning() { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
    static func tap() { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func soft() { UIImpactFeedbackGenerator(style: .soft).impactOccurred(intensity: 0.7) }
}

// MARK: - Analytics (funnel events → os_log; swap for a real SDK later)

enum Analytics {
    private static let log = Logger(subsystem: "com.abrockyt.zenbitpay", category: "analytics")
    static func track(_ event: String, _ props: [String: String] = [:]) {
        let p = props.map { "\($0)=\($1)" }.sorted().joined(separator: " ")
        log.info("📈 \(event, privacy: .public) \(p, privacy: .public)")
    }
}

// MARK: - Clipboard with feedback

enum Clipboard {
    @MainActor static func copy(_ text: String, label: String, model: AppModel) {
        UIPasteboard.general.string = text
        Haptics.tap()
        model.showToast("\(label) copied", symbol: "doc.on.doc.fill")
        Analytics.track("copy", ["field": label])
    }
}

// MARK: - QR generation

enum QRCode {
    static func image(for string: String, scale: CGFloat = 12) -> UIImage {
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        filter.correctionLevel = "M"
        let context = CIContext()
        guard let output = filter.outputImage?.transformed(by: .init(scaleX: scale, y: scale)),
              let cg = context.createCGImage(output, from: output.extent) else { return UIImage() }
        return UIImage(cgImage: cg)
    }
}

// MARK: - Toast

struct Toast: Identifiable, Equatable {
    let id = UUID()
    var message: String
    var symbol: String
}

struct ToastView: View {
    let toast: Toast
    var body: some View {
        Label(toast.message, systemImage: toast.symbol)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(ZB.Palette.ink)
            .padding(.horizontal, ZB.Space.lg)
            .padding(.vertical, ZB.Space.sm)
            .glassEffect(.regular, in: .capsule)
            .accessibilityAddTraits(.isStaticText)
    }
}

// MARK: - Date helpers

extension Date {
    var zbRelativeDay: String {
        let cal = Calendar.current
        if cal.isDateInToday(self) { return "Today" }
        if cal.isDateInYesterday(self) { return "Yesterday" }
        return formatted(.dateTime.weekday(.wide).day().month(.abbreviated))
    }
    var zbTime: String { formatted(date: .omitted, time: .shortened) }
}

// MARK: - Greeting

enum Greeting {
    static var now: String {
        switch Calendar.current.component(.hour, from: Date()) {
        case 5..<12: "Good morning"
        case 12..<17: "Good afternoon"
        default: "Good evening"
        }
    }
}
