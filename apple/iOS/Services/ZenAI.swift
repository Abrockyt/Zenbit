import SwiftUI
import Observation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Structured command parsed from natural language.
struct AICommand {
    enum Intent: String { case pay, request, split, spending, safety, help }
    var intent: Intent
    var people: [String]
    var amount: Decimal?
    var note: String
}

enum AICard {
    case payment(Contact, Decimal?, String, FlowMode)
    case split([Contact], Decimal, String)
    case spending(title: String, total: Decimal, byCategory: [(TxCategory, Decimal)])
    case safety([String])
}

struct AIMessage: Identifiable {
    enum Role { case user, assistant }
    let id = UUID()
    var role: Role
    var text: String
    var card: AICard? = nil
    var feedback: Bool? = nil
    /// Suggested next questions shown after the answer (Cloudscape "follow-up" pattern).
    var followUps: [String] = []
    /// Characters revealed so far – streaming reveals the *formatted* text, so nothing reflows.
    var shownChars: Int = .max

    var rich: AttributedString {
        (try? AttributedString(markdown: text, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)))
            ?? AttributedString(text)
    }
    /// The whole answer is laid out from the first frame (so nothing reflows); characters past the
    /// cursor are transparent, with a 12-character soft tail – text *materialises* rather than types.
    var visible: AttributedString {
        var full = rich
        let n = full.characters.count
        guard shownChars < n else { return full }
        var i = full.startIndex
        var k = 0
        while i < full.endIndex {
            let next = full.characters.index(after: i)
            if k >= shownChars {
                let d = k - shownChars
                if d < 12 {
                    full[i..<next].foregroundColor = ZB.Palette.ink.opacity(1 - Double(d) / 12)
                } else {
                    full[i..<full.endIndex].foregroundColor = .clear
                    break
                }
            }
            i = next
            k += 1
        }
        return full
    }
    var isTyping: Bool { shownChars < rich.characters.count }
}

/// Zen AI. Design rules (Apple HIG – Generative AI; voice guide in DESIGN.md §14):
/// • The model only *parses intent*; all numbers are computed from real transactions → no hallucinated money.
/// • It drafts, people confirm: every payment goes through the normal amount + UPI PIN flow.
/// • Voice: answer first, warm, contractions, precise ₹, one human touch, always a clear next step.
/// • On-device (Foundation Models) when Apple Intelligence is on; deterministic fallback otherwise.
@Observable
final class ZenAI {
    var messages: [AIMessage] = []
    var thinking = false
    var status = "THINKING"
    private var streamTask: Task<Void, Never>?

    var engineLabel: String {
        #if canImport(FoundationModels)
        if SystemLanguageModel.default.isAvailable { return "Private · runs on your iPhone" }
        #endif
        return "Private · runs on your iPhone"
    }

    var isStreaming: Bool { messages.last?.isTyping ?? false }

    func stop() {
        streamTask?.cancel()
        if let i = messages.indices.last { messages[i].shownChars = .max }
    }

    func reset() {
        stop()
        messages.removeAll()
        thinking = false
    }

    func send(_ text: String, model: AppModel) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !thinking else { return }
        stop()
        withAnimation(ZB.Motion.standard) { messages.append(AIMessage(role: .user, text: trimmed)) }
        let lower = trimmed.lowercased()
        status = ["spend", "spent", "month", "week", "budget", "save", "compare"].contains(where: lower.contains) ? "LOOKING THROUGH YOUR PAYMENTS"
            : ["pay", "send", "request", "split"].contains(where: lower.contains) ? "GETTING IT READY"
            : ["scam", "unusual", "safe", "fraud", "block"].contains(where: lower.contains) ? "CHECKING FOR ANYTHING ODD" : "THINKING"
        withAnimation(.easeInOut(duration: 0.35)) { thinking = true }
        Analytics.track("ai_prompt")
        let started = Date()
        let command = await parse(trimmed, contacts: model.contacts)
        var reply = respond(to: command, raw: trimmed, model: model)
        // Hold the generating state long enough to read as a moment, not a flicker.
        let wait = max(0, 1.3 - Date().timeIntervalSince(started))
        try? await Task.sleep(for: .seconds(wait))
        reply.shownChars = 0
        // Hand-off without overlap: thinking row leaves first, then the answer takes its place.
        withAnimation(.easeOut(duration: 0.18)) { thinking = false }
        try? await Task.sleep(for: .milliseconds(190))
        withAnimation(.easeOut(duration: 0.25)) { messages.append(reply) }
        // Stream: a few characters per frame-ish tick (~45 chars/s feels like reading speed, not a typewriter).
        guard let idx = messages.indices.last else { return }
        let total = messages[idx].rich.characters.count
        streamTask = Task { @MainActor in
            var k = 0
            while k < total, !Task.isCancelled {
                try? await Task.sleep(for: .milliseconds(22))
                k = min(total, k + 2)
                guard messages.indices.contains(idx) else { return }
                messages[idx].shownChars = k
            }
            guard messages.indices.contains(idx) else { return }
            withAnimation(ZB.Motion.standard) { messages[idx].shownChars = .max }
        }
    }

    // MARK: Parsing

    private func parse(_ text: String, contacts: [Contact]) async -> AICommand {
        let lower = text.lowercased()
        // Small talk and comparisons are handled locally – fast and predictable.
        if ["thank", "thanks", "hi", "hello", "hey"].contains(where: { lower.hasPrefix($0) }) || lower.contains("compare") || lower.contains("save") {
            return RuleParser.parse(text, contacts: contacts)
        }
        #if canImport(FoundationModels)
        if SystemLanguageModel.default.isAvailable, let c = try? await OnDeviceParser.parse(text) {
            return AICommand(intent: AICommand.Intent(rawValue: c.intent.lowercased()) ?? .help,
                             people: c.people, amount: c.amount > 0 ? Decimal(c.amount) : RuleParser.amount(in: text),
                             note: c.note)
        }
        #endif
        return RuleParser.parse(text, contacts: contacts)
    }

    // MARK: Responding (deterministic, grounded in data, written in Zen's voice)

    private func respond(to c: AICommand, raw: String, model: AppModel) -> AIMessage {
        let lower = raw.lowercased()
        let people = c.people.compactMap { name in
            model.contacts.first { $0.firstName.lowercased() == name.lowercased() || $0.name.lowercased() == name.lowercased() }
        }
        switch c.intent {
        case .pay, .request:
            guard let who = people.first else {
                return AIMessage(role: .assistant,
                                 text: "Sure – who's it for? Just say something like “Pay Riya ₹250 for lunch”.",
                                 followUps: ["Pay Riya ₹250 for lunch", "Request ₹500 from Kabir"])
            }
            guard who.isOnUPI else {
                return AIMessage(role: .assistant,
                                 text: "Looks like \(who.firstName) isn't on UPI yet, so I can't send money to them. Want to invite them? They'll get ₹21 when they join.",
                                 followUps: ["How do invites work?"])
            }
            let amountText = c.amount.map { " " + Money.format($0) } ?? ""
            let what = c.note.isEmpty ? "" : " for \(c.note.lowercased())"
            let text = c.intent == .pay
                ? "Done – here's\(amountText) to **\(who.firstName)**\(what). Have a look and tap Review & pay when you're ready. Nothing moves until you confirm."
                : "Got it – here's a request\(amountText.isEmpty ? "" : " for" + amountText) from **\(who.firstName)**\(what). They'll get a notification to approve it."
            return AIMessage(role: .assistant, text: text,
                             card: .payment(who, c.amount, c.note, c.intent == .pay ? .pay : .request),
                             followUps: c.intent == .pay ? ["Split it with Arjun instead", "How much have I paid \(who.firstName) this month?"] : [])
        case .split:
            guard let total = c.amount, !people.isEmpty else {
                return AIMessage(role: .assistant,
                                 text: "Happy to split it. Tell me the total and who's in – for example “Split ₹1,200 with Arjun and Kabir”.",
                                 followUps: ["Split ₹1,200 with Arjun and Kabir"])
            }
            let share = (total / Decimal(people.count + 1)).rounded(2)
            let names = ListFormatter.localizedString(byJoining: people.map(\.firstName))
            return AIMessage(role: .assistant,
                             text: "\(Money.format(total)) between you and \(names) comes to **\(Money.format(share)) each**. I can send them a request now – they'll see what it's for.",
                             card: .split(people, share, c.note))
        case .spending:
            if lower.contains("save") { return saving(model: model) }
            return spending(raw: raw, model: model)
        case .safety:
            return safety(model: model)
        case .help:
            if ["thank"].contains(where: lower.contains) {
                return AIMessage(role: .assistant, text: "Anytime! I'm here whenever you need a hand with money.")
            }
            if ["hi", "hello", "hey"].contains(where: { lower.hasPrefix($0) }) {
                return AIMessage(role: .assistant, text: "Hey \(model.profile.asContact.firstName)! What can I help with – a payment, a split, or a look at your spending?",
                                 followUps: ["How much did I spend this month?", "Split ₹1,200 with Arjun and Kabir"])
            }
            return AIMessage(role: .assistant,
                             text: "I didn't quite catch that. I can pay or request money, split a bill, break down your spending, or check anything that looks off.",
                             followUps: ["How much did I spend this month?", "Anything unusual in my payments?"])
        }
    }

    private func total(_ model: AppModel, _ include: (Date) -> Bool) -> (Decimal, [TxCategory: Decimal], Int) {
        let txs = model.transactions.filter { $0.direction == .sent && $0.status == .success && include($0.date) }
        var by: [TxCategory: Decimal] = [:]
        for t in txs { by[t.category, default: 0] += t.amount }
        return (txs.reduce(0) { $0 + $1.amount }, by, txs.count)
    }

    private func spending(raw: String, model: AppModel) -> AIMessage {
        let lower = raw.lowercased()
        let cal = Calendar.current
        let lastMonth = cal.date(byAdding: .month, value: -1, to: .now)!
        let (title, range): (String, (Date) -> Bool) = {
            if lower.contains("today") { return ("today", { cal.isDateInToday($0) }) }
            if lower.contains("week") { return ("in the last 7 days", { (cal.dateComponents([.day], from: $0, to: .now).day ?? 99) < 7 }) }
            if lower.contains("last month") { return ("last month", { cal.isDate($0, equalTo: lastMonth, toGranularity: .month) }) }
            return ("this month", { cal.isDate($0, equalTo: .now, toGranularity: .month) })
        }()
        let category = TxCategory.allCases.first { lower.contains($0.rawValue) }
            ?? (lower.contains("eat") || lower.contains("coffee") ? .food : nil)
        let (sum, byCat, _) = total(model, range)
        let sorted = byCat.sorted { $0.value > $1.value }.map { ($0.key, $0.value) }
        let card = AICard.spending(title: title.prefix(1).uppercased() + title.dropFirst(), total: sum, byCategory: sorted)

        if let category {
            let v = byCat[category] ?? 0
            let n = model.transactions.filter { $0.direction == .sent && $0.status == .success && range($0.date) && $0.category == category }.count
            let share = sum > 0 ? Int((v / sum * 100).doubleValue.rounded()) : 0
            return AIMessage(role: .assistant,
                             text: n == 0 ? "Nothing on \(category.title.lowercased()) \(title) – not a single payment."
                                 : "\(category.title) came to **\(Money.format(v))** \(title), across \(n) payment\(n == 1 ? "" : "s"). That's about \(share)% of everything you paid.",
                             card: card, followUps: ["Where can I save?", "Compare with last month"])
        }

        if lower.contains("compare") {
            let (now, _, _) = total(model, { cal.isDate($0, equalTo: .now, toGranularity: .month) })
            let (prev, _, _) = total(model, { cal.isDate($0, equalTo: lastMonth, toGranularity: .month) })
            let diff = now - prev
            let line = prev == 0 ? "I don't have last month's payments yet, so there's nothing to compare against."
                : diff <= 0 ? "You've spent **\(Money.format(-diff)) less** than last month so far – \(Money.format(now)) vs \(Money.format(prev)). Nice."
                : "You're **\(Money.format(diff)) above** last month so far – \(Money.format(now)) vs \(Money.format(prev)). Rent landing early is most of it."
            return AIMessage(role: .assistant, text: line, card: card, followUps: ["Where can I save?"])
        }

        let top = sorted.first.map { "\($0.0.title) is the big one at \(Money.format($0.1))" } ?? ""
        let rest = sorted.dropFirst().prefix(3).map { $0.0.title.lowercased() }
        let restLine = rest.isEmpty ? "." : ", and the rest is mostly \(ListFormatter.localizedString(byJoining: Array(rest)))."
        return AIMessage(role: .assistant,
                         text: sum == 0 ? "You haven't paid anything \(title) yet. A quiet one!"
                             : "You've spent **\(Money.format(sum))** \(title). \(top)\(restLine)",
                         card: card,
                         followUps: ["Compare with last month", "Where can I save?", "How much on food?"])
    }

    private func saving(model: AppModel) -> AIMessage {
        let cal = Calendar.current
        let (_, byCat, _) = total(model, { cal.isDate($0, equalTo: .now, toGranularity: .month) })
        let flexible = byCat.filter { ![.rent, .bills].contains($0.key) }.sorted { $0.value > $1.value }
        guard let top = flexible.first else {
            return AIMessage(role: .assistant, text: "Honestly, there isn't much to trim – nearly everything this month went on rent and bills.")
        }
        let third = (top.value / 3).rounded(0)
        return AIMessage(role: .assistant,
                         text: "Your most flexible spend is **\(top.key.title.lowercased())** at \(Money.format(top.value)) this month. Cutting it by a third would save about **\(Money.format(third))** a month – without touching rent or bills.",
                         followUps: ["How much on \(top.key.title.lowercased())?"])
    }

    private func safety(model: AppModel) -> AIMessage {
        var flags: [String] = []
        for r in model.flaggedRequests {
            flags.append("A \(Money.format(r.amount)) request from “\(r.from.name)” says you've won money. Paying it would send money **out** – it's a common scam. I'd block it.")
        }
        if let failed = model.transactions.first(where: { $0.status == .failed }) {
            flags.append("\(Money.format(failed.amount)) to \(failed.counterparty.firstName) failed, but no money left your account – and your retry went through.")
        }
        if let pending = model.transactions.first(where: { $0.status == .pending }) {
            flags.append("\(Money.format(pending.amount)) to \(pending.counterparty.firstName) is still processing. Please don't pay again – it'll settle or come back within 48 hours.")
        }
        return AIMessage(role: .assistant,
                         text: flags.isEmpty ? "All clear. Every recent payment went to someone you've paid before."
                             : "I spotted \(flags.count) thing\(flags.count == 1 ? "" : "s") worth a quick look:",
                         card: flags.isEmpty ? nil : .safety(flags))
    }
}

// MARK: - Deterministic fallback parser

enum RuleParser {
    static func parse(_ text: String, contacts: [Contact]) -> AICommand {
        let lower = text.lowercased()
        let intent: AICommand.Intent = {
            if lower.contains("split") { return .split }
            if ["scam", "fraud", "unusual", "suspicious", "safe"].contains(where: lower.contains) { return .safety }
            if ["request", "ask ", "collect"].contains(where: lower.contains) { return .request }
            if ["spent", "spend", "how much", "expense", "budget", "save", "compare"].contains(where: lower.contains) { return .spending }
            if ["pay", "send", "give", "transfer"].contains(where: lower.contains) { return .pay }
            return .help
        }()
        let words = Set(lower.split(whereSeparator: { !$0.isLetter }).map(String.init))
        let people = contacts.filter { words.contains($0.firstName.lowercased()) }.map(\.firstName)
        var note = ""
        if let r = lower.range(of: " for ") {
            note = String(text[r.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines.union(.punctuationCharacters))
            note = note.prefix(1).uppercased() + note.dropFirst()
        }
        return AICommand(intent: intent, people: people, amount: amount(in: text), note: note)
    }

    /// "₹1,200", "rs 250", "2k", "250.50"
    static func amount(in text: String) -> Decimal? {
        let pattern = #"(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(k\b)?"#
        guard let re = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) else { return nil }
        let ns = text as NSString
        for m in re.matches(in: text, range: NSRange(location: 0, length: ns.length)) {
            let num = ns.substring(with: m.range(at: 1)).replacingOccurrences(of: ",", with: "")
            guard var d = Decimal(string: num), d > 0 else { continue }
            if m.range(at: 2).location != NSNotFound { d *= 1000 }
            return d
        }
        return nil
    }
}

#if canImport(FoundationModels)
@Generable
struct ParsedCommand {
    @Guide(description: "Exactly one of: pay, request, split, spending, safety, help")
    var intent: String
    @Guide(description: "First names of people mentioned, exactly as the user wrote them. Empty if none.")
    var people: [String]
    @Guide(description: "Amount in Indian rupees if the user stated one, otherwise 0. Never guess.")
    var amount: Double
    @Guide(description: "Short purpose like 'Lunch' if stated, otherwise empty")
    var note: String
}

enum OnDeviceParser {
    static func parse(_ text: String) async throws -> ParsedCommand {
        let session = LanguageModelSession(instructions: """
            You convert a message sent to a UPI payments app into a structured command.
            Only extract what the user said. Never invent names or amounts.
            """)
        return try await session.respond(to: text, generating: ParsedCommand.self).content
    }
}
#endif
