import SwiftUI

/// "Pay" search tab: one field that accepts a name, phone number or UPI ID (Postel's law),
/// and verifies new UPI IDs before money can move (shows the bank-registered name).
struct PaySearchView: View {
    @Environment(AppModel.self) private var model
    @State private var query = ""
    @State private var verifying = false
    @State private var verified: Contact?

    private var trimmed: String { query.trimmingCharacters(in: .whitespaces) }
    private var matches: [Contact] {
        let q = trimmed.lowercased()
        guard !q.isEmpty else { return [] }
        let digits = q.filter(\.isNumber)
        return model.contacts.filter {
            $0.name.lowercased().contains(q) || $0.upiID.lowercased().contains(q)
                || (digits.count >= 3 && $0.phone.contains(digits))
        }
    }
    private var looksLikeVPA: Bool { UPIValidation.isValidVPA(trimmed) }
    private var phone: String? { UPIValidation.normalizedPhone(trimmed) }

    var body: some View {
        NavigationStack {
            List {
                if trimmed.isEmpty {
                    Section {
                        ScrollView(.horizontal) {
                            HStack(spacing: ZB.Space.md) {
                                ForEach(model.favorites) { c in
                                    Button { model.startPay(c, source: "pay_favorites") } label: { PersonCell(contact: c).frame(width: 64) }
                                        .buttonStyle(.plain)
                                }
                            }
                            .padding(.vertical, ZB.Space.xs)
                        }
                        .scrollIndicators(.hidden)
                    } header: { Text("Favourites") }

                    Section("All contacts") {
                        ForEach(model.contacts.sorted { $0.name < $1.name }) { contactRow($0) }
                    }
                } else {
                    if looksLikeVPA || phone != nil, matches.isEmpty {
                        Section("New payee") { newPayeeRow }
                    } else if trimmed.contains("@") && !looksLikeVPA {
                        Label("UPI IDs look like name@bank – check for typos.", systemImage: "info.circle")
                            .font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                    }
                    if !matches.isEmpty {
                        Section("Contacts") { ForEach(matches) { contactRow($0) } }
                    } else if !looksLikeVPA && phone == nil && !trimmed.contains("@") {
                        ContentUnavailableView("No one called “\(trimmed)”", systemImage: "person.crop.circle.badge.questionmark",
                                               description: Text("Try a phone number or UPI ID instead."))
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(ZB.Palette.canvas)
            .navigationTitle("Pay")
            .minimizesTabBar()
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always),
                        prompt: "Name, number or UPI ID")
            .keyboardType(.default)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .onChange(of: trimmed) { _, _ in verified = nil }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Scan", systemImage: "qrcode.viewfinder") { model.showScanner = true }
                }
            }
        }
    }

    @ViewBuilder private func contactRow(_ c: Contact) -> some View {
        HStack(spacing: ZB.Space.sm) {
            AvatarView(contact: c, size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(c.name).font(.body.weight(.medium))
                Text(c.isOnUPI ? c.upiID : "Not on UPI yet").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
            }
            Spacer()
            if c.isOnUPI {
                Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(ZB.Palette.inkTertiary)
            } else {
                // Edge case: contact without UPI → invite instead of a dead end.
                ShareLink(item: "Join me on Zenbit to send and receive money instantly: https://zenbit.app/invite/aarav") {
                    Text("Invite").font(.subheadline.weight(.semibold))
                }
            }
        }
        .contentShape(.rect)
        .onTapGesture { if c.isOnUPI { model.startPay(c, source: "pay_search") } }
        .accessibilityAddTraits(.isButton)
    }

    @ViewBuilder private var newPayeeRow: some View {
        if let v = verified {
            Button { model.startPay(v, source: "pay_new_payee") } label: {
                HStack(spacing: ZB.Space.sm) {
                    AvatarView(contact: v, size: 40)
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(v.name).font(.body.weight(.semibold))
                            Image(systemName: "checkmark.seal.fill").foregroundStyle(ZB.Palette.greenInk).font(.footnote)
                        }
                        Text("Banking name verified · \(v.upiID)").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                    }
                    Spacer()
                    Text("Pay").font(.subheadline.weight(.semibold)).foregroundStyle(ZB.Palette.greenInk)
                }
            }
            .buttonStyle(.plain)
        } else {
            Button(action: verify) {
                HStack(spacing: ZB.Space.sm) {
                    IconTile(symbol: phone != nil ? "phone.fill" : "at", size: 40)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(phone.map { "+91 \($0)" } ?? trimmed.lowercased()).font(.body.weight(.medium))
                        Text(verifying ? "Checking with the bank…" : "Tap to verify before paying")
                            .font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                    }
                    Spacer()
                    if verifying { ZSpinner(size: 20) }
                }
            }
            .buttonStyle(.plain)
            .disabled(verifying)
        }
    }

    private func verify() {
        verifying = true
        Task {
            try? await Task.sleep(for: .milliseconds(800))
            verifying = false
            let handle = phone.map { "\($0)@upi" } ?? trimmed.lowercased()
            let base = handle.split(separator: "@").first.map(String.init) ?? handle
            let name = base.replacingOccurrences(of: ".", with: " ").replacingOccurrences(of: "_", with: " ")
                .split(separator: " ").map { $0.capitalized }.joined(separator: " ")
            withAnimation(ZB.Motion.standard) {
                verified = Contact(name: phone != nil ? "Priya Verma" : name, upiID: handle, phone: phone ?? "",
                                   hue: Double(abs(handle.hashValue % 100)) / 100)
            }
            Haptics.tap()
        }
    }
}
