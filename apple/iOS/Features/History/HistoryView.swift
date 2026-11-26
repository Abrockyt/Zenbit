import SwiftUI

enum HistoryFilter: String, CaseIterable, Identifiable {
    case all = "All", sent = "Paid", received = "Received", pending = "Processing", failed = "Failed"
    var id: String { rawValue }
    func matches(_ t: Transaction) -> Bool {
        switch self {
        case .all: true
        case .sent: t.direction == .sent && t.status == .success
        case .received: t.direction == .received
        case .pending: t.status == .pending
        case .failed: t.status == .failed || t.status == .refunded
        }
    }
}

/// Activity: grouped by day (law of common region), searchable by name, note, amount or UPI ref
/// (Postel: accept any of the things people remember), filters as one row of chips.
/// iPad / unfolded foldables get a list–detail split.
struct HistoryView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.horizontalSizeClass) private var hSize
    @State private var query = ""
    @State private var filter: HistoryFilter = .all
    @State private var selection: Transaction.ID?

    private var filtered: [Transaction] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        return model.transactions.filter { t in
            guard filter.matches(t) else { return false }
            guard !q.isEmpty else { return true }
            let digits = q.filter(\.isNumber)
            return t.counterparty.name.lowercased().contains(q) || t.note.lowercased().contains(q)
                || t.counterparty.upiID.lowercased().contains(q)
                || (!digits.isEmpty && (t.upiRef.contains(digits) || "\(t.amount)".hasPrefix(digits)))
        }
    }

    private var groups: [(String, [Transaction])] {
        let cal = Calendar.current
        let dict = Dictionary(grouping: filtered) { cal.startOfDay(for: $0.date) }
        return dict.keys.sorted(by: >).map { ($0.zbRelativeDay, dict[$0]!.sorted { $0.date > $1.date }) }
    }

    var body: some View {
        if hSize == .regular {
            // List–detail side by side (the tab sidebar already provides the first column).
            NavigationStack {
                HStack(spacing: 0) {
                    list(selectable: true)
                        .frame(width: 400)
                    Divider().ignoresSafeArea()
                    Group {
                        if let id = selection, let tx = model.transactions.first(where: { $0.id == id }) {
                            TransactionDetailView(tx: tx).id(id)
                        } else {
                            ContentUnavailableView("Select a payment", systemImage: "list.bullet.rectangle.portrait",
                                                   description: Text("Details, receipts and help appear here."))
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(ZB.Palette.canvas)
                }
            }
            .onAppear { if selection == nil { selection = model.transactions.first?.id } }
        } else {
            NavigationStack {
                list(selectable: false)
                    .navigationDestination(for: Transaction.self) { TransactionDetailView(tx: $0) }
            }
        }
    }

    @ViewBuilder private func list(selectable: Bool) -> some View {
        List {
            Section {
                summary
                    .listRowInsets(EdgeInsets(top: 0, leading: ZB.Space.margin, bottom: ZB.Space.sm, trailing: ZB.Space.margin))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                filters
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }
            if groups.isEmpty {
                ContentUnavailableView.search(text: query.isEmpty ? filter.rawValue : query)
                    .listRowBackground(Color.clear)
            }
            ForEach(groups, id: \.0) { day, items in
                Section(day) {
                    ForEach(items) { tx in
                        Group {
                            if selectable {
                                // Custom selection: a soft tint keeps text legible (system green fill didn't).
                                Button { selection = tx.id } label: { TransactionRow(tx: tx) }
                                    .buttonStyle(.plain)
                                    .listRowBackground(selection == tx.id ? ZB.Palette.greenSoft : ZB.Palette.raised)
                                    .accessibilityAddTraits(selection == tx.id ? .isSelected : [])
                            } else {
                                NavigationLink(value: tx) { TransactionRow(tx: tx) }
                            }
                        }
                        .swipeActions(edge: .trailing) {
                            if tx.direction == .sent {
                                Button("Pay again", systemImage: "arrow.clockwise") {
                                    model.startPay(tx.counterparty, amount: tx.amount, note: tx.note, source: "history_swipe")
                                }
                                .tint(ZB.Palette.greenDeep)
                            }
                        }
                        .contextMenu {
                            Button("Copy UPI Ref", systemImage: "doc.on.doc") { Clipboard.copy(tx.upiRef, label: "UPI Ref", model: model) }
                            Button("Pay \(tx.counterparty.firstName)", systemImage: "indianrupeesign") {
                                model.startPay(tx.counterparty, source: "history_menu")
                            }
                            ShareLink(item: "Zenbit · \(Money.format(tx.amount)) · \(tx.counterparty.name) · UPI Ref \(tx.upiRef)")
                        }
                    }
                }
            }
        }
            .tracksTabBarScroll()
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(ZB.Palette.canvas)
        .navigationTitle("Activity")
        .navigationBarTitleDisplayMode(.inline)
        .minimizesTabBar()
        .searchable(text: $query, prompt: "Name, note, amount or UPI Ref")
        .animation(ZB.Motion.standard, value: filter)
    }

    private var summary: some View {
        let cal = Calendar.current
        let month = model.transactions.filter { cal.isDate($0.date, equalTo: Date(), toGranularity: .month) }
        let out = month.filter { $0.direction == .sent && $0.status == .success }.reduce(Decimal(0)) { $0 + $1.amount }
        let inn = month.filter { $0.direction == .received && $0.status == .success }.reduce(Decimal(0)) { $0 + $1.amount }
        return VStack(alignment: .leading, spacing: 10) {
            Text("This month").font(.footnote.weight(.semibold)).foregroundStyle(ZB.Palette.inkSecondary).padding(.leading, 4)
            HStack(spacing: ZB.Space.sm) {
                SummaryTile(title: "Paid", value: Money.format(out), symbol: "arrow.up.right", tint: Color(hex: 0x0B0C10), selected: filter == .sent) {
                    withAnimation(ZB.Motion.standard) { filter = filter == .sent ? .all : .sent }
                }
                SummaryTile(title: "Received", value: Money.format(inn), symbol: "arrow.down.left", tint: Color(hex: 0x00A85A), selected: filter == .received) {
                    withAnimation(ZB.Motion.standard) { filter = filter == .received ? .all : .received }
                }
            }
        }
    }

    private var filters: some View {
        ScrollView(.horizontal) {
            HStack(spacing: ZB.Space.xs) {
                ForEach(HistoryFilter.allCases) { f in
                    let on = f == filter
                    Button { filter = f } label: {
                        Text(f.rawValue)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(on ? ZB.Palette.canvas : ZB.Palette.ink)
                            .padding(.horizontal, ZB.Space.md)
                            .frame(minHeight: 36)
                            .background(on ? ZB.Palette.ink : ZB.Palette.surface, in: .capsule)
                    }
                    .zbPressable()
                    .accessibilityAddTraits(on ? .isSelected : [])
                }
            }
            .padding(.horizontal, ZB.Space.margin)
        }
        .scrollIndicators(.hidden)
        .sensoryFeedback(.selection, trigger: filter)
    }
}

/// Big, tappable summary tile: a coloured arrow chip, the label, and the amount in large type. Tapping filters the list.
private struct SummaryTile: View {
    let title: String
    let value: String
    let symbol: String
    let tint: Color
    var selected = false
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 10) {
                    Image(systemName: symbol).font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                        .frame(width: 32, height: 32).background(tint, in: .circle)
                    Text(title).font(.system(.headline, design: .rounded)).foregroundStyle(ZB.Palette.ink)
                    Spacer(minLength: 0)
                }
                Text(value)
                    .font(.system(size: 26, weight: .bold, design: .rounded)).monospacedDigit().foregroundStyle(ZB.Palette.ink)
                    .minimumScaleFactor(0.65).lineLimit(1)
                    .frame(height: 34, alignment: .leading)
            }
            .padding(16)
            .frame(maxWidth: .infinity, minHeight: 112, alignment: .topLeading)
            .background(ZB.Palette.surface, in: .rect(cornerRadius: 22, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(selected ? ZB.Palette.ink : .clear, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
        .zbPressable()
        .accessibilityLabel("\(title) this month, \(value)")
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

// MARK: - Detail

struct TransactionDetailView: View {
    @Environment(AppModel.self) private var model
    let tx: Transaction
    @State private var showDispute = false

    /// Always read the live copy (status can change while open, e.g. pending → completed).
    private var live: Transaction { model.transactions.first { $0.id == tx.id } ?? tx }

    var body: some View {
        let t = live
        ScrollView {
            VStack(spacing: ZB.Space.xl) {
                VStack(spacing: ZB.Space.sm) {
                    AvatarView(contact: t.counterparty, size: 72)
                    Text(t.direction == .sent ? "Paid to \(t.counterparty.name)" : "Received from \(t.counterparty.name)")
                        .font(.headline)
                    Text(Money.format(t.amount, sign: t.direction == .received))
                        .font(.zbAmountLarge).monospacedDigit()
                        .strikethrough(t.status == .failed)
                    StatusBadge(status: t.status)
                    if !t.note.isEmpty {
                        Text("“\(t.note)”").font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                    }
                }
                .frame(maxWidth: .infinity)

                if let reason = t.failureReason {
                    Label(reason, systemImage: t.status == .failed ? "info.circle.fill" : "clock.fill")
                        .font(.footnote)
                        .foregroundStyle(ZB.Palette.inkSecondary)
                        .padding(ZB.Space.md)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .zbCard(radius: ZB.Radius.md, fill: t.status == .failed ? ZB.Palette.dangerSoft : ZB.Palette.warningSoft)
                }

                StatusTimeline(tx: t)

                VStack(spacing: 0) {
                    CopyRow(title: "UPI Ref No.", value: t.upiRef)
                    Divider().overlay(ZB.Palette.hairline)
                    CopyRow(title: "Transaction ID", value: t.txnID)
                    if !t.counterparty.upiID.isEmpty {
                        Divider().overlay(ZB.Palette.hairline)
                        CopyRow(title: t.direction == .sent ? "To UPI ID" : "From UPI ID", value: t.counterparty.upiID, mono: false)
                    }
                    Divider().overlay(ZB.Palette.hairline)
                    DetailRow(title: t.direction == .sent ? "Debited from" : "Credited to", value: t.accountMasked)
                    Divider().overlay(ZB.Palette.hairline)
                    DetailRow(title: "Date", value: t.date.formatted(date: .long, time: .shortened))
                    Divider().overlay(ZB.Palette.hairline)
                    DetailRow(title: "Category", value: t.category.title, symbol: t.category.symbol)
                }
                .padding(.horizontal, ZB.Space.md)
                .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)

                VStack(spacing: ZB.Space.xs) {
                    if t.counterparty.isOnUPI {
                        Button(t.direction == .sent ? "Pay again" : "Pay \(t.counterparty.firstName)") {
                            model.startPay(t.counterparty, amount: t.direction == .sent ? t.amount : nil,
                                           note: t.note, source: "detail")
                        }
                        .buttonStyle(.zbPrimary)
                    }
                    ShareLink(item: receipt(t)) { Label("Share receipt", systemImage: "square.and.arrow.up") }
                        .buttonStyle(.zbSecondary)
                    Button("Report a problem") { showDispute = true }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(ZB.Palette.danger)
                        .frame(minHeight: ZB.minTarget)
                }
            }
            .padding(ZB.Space.margin)
            .frame(maxWidth: 640)
            .frame(maxWidth: .infinity)
        }
        .background(ZB.Palette.canvas)
        .navigationTitle(t.date.zbRelativeDay)
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("What went wrong?", isPresented: $showDispute, titleVisibility: .visible) {
            Button("Money debited but not received") { raised() }
            Button("Paid the wrong person") { raised() }
            Button("I didn't make this payment", role: .destructive) { raised() }
        } message: {
            Text("We'll raise a complaint with the bank via NPCI. Most are resolved within 48 hours.")
        }
    }

    private func raised() { model.showToast("Complaint raised · ID ZBD\(tx.upiRef.suffix(6))", symbol: "checkmark.bubble.fill") }

    private func receipt(_ t: Transaction) -> String {
        """
        \(t.direction == .sent ? "Paid" : "Received") \(Money.format(t.amount)) \(t.direction == .sent ? "to" : "from") \(t.counterparty.name)
        Status: \(t.status.label)
        UPI Ref: \(t.upiRef)
        \(t.date.formatted(date: .long, time: .shortened)) · Zenbit
        """
    }
}

private struct DetailRow: View {
    let title: String
    let value: String
    var symbol: String? = nil
    var body: some View {
        HStack {
            Text(title).font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
            Spacer()
            if let symbol { Image(systemName: symbol).imageScale(.small).foregroundStyle(ZB.Palette.inkSecondary) }
            Text(value).font(.subheadline.weight(.medium)).multilineTextAlignment(.trailing)
        }
        .frame(minHeight: 52)
    }
}

/// Initiated → Debited → Credited. Pending shows where it's stuck; failed shows where it stopped.
private struct StatusTimeline: View {
    let tx: Transaction

    private var steps: [(String, Bool, Bool)] { // title, done, problem
        switch tx.status {
        case .success: [("Payment started", true, false), ("Debited from your bank", true, false), ("Credited to \(tx.counterparty.firstName)", true, false)]
        case .pending: [("Payment started", true, false), ("Debited from your bank", true, false), ("Waiting for \(tx.counterparty.bankName)", false, true)]
        case .failed: [("Payment started", true, false), ("Bank didn't respond", false, true), ("Not credited", false, false)]
        case .refunded: [("Payment started", true, false), ("Debited", true, false), ("Refunded to your bank", true, false)]
        }
    }

    var body: some View {
        if tx.direction == .sent {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(steps.indices, id: \.self) { i in
                    let s = steps[i]
                    HStack(alignment: .top, spacing: ZB.Space.sm) {
                        VStack(spacing: 0) {
                            Image(systemName: s.1 ? "checkmark.circle.fill" : (s.2 ? "exclamationmark.circle.fill" : "circle"))
                                .foregroundStyle(s.1 ? ZB.Palette.greenInk : (s.2 ? tx.status.tint : ZB.Palette.inkTertiary))
                                .font(.body)
                            if i < steps.count - 1 {
                                Rectangle().fill(ZB.Palette.hairline).frame(width: 2, height: 22)
                            }
                        }
                        Text(s.0).font(.subheadline).foregroundStyle(s.1 || s.2 ? ZB.Palette.ink : ZB.Palette.inkTertiary)
                        Spacer()
                    }
                }
            }
            .padding(ZB.Space.md)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
            .accessibilityElement(children: .combine)
        }
    }
}

#Preview { HistoryView().environment(AppModel()) }
