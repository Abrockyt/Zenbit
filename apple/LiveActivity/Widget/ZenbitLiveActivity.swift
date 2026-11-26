import ActivityKit
import SwiftUI
import WidgetKit


struct PaymentLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PaymentAttributes.self) { ctx in
            LockScreenView(ctx: ctx)
                .activityBackgroundTint(Color.black.opacity(0.85))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Initials(text: ctx.attributes.payeeInitials, size: 44)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(ctx.state.amountText).font(.title3.weight(.semibold)).monospacedDigit()
                        StatusGlyph(status: ctx.state.status)
                    }
                    .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 1) {
                        Text(title(ctx.state.status)).font(.caption).foregroundStyle(.secondary)
                        Text(ctx.attributes.payeeName).font(.headline).lineLimit(1)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if ctx.state.status == "sending" {
                        ProgressView(timerInterval: Date()...Date().addingTimeInterval(3), countsDown: false)
                            .progressViewStyle(.linear).tint(.white).labelsHidden()
                    } else if !ctx.state.ref.isEmpty {
                        Text("UPI Ref \(ctx.state.ref)").font(.caption2.monospaced()).foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Initials(text: ctx.attributes.payeeInitials, size: 24)
            } compactTrailing: {
                HStack(spacing: 4) {
                    Text(ctx.state.amountText).font(.caption.weight(.semibold)).monospacedDigit()
                    StatusGlyph(status: ctx.state.status, small: true)
                }
            } minimal: {
                StatusGlyph(status: ctx.state.status, small: true)
            }
            .keylineTint(.white)
        }
    }

    private func title(_ s: String) -> String {
        switch s {
        case "paid": "Paid"
        case "failed": "Payment failed"
        case "processing": "Waiting for bank"
        default: "Paying"
        }
    }
}

private struct LockScreenView: View {
    let ctx: ActivityViewContext<PaymentAttributes>
    var body: some View {
        HStack(spacing: 12) {
            Initials(text: ctx.attributes.payeeInitials, size: 44)
            VStack(alignment: .leading, spacing: 2) {
                Text(ctx.state.status == "paid" ? "Paid \(ctx.attributes.payeeName)" : "Paying \(ctx.attributes.payeeName)")
                    .font(.headline)
                Text(ctx.attributes.payeeUPI).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(ctx.state.amountText).font(.title3.weight(.semibold)).monospacedDigit()
                StatusGlyph(status: ctx.state.status)
            }
        }
        .foregroundStyle(.white)
        .padding(16)
    }
}

private struct Initials: View {
    let text: String
    let size: CGFloat
    var body: some View {
        Text(text)
            .font(.system(size: size * 0.38, weight: .semibold, design: .rounded))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(Circle().fill(LinearGradient(colors: [Color(red: 0.95, green: 0.45, blue: 0.62), Color(red: 0.78, green: 0.3, blue: 0.5)],
                                                     startPoint: .top, endPoint: .bottom)))
    }
}

private struct StatusGlyph: View {
    let status: String
    var small = false
    var body: some View {
        Group {
            switch status {
            case "paid": Image(systemName: "checkmark.circle.fill").foregroundStyle(.white)
            case "failed": Image(systemName: "xmark.circle.fill").foregroundStyle(.red)
            case "processing": Image(systemName: "clock.fill").foregroundStyle(.orange)
            default: ProgressView().tint(.white).scaleEffect(small ? 0.6 : 0.8)
            }
        }
        .font(small ? .caption : .body)
    }
}
