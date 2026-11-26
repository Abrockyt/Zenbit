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
                // One row under the sensor: face, then who + how much, then the result.
                DynamicIslandExpandedRegion(.bottom) {
                    PaymentRow(ctx: ctx, caption: caption(ctx))
                        .padding(.horizontal, 6)
                        .padding(.bottom, 6)
                }
            } compactLeading: {
                Portrait(attributes: ctx.attributes, size: 24)
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

    private func caption(_ ctx: ActivityViewContext<PaymentAttributes>) -> String {
        paymentCaption(ctx)
    }
}

private func paymentCaption(_ ctx: ActivityViewContext<PaymentAttributes>) -> String {
    switch ctx.state.status {
    case "paid": "Sent to \(ctx.attributes.payeeName)"
    case "failed": "Payment failed"
    case "processing": "Waiting for bank"
    default: "Sending to \(ctx.attributes.payeeName)"
    }
}

private struct PaymentRow: View {
    let ctx: ActivityViewContext<PaymentAttributes>
    let caption: String
    var body: some View {
        HStack(spacing: 14) {
            Portrait(attributes: ctx.attributes, size: 58)
            VStack(alignment: .leading, spacing: 1) {
                Text(caption).font(.subheadline.weight(.medium)).foregroundStyle(.white.opacity(0.7)).lineLimit(1)
                Text(ctx.state.amountText)
                    .font(.system(size: 30, weight: .bold, design: .rounded)).monospacedDigit()
                    .foregroundStyle(.white).lineLimit(1).minimumScaleFactor(0.6)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            StatusGlyph(status: ctx.state.status, size: 40)
        }
    }
}

private struct LockScreenView: View {
    let ctx: ActivityViewContext<PaymentAttributes>
    var body: some View {
        PaymentRow(ctx: ctx, caption: paymentCaption(ctx))
            .padding(16)
    }
}

private struct Portrait: View {
    let attributes: PaymentAttributes
    let size: CGFloat
    var body: some View {
        if let photo = attributes.payeePhoto {
            Image(photo).resizable().widgetAccentedRenderingMode(.fullColor).scaledToFill()
                .frame(width: size, height: size).clipShape(.circle)
        } else {
            Initials(text: attributes.payeeInitials, size: size)
        }
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
    var size: CGFloat?
    private var side: CGFloat { size ?? (small ? 15 : 20) }
    var body: some View {
        Group {
            switch status {
            case "paid": disc("checkmark.circle.fill", .white, Color(red: 0, green: 0.77, blue: 0.42))
            case "failed": disc("xmark.circle.fill", .white, .red)
            case "processing": disc("clock.fill", .orange, .orange)
            default: ProgressView().tint(.white).scaleEffect(small ? 0.6 : 1)
            }
        }
        .frame(width: side, height: side)
    }

    private func disc(_ symbol: String, _ mark: Color, _ fill: Color) -> some View {
        Image(systemName: symbol)
            .resizable().scaledToFit()
            .symbolRenderingMode(symbol == "clock.fill" ? .monochrome : .palette)
            .foregroundStyle(mark, fill)
    }
}
