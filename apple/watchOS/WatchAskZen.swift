import SwiftUI
import WatchKit

/// Ask Zen on the wrist – the same monochrome generative-AI language as the phone:
/// your Z breathes and sheens at rest; while "thinking" it loops its sheen, a soft grey glow breathes behind it and the status
/// line shimmers; then the answer types in. Questions are answered from the snapshot the iPhone sent (nothing leaves the watch).
struct WatchAskZen: View {
    @Environment(WatchModel.self) private var model
    @State private var question: String?
    @State private var thinking = false
    @State private var answer = ""
    @State private var shown = ""
    @State private var statusIndex = 0

    private let suggestions = [("Spent this month?", "chart.bar"), ("Last payment?", "clock"), ("Anything unusual?", "checkmark.shield")]
    private let statuses = ["Looking through your payments", "Adding things up", "Checking for anything odd"]

    var body: some View {
        ZStack {
            FluidGradient()
            ScrollView {
                VStack(spacing: 10) {
                    header
                    if thinking { thinkingView.transition(.asymmetric(insertion: .opacity.combined(with: .scale(scale: 0.96)), removal: .identity)) }
                    else if question != nil { answerView.transition(.asymmetric(insertion: .opacity.combined(with: .move(edge: .bottom)), removal: .identity)) }
                    else { suggestionList.transition(.asymmetric(insertion: .opacity, removal: .identity)) }
                }
                .padding(.horizontal, 4)
            }
            .scrollIndicators(.hidden)
        }
        .containerBackground(for: .navigation) { FluidGradient() }
        .navigationTitle("Ask Zen")
        #if DEBUG
        .task {
            if let q = UserDefaults.standard.string(forKey: "ZBWatchAsk"), question == nil {
                try? await Task.sleep(for: .seconds(1.5))
                ask(q)
            }
        }
        #endif
        .animation(.spring(response: 0.5, dampingFraction: 0.85), value: thinking)
        .animation(.spring(response: 0.5, dampingFraction: 0.85), value: question)
    }

    private var header: some View {
        ZStack {
            if thinking {
                GlowBreath().frame(width: 120, height: 120).transition(.asymmetric(insertion: .opacity, removal: .identity))
                ZenbitThinkingMark(size: 46, dark: false).transition(.asymmetric(insertion: .opacity, removal: .identity))
            } else {
                ZenbitIdleMark(size: 46, dark: false).transition(.asymmetric(insertion: .opacity, removal: .identity))
            }
        }
        .frame(height: thinking ? 76 : 56)
    }

    private var suggestionList: some View {
        VStack(spacing: 6) {
            Text("What would you like to know?").font(.system(.footnote, design: .rounded).weight(.semibold)).foregroundStyle(W.onPage).multilineTextAlignment(.center)
            ForEach(suggestions, id: \.0) { s in
                Button { ask(s.0) } label: { PillRow(title: s.0, symbol: s.1) }.buttonStyle(.plain)
            }
        }
    }

    private var thinkingView: some View {
        VStack(spacing: 8) {
            if let question { Text(question).font(.system(.caption2, design: .rounded).weight(.medium)).foregroundStyle(W.onPage2) }
            WatchWorkingText(text: statuses[statusIndex % statuses.count])
            VStack(spacing: 5) { shimmerLine(110); shimmerLine(78) }
        }
    }

    private var answerView: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let question { Text(question).font(.system(.caption2, design: .rounded).weight(.medium)).foregroundStyle(W.onPage2) }
            Text(shown)
                .font(.system(.footnote, design: .rounded).weight(.semibold)).foregroundStyle(W.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(.white, in: .rect(cornerRadius: 20, style: .continuous))
            Button { question = nil; shown = "" } label: { PillRow(title: "Ask another", symbol: "arrow.counterclockwise") }.buttonStyle(.plain)
        }
    }

    private func shimmerLine(_ w: CGFloat) -> some View {
        TimelineView(.animation) { ctx in
            let p = (ctx.date.timeIntervalSinceReferenceDate * 0.9).truncatingRemainder(dividingBy: 1)
            Capsule().fill(Color.white.opacity(0.14)).frame(width: w, height: 8)
                .overlay {
                    GeometryReader { g in
                        LinearGradient(colors: [.clear, .white.opacity(0.55), .clear], startPoint: .leading, endPoint: .trailing)
                            .frame(width: g.size.width * 0.5).offset(x: CGFloat(p * 1.8 - 0.6) * g.size.width)
                    }.clipShape(Capsule())
                }
        }
    }

    // MARK: Logic

    private func ask(_ q: String) {
        question = q; thinking = true; shown = ""; statusIndex = 0
        WKInterfaceDevice.current().play(.click)
        Task {
            for i in 1...3 {
                try? await Task.sleep(for: .milliseconds(650))
                if i < 3 { statusIndex = i }
            }
            answer = compute(q)
            thinking = false
            WKInterfaceDevice.current().play(.success)
            for ch in answer {                                    // type the answer in
                shown.append(ch)
                try? await Task.sleep(for: .milliseconds(22))
            }
        }
    }

    private func compute(_ q: String) -> String {
        let sent = model.txs.filter { !$0.received && $0.status == "success" }
        if q.hasPrefix("Spent") {
            let total = sent.reduce(0.0) { $0 + $1.amount }
            return "You spent \(Money.format(Decimal(total))) across your last \(sent.count) payments."
        }
        if q.hasPrefix("Last") {
            guard let t = model.txs.first else { return "No payments yet." }
            return "\(t.received ? "Received" : "Paid") \(Money.format(Decimal(t.amount))) \(t.received ? "from" : "to") \(t.name.split(separator: " ").first.map(String.init) ?? t.name), \(t.date.formatted(.relative(presentation: .named)))."
        }
        let odd = model.txs.filter { $0.status != "success" }
        return odd.isEmpty ? "Nothing unusual. All recent payments look normal."
                           : "\(odd.count) payment\(odd.count == 1 ? "" : "s") didn't go through. Check your iPhone for details."
    }
}

/// Soft grey light that breathes behind the thinking mark.
private struct GlowBreath: View {
    var body: some View {
        TimelineView(.animation) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate
            ZStack {
                Circle().fill(Color.white.opacity(0.16)).blur(radius: 16).scaleEffect(0.8 + 0.12 * sin(t * 2.2))
                Circle().fill(Color(hex: 0x8B8FA8).opacity(0.38)).blur(radius: 12).scaleEffect(0.6 + 0.1 * sin(t * 2.9 + 1))
            }
        }
    }
}

/// Status text with a light sweep.
private struct WatchWorkingText: View {
    let text: String
    var body: some View {
        TimelineView(.animation) { ctx in
            let p = (ctx.date.timeIntervalSinceReferenceDate * 0.75).truncatingRemainder(dividingBy: 1)
            Text(text).font(.system(.caption, design: .rounded).weight(.medium)).foregroundStyle(W.onPage2.opacity(0.75)).multilineTextAlignment(.center)
                .overlay {
                    GeometryReader { g in
                        Text(text).font(.system(.caption, design: .rounded).weight(.medium)).foregroundStyle(W.onPage).multilineTextAlignment(.center)
                            .frame(width: g.size.width, height: g.size.height)
                            .mask {
                                LinearGradient(colors: [.clear, .black, .clear], startPoint: .leading, endPoint: .trailing)
                                    .frame(width: g.size.width * 0.5).offset(x: CGFloat(p * 1.8 - 0.65) * g.size.width)
                                    .frame(width: g.size.width, alignment: .leading)
                            }
                    }
                }
        }
    }
}
