import SwiftUI
import Charts

/// Zen AI – deliberately simple, and glitch-free:
/// • At rest: living orb, a time-aware greeting, three suggestions.
/// • Generating: the aurora breathes up behind everything; *inline* in the thread a large orb and
///   "● LOOKING THROUGH YOUR PAYMENTS" sit where the answer will appear. Nothing blurs or jumps.
/// • Answers stream as formatted text (no markdown re-flow), then the card and follow-ups fade in.
/// • Stop button while streaming; solid docked composer, legible in light and dark.
struct ZenAIView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var ai = ZenAI()
    @State private var input = ""
    @FocusState private var focused: Bool

    private let suggestions = [
        ("How much did I spend this month?", "chart.bar"),
        ("Split ₹1,200 with Arjun and Kabir", "person.2"),
        ("Anything unusual in my payments?", "checkmark.shield"),
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                ZB.Palette.canvas.ignoresSafeArea()
                ThinkingGlow(active: ai.thinking)

                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(alignment: .leading, spacing: ZB.Space.xl) {
                            if ai.messages.isEmpty {
                                intro.transition(.opacity.combined(with: .scale(scale: 0.98)))
                            } else {
                                thread.transition(.opacity)
                            }
                            Color.clear.frame(height: 1).id("bottom")
                        }
                        .padding(.horizontal, ZB.Space.margin)
                        .padding(.bottom, ZB.Space.lg)
                        .frame(maxWidth: 680)
                        .frame(maxWidth: .infinity)
                        .animation(.easeInOut(duration: 0.3), value: ai.messages.isEmpty)
                    }
                    .scrollDismissesKeyboard(.interactively)
                    .scrollEdgeEffectStyle(.hard, for: .top)
                    .defaultScrollAnchor(.bottom)
                    .onChange(of: ai.messages.count) { _, _ in
                        withAnimation(ZB.Motion.standard) { proxy.scrollTo("bottom", anchor: .bottom) }
                    }
                    .onChange(of: ai.thinking) { _, _ in
                        withAnimation(ZB.Motion.standard) { proxy.scrollTo("bottom", anchor: .bottom) }
                    }
                }
            }
            .navigationTitle(ai.messages.isEmpty ? "" : "Zen AI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { dismiss() } label: { Image(systemName: "xmark").font(.system(size: 15, weight: .semibold)) }
                        .accessibilityLabel("Close")
                }
                if !ai.messages.isEmpty {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("New chat", systemImage: "square.and.pencil") {
                            withAnimation(.easeInOut(duration: 0.3)) { ai.reset() }
                        }
                    }
                }
            }
            .safeAreaInset(edge: .bottom) { composer }

            #if DEBUG
            .task {
                if let q = UserDefaults.standard.string(forKey: "ZBPrompt"), ai.messages.isEmpty { submit(q) }
            }
            #endif
        }
    }

    // MARK: Intro

    private var greeting: String {
        let h = Calendar.current.component(.hour, from: .now)
        let part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
        return "\(part), \(model.profile.asContact.firstName)"
    }

    private var intro: some View {
        VStack(spacing: 0) {
            Spacer(minLength: ZB.Space.xxl)
            ZenbitIdleMark(size: 76)
                .padding(.bottom, 28)
            VStack(spacing: 10) {
                Text("Hi \(model.profile.asContact.firstName),\nwhat's on your mind?")
                    .font(.system(size: 32, weight: .semibold, design: .default))
                    .tracking(-0.4)
                    .foregroundStyle(ZB.Palette.ink)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Pay someone, split a bill, or ask about your spending.")
                    .font(.callout)
                    .foregroundStyle(ZB.Palette.inkSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.bottom, 36)
            VStack(spacing: 8) {
                ForEach(suggestions, id: \.0) { s in
                    SuggestionChip(text: s.0, symbol: s.1) { submit(s.0) }
                }
            }
            Label(ai.engineLabel, systemImage: "lock.fill")
                .font(.caption)
                .foregroundStyle(ZB.Palette.inkTertiary)
                .padding(.top, 28)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: Thread

    private var thread: some View {
        VStack(alignment: .leading, spacing: ZB.Space.lg) {
            ForEach($ai.messages) { $m in
                Group {
                    if m.role == .user {
                        HStack {
                            Spacer(minLength: 60)
                            Text(m.text)
                                .foregroundStyle(ZB.Palette.canvas)
                                .padding(.horizontal, ZB.Space.md)
                                .padding(.vertical, ZB.Space.sm)
                                .background(ZB.Palette.ink, in: .rect(cornerRadius: 22, style: .continuous))
                        }
                        .transition(.asymmetric(insertion: .move(edge: .bottom).combined(with: .opacity), removal: .opacity))
                    } else {
                        AnswerView(message: $m, isLast: m.id == ai.messages.last?.id) { submit($0) }
                            .transition(.opacity)
                    }
                }
                .id(m.id)
            }
            if ai.thinking {
                ThinkingRow(status: ai.status)
                    .transition(.asymmetric(insertion: .opacity.combined(with: .scale(scale: 0.9, anchor: .leading)),
                                            removal: .opacity))
            }
        }
        .padding(.top, ZB.Space.md)
    }

    // MARK: Docked composer

    private var composer: some View {
        HStack(spacing: ZB.Space.xs) {
            TextField("", text: $input,
                      prompt: Text("Message Zen AI…").foregroundStyle(ZB.Palette.inkSecondary),
                      axis: .vertical)
                .font(.body)
                .foregroundStyle(ZB.Palette.ink)
                .tint(ZB.Palette.ink)
                .lineLimit(1...4)
                .focused($focused)
                .submitLabel(.send)
                .onSubmit { submit(input) }
                .padding(.leading, ZB.Space.lg)
                .padding(.vertical, 14)
            Button {
                if ai.isStreaming { ai.stop() } else { submit(input) }
            } label: {
                Image(systemName: ai.isStreaming ? "stop.fill" : "arrow.up")
                    .font(.system(size: ai.isStreaming ? 13 : 16, weight: .bold))
                    .foregroundStyle(canSend || ai.isStreaming ? ZB.Palette.canvas : ZB.Palette.inkTertiary)
                    .frame(width: 40, height: 40)
                    .background(canSend || ai.isStreaming ? ZB.Palette.ink : ZB.Palette.surface, in: .circle)
                    .contentTransition(.symbolEffect(.replace))
            }
            .disabled(!canSend && !ai.isStreaming)
            .padding(.trailing, 6)
            .accessibilityLabel(ai.isStreaming ? "Stop" : "Send")
        }
        .glassEffect(.regular.interactive(), in: .capsule)
        .background { PillSparkles().padding(-14) }
        .shadow(color: .black.opacity(0.07), radius: 16, y: 6)
        .padding(.horizontal, ZB.Space.md)
        .padding(.bottom, ZB.Space.xs)
        .animation(ZB.Motion.snappy, value: focused)
        .animation(ZB.Motion.snappy, value: ai.isStreaming)
    }

    private var canSend: Bool { !input.trimmingCharacters(in: .whitespaces).isEmpty && !ai.thinking }

    private func submit(_ text: String) {
        guard !ai.thinking else { return }
        let t = text
        input = ""
        focused = false
        Haptics.tap()
        Task { await ai.send(t, model: model) }
    }
}

// MARK: - Pieces

private struct SuggestionChip: View {
    let text: String
    let symbol: String
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: symbol).font(.subheadline).foregroundStyle(ZB.Palette.inkTertiary).frame(width: 22)
                Text(text).font(.body).foregroundStyle(ZB.Palette.ink)
                Spacer(minLength: 0)
                Image(systemName: "arrow.up.right").font(.caption.weight(.semibold)).foregroundStyle(ZB.Palette.inkTertiary)
            }
            .padding(.horizontal, ZB.Space.md)
            .frame(minHeight: 52)
            .background(ZB.Palette.surface, in: .rect(cornerRadius: 18, style: .continuous))
            .contentShape(.rect)
        }
        .zbPressable()
    }
}

/// Inline "generating" state: big living orb + mono status + shimmering placeholder lines.
private struct ThinkingRow: View {
    let status: String
    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            ZenbitThinkingMark(size: 34)
            VStack(alignment: .leading, spacing: 10) {
                WorkingText(text: status.prefix(1).uppercased() + status.dropFirst().lowercased())
                    .padding(.top, 6)
                ShimmerLine(width: 220)
                ShimmerLine(width: 160)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Zen AI is working")
    }
}

private struct ShimmerLine: View {
    let width: CGFloat
    var body: some View {
        TimelineView(.animation) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 1.4) / 1.4
            Capsule()
                .fill(ZB.Palette.surface)
                .overlay {
                    LinearGradient(colors: [.clear, ZB.Palette.ink.opacity(0.08), .clear], startPoint: .leading, endPoint: .trailing)
                        .frame(width: 90)
                        .offset(x: CGFloat(t) * (width + 90) - (width + 90) / 2)
                }
                .clipShape(.capsule)
                .frame(width: width, height: 12)
        }
    }
}

private struct AnswerView: View {
    @Binding var message: AIMessage
    let isLast: Bool
    var onFollowUp: (String) -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZenbitMark(size: 26, depth: 0.3, dark: true).padding(.top, 2)
            VStack(alignment: .leading, spacing: ZB.Space.sm) {
                Text(message.visible)
                    .foregroundStyle(ZB.Palette.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)

                if !message.isTyping {
                    Group {
                        if let card = message.card { CardView(card: card) }
                        HStack(spacing: ZB.Space.md) {
                            feedback(true)
                            feedback(false)
                            Spacer()
                            Text("Double-check before you pay").font(.caption2).foregroundStyle(ZB.Palette.inkTertiary)
                        }
                        if isLast && !message.followUps.isEmpty {
                            ScrollView(.horizontal) {
                                HStack(spacing: ZB.Space.xs) {
                                    ForEach(message.followUps, id: \.self) { f in
                                        Button { onFollowUp(f) } label: {
                                            Text(f).font(.subheadline.weight(.medium)).foregroundStyle(ZB.Palette.ink)
                                                .padding(.horizontal, 14).frame(minHeight: 38)
                                                .overlay(Capsule().strokeBorder(ZB.Palette.hairline, lineWidth: 1.5))
                                        }
                                        .zbPressable()
                                    }
                                }
                            }
                            .scrollIndicators(.hidden)
                            .scrollClipDisabled()
                        }
                    }
                    .transition(.opacity.combined(with: .offset(y: 8)))
                }
            }
        }
        .animation(ZB.Motion.standard, value: message.isTyping)
    }

    private func feedback(_ positive: Bool) -> some View {
        let on = message.feedback == positive
        return Button {
            message.feedback = on ? nil : positive
            Analytics.track("ai_feedback", ["positive": "\(positive)"])
        } label: {
            Image(systemName: positive ? (on ? "hand.thumbsup.fill" : "hand.thumbsup") : (on ? "hand.thumbsdown.fill" : "hand.thumbsdown"))
                .font(.footnote)
                .foregroundStyle(on ? ZB.Palette.ink : ZB.Palette.inkTertiary)
                .frame(width: 32, height: 32)
        }
        .accessibilityLabel(positive ? "Helpful" : "Not helpful")
    }
}

// MARK: - Cards

private struct CardView: View {
    @Environment(AppModel.self) private var model
    let card: AICard

    var body: some View {
        switch card {
        case .payment(let c, let amount, let note, let mode):
            VStack(alignment: .leading, spacing: ZB.Space.md) {
                HStack(spacing: ZB.Space.sm) {
                    AvatarView(contact: c, size: 44)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(mode == .pay ? "Pay" : "Request from") \(c.name)").font(.headline).lineLimit(1)
                        Text(c.upiID).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary).lineLimit(1)
                    }
                    Spacer()
                    Text(amount.map { Money.format($0) } ?? "—").font(.zbAmount).monospacedDigit()
                }
                if !note.isEmpty {
                    Label(note, systemImage: "text.bubble").font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                }
                Button(mode == .pay ? "Review & pay" : "Review request") {
                    model.startPay(c, amount: amount, note: note, mode: mode, source: "ai")
                }
                .buttonStyle(.zbInk)
            }
            .padding(ZB.Space.md)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)

        case .split(let people, let share, let note):
            VStack(alignment: .leading, spacing: ZB.Space.md) {
                ForEach(people) { p in
                    HStack(spacing: ZB.Space.sm) {
                        AvatarView(contact: p, size: 36)
                        Text(p.name).font(.body.weight(.medium))
                        Spacer()
                        Text(Money.format(share)).font(.zbAmountRow).monospacedDigit()
                    }
                }
                Button("Send \(people.count) request\(people.count == 1 ? "" : "s")") {
                    for p in people { model.recordRequest(to: p, amount: share, note: note.isEmpty ? "Split" : note) }
                    model.showToast("Requested \(Money.format(share)) from \(people.count) people", symbol: "person.3.fill")
                }
                .buttonStyle(.zbInk)
            }
            .padding(ZB.Space.md)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)

        case .spending(let title, let total, let rows):
            SpendingCard(title: title, total: total, rows: rows)

        case .safety(let items):
            VStack(alignment: .leading, spacing: ZB.Space.sm) {
                ForEach(items, id: \.self) { item in
                    Label { Text(LocalizedStringKey(item)) } icon: {
                        Image(systemName: "exclamationmark.shield.fill").foregroundStyle(ZB.Palette.warning)
                    }
                    .font(.subheadline)
                }
            }
            .padding(ZB.Space.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
        }
    }
}

/// Category breakdown: a label and amount row above each bar (no overlap), the top category in ink, the rest in grey.
struct SpendingCard: View {
    let title: String
    let total: Decimal
    let rows: [(TxCategory, Decimal)]
    @State private var appeared = false

    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.md) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.medium)).foregroundStyle(ZB.Palette.inkSecondary)
                Text(Money.format(total)).font(.zbAmount).monospacedDigit()
            }
            if rows.isEmpty {
                Text("No payments yet.").font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
            } else {
                let top = rows.prefix(5)
                let maxValue = max(top.map { $0.1.doubleValue }.max() ?? 1, 1)
                VStack(spacing: 14) {
                    ForEach(Array(top.enumerated()), id: \.offset) { i, row in
                        VStack(alignment: .leading, spacing: 7) {
                            HStack(alignment: .firstTextBaseline) {
                                Text(row.0.title).font(.subheadline.weight(.medium)).foregroundStyle(ZB.Palette.ink)
                                Spacer(minLength: 8)
                                Text(Money.compact(row.1)).font(.subheadline.weight(.semibold)).monospacedDigit().foregroundStyle(ZB.Palette.ink)
                            }
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(ZB.Palette.ink.opacity(0.07))
                                    Capsule().fill(i == 0 ? ZB.Palette.ink : ZB.Palette.inkTertiary.opacity(0.55))
                                        .frame(width: appeared ? max(10, geo.size.width * CGFloat(row.1.doubleValue / maxValue)) : 10)
                                        .animation(.spring(response: 0.8, dampingFraction: 0.85).delay(0.1 + Double(i) * 0.06), value: appeared)
                                }
                            }
                            .frame(height: 8)
                        }
                    }
                }
            }
        }
        .padding(ZB.Space.md)
        .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
        .accessibilityElement(children: .combine)
        .onAppear { withAnimation(.spring(response: 0.8, dampingFraction: 0.85).delay(0.1)) { appeared = true } }
    }
}

#Preview { ZenAIView().environment(AppModel()) }
