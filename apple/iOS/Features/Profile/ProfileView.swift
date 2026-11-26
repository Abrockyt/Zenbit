import SwiftUI

/// Profile follows the Settings app's mental model (Jakob's law) but stays shorter:
/// identity first, then money, then safety, then preferences (chunked – Miller's law).
struct ProfileView: View {
    @Environment(AppModel.self) private var model
    @State private var showQR = false
    @State private var showEdit = false
    @State private var confirmSignOut = false
    @State private var showWatch = false

    var body: some View {
        @Bindable var model = model
        NavigationStack {
            List {
                Section { header }
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())

                Section("Payments") {
                    NavigationLink { RewardsView() } label: {
                        SettingRow(symbol: "gift.fill", title: "Rewards", detail: Money.format(model.rewardsTotal),
                                   caption: "0.5% cashback on every payment")
                    }
                    NavigationLink { AppleWatchView() } label: {
                        SettingRow(symbol: "applewatch", title: "Apple Watch",
                                   detail: model.watchLink.state == .paired ? "Connected" : "Connect",
                                   caption: "Balance, QR and alerts on your wrist")
                    }
                    NavigationLink { BankAccountsView() } label: {
                        SettingRow(symbol: "building.columns.fill", title: "Bank accounts", detail: "\(model.accounts.count)")
                    }
                    Toggle(isOn: $model.upiLiteEnabled) {
                        SettingRow(symbol: "bolt.fill", title: "UPI Lite", detail: Money.format(model.liteBalance),
                                   caption: "Pay up to ₹500 without a PIN")
                    }
                    NavigationLink { AutopayView() } label: {
                        SettingRow(symbol: "repeat", title: "Autopay", detail: "2 active")
                    }
                }

                Section("Security") {
                    Toggle(isOn: $model.faceIDPayEnabled) {
                        SettingRow(symbol: "faceid", title: "Pay with Face ID", caption: "Up to ₹5,000 · PIN for larger payments")
                    }
                    Toggle(isOn: $model.appLockEnabled) {
                        SettingRow(symbol: "lock.fill", title: "Lock app with Face ID")
                    }
                    Button { model.showToast("PIN change needs your debit card details", symbol: "creditcard.fill") } label: {
                        SettingRow(symbol: "lock.rotation", title: "Change UPI PIN")
                    }
                    NavigationLink { BlockedView() } label: {
                        SettingRow(symbol: "hand.raised.fill", title: "Blocked people")
                    }
                }

                Section("Preferences") {
                    Picker(selection: Binding(get: { Sounds.chime }, set: { Sounds.chime = $0; Sounds.preview($0) })) {
                        ForEach(Sounds.Chime.allCases) { Text($0.title).tag($0) }
                    } label: {
                        SettingRow(symbol: "speaker.wave.2.fill", title: "Payment sound")
                    }
                    Toggle(isOn: $model.notificationsEnabled) {
                        SettingRow(symbol: "bell.fill", title: "Payment alerts")
                    }
                    SettingRow(symbol: "globe", title: "Language", detail: "English")
                }

                Section {
                    Picker(selection: $model.simulation) {
                        ForEach(SimulationMode.allCases) { Text($0.title).tag($0) }
                    } label: {
                        SettingRow(symbol: "testtube.2", title: "Bank simulator")
                    }
                    SettingRow(symbol: "key.fill", title: "Demo UPI PIN", detail: model.pinVault.demoPIN)
                } header: {
                    Text("Demo")
                } footer: {
                    Text("In Realistic mode, paying ₹404 fails (bank down) and ₹504 goes to Processing, then completes after 15 s.")
                }

                Section("About") {
                    NavigationLink { DesignNotesView() } label: {
                        SettingRow(symbol: "lightbulb.fill", title: "Design notes", caption: "Why each screen works the way it does")
                    }
                    SettingRow(symbol: "questionmark.circle.fill", title: "Help & support")
                    SettingRow(symbol: "hand.raised.square.fill", title: "Privacy")
                }

                Section {
                    Button("Sign out", role: .destructive) { confirmSignOut = true }
                        .frame(maxWidth: .infinity)
                } footer: {
                    Text("Zenbit 1.0 · UPI payments by NPCI partner banks (demo)")
                        .frame(maxWidth: .infinity)
                        .padding(.top, ZB.Space.sm)
                }
            }
            .tracksTabBarScroll()
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(ZB.Palette.canvas)
            .navigationTitle("Profile")
            .navigationDestination(isPresented: $showWatch) { AppleWatchView() }
            .onAppear { if model.debugWatch { model.debugWatch = false; showWatch = true } }
            .minimizesTabBar()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { Button("Edit") { showEdit = true } }
            }
            .sheet(isPresented: $showQR) { MyQRView().presentationDetents([.large]) }
            .sheet(isPresented: $showEdit) { EditProfileView() }
            .confirmationDialog("Sign out of Zenbit?", isPresented: $confirmSignOut, titleVisibility: .visible) {
                Button("Sign out", role: .destructive) { model.signOut() }
            } message: {
                Text("You'll need your phone number and an SMS code to sign back in. Your UPI PIN stays with your bank.")
            }
        }
    }

    private var header: some View {
        VStack(spacing: ZB.Space.md) {
            AvatarView(contact: model.profile.asContact, size: 88)
            VStack(spacing: 4) {
                Text(model.profile.name).font(.title2.weight(.bold))
                HStack(spacing: 6) {
                    Text("+91 \(model.profile.phone.prefix(5)) \(model.profile.phone.suffix(5))")
                    if model.profile.kycVerified {
                        Label("KYC verified", systemImage: "checkmark.seal.fill")
                            .labelStyle(.titleAndIcon)
                            .foregroundStyle(ZB.Palette.greenInk)
                    }
                }
                .font(.subheadline)
                .foregroundStyle(ZB.Palette.inkSecondary)
            }
            HStack(spacing: ZB.Space.xs) {
                Button { Clipboard.copy(model.profile.upiID, label: "UPI ID", model: model) } label: {
                    Label(model.profile.upiID, systemImage: "doc.on.doc")
                        .labelStyle(TrailingIconLabel())
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(ZB.Palette.ink)
                        .padding(.horizontal, ZB.Space.md)
                        .frame(minHeight: 44)
                        .background(ZB.Palette.surface, in: .capsule)
                }
                .zbPressable()
                Button { showQR = true } label: {
                    Label("My QR", systemImage: "qrcode")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(ZB.Palette.onGreen)
                        .padding(.horizontal, ZB.Space.md)
                        .frame(minHeight: 44)
                        .background(ZB.Palette.green, in: .capsule)
                }
                .zbPressable()
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, ZB.Space.md)
    }
}

/// Settings-style row: compact SF Symbol on a soft-green squircle.
struct SettingRow: View {
    let symbol: String
    let title: String
    var detail: String? = nil
    var caption: String? = nil

    var body: some View {
        HStack(spacing: ZB.Space.sm) {
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(ZB.Palette.greenInk)
                .frame(width: 30, height: 30)
                .background(ZB.Palette.greenSoft, in: .rect(cornerRadius: 8, style: .continuous))
            VStack(alignment: .leading, spacing: 1) {
                Text(title).foregroundStyle(ZB.Palette.ink)
                if let caption { Text(caption).font(.caption).foregroundStyle(ZB.Palette.inkSecondary) }
            }
            Spacer()
            if let detail { Text(detail).foregroundStyle(ZB.Palette.inkSecondary) }
        }
    }
}

// MARK: - My QR (receive money)

struct MyQRView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var amount = ""

    private var link: UPILink {
        UPILink(payeeVPA: model.profile.upiID, payeeName: model.profile.name,
                amount: Decimal(string: amount).flatMap { $0 > 0 ? $0 : nil })
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: ZB.Space.xl) {
                VStack(spacing: ZB.Space.md) {
                    AvatarView(contact: model.profile.asContact, size: 56)
                    Text(model.profile.name).font(.title3.weight(.semibold))
                    Image(uiImage: QRCode.image(for: link.url.absoluteString))
                        .interpolation(.none)
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: 240)
                        .padding(ZB.Space.md)
                        .background(.white, in: .rect(cornerRadius: ZB.Radius.lg, style: .continuous))
                        .accessibilityLabel("QR code for \(model.profile.upiID)")
                    Text(model.profile.upiID).font(.subheadline.monospaced()).foregroundStyle(ZB.Palette.inkSecondary)
                }
                .padding(ZB.Space.xl)
                .frame(maxWidth: .infinity)
                .zbCard(radius: ZB.Radius.xl, fill: ZB.Palette.surface)

                TextField("Add an amount (optional)", text: $amount)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.center)
                    .font(.headline)
                    .frame(minHeight: 48)
                    .background(ZB.Palette.surface, in: .capsule)

                Spacer()
                ShareLink(item: link.url, message: Text("Pay \(model.profile.name) on UPI")) {
                    Label("Share payment link", systemImage: "square.and.arrow.up")
                }
                .buttonStyle(.zbPrimary)
            }
            .padding(ZB.Space.margin)
            .background(ZB.Palette.canvas)
            .navigationTitle("Receive money")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }
}

// MARK: - Edit profile (ask only what the product needs)

struct EditProfileView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    LabeledContent("Name", value: model.profile.name)
                    LabeledContent("Mobile", value: "+91 \(model.profile.phone)")
                } header: { Text("From your bank") } footer: {
                    Text("Your name comes from your bank's KYC so payees see the right banking name. Changing your number needs SMS re-verification.")
                }
                Section {
                    TextField("Email for receipts (optional)", text: $email)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .textInputAutocapitalization(.never)
                } header: { Text("Contact") }
                Section("UPI IDs") {
                    LabeledContent(model.profile.upiID, value: "Primary")
                    Button("Create a custom UPI ID") { model.showToast("Custom IDs like aarav.m@zenbit – coming soon", symbol: "at") }
                }
            }
            .navigationTitle("Edit profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { model.profile.email = email; dismiss(); model.showToast("Profile updated") }
                }
            }
            .onAppear { email = model.profile.email }
        }
    }
}

// MARK: - Secondary pages

struct BankAccountsView: View {
    @Environment(AppModel.self) private var model
    var body: some View {
        List {
            ForEach(model.accounts) { a in
                HStack(spacing: ZB.Space.sm) {
                    BankLogo(bankName: a.bankName, height: 38)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(a.bankName).font(.body.weight(.medium))
                        Text("\(a.kind) •• \(a.last4) · \(a.ifsc)").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                    }
                    Spacer()
                    if a.isPrimary { Text("Primary").font(.caption.weight(.semibold)).foregroundStyle(ZB.Palette.greenInk) }
                }
                .swipeActions {
                    if !a.isPrimary {
                        Button("Make primary") {
                            for i in model.accounts.indices { model.accounts[i].isPrimary = model.accounts[i].id == a.id }
                        }
                        .tint(ZB.Palette.greenDeep)
                    }
                }
            }
            Button("Add bank account", systemImage: "plus") { model.showToast("Searching banks linked to your number…", symbol: "magnifyingglass") }
        }
        .navigationTitle("Bank accounts")
    }
}

struct AutopayView: View {
    var body: some View {
        List {
            Section("Active") {
                LabeledContent("Netflix", value: "₹649 / month")
                LabeledContent("SIP – Index fund", value: "₹5,000 / month")
            }
            Section { Text("Autopay mandates are approved once with your UPI PIN and can be paused or cancelled here anytime.").font(.footnote) }
        }
        .navigationTitle("Autopay")
    }
}

struct BlockedView: View {
    var body: some View {
        ContentUnavailableView("No one blocked", systemImage: "hand.raised",
                               description: Text("People you block can't send you requests."))
            .navigationTitle("Blocked people")
    }
}

#Preview { ProfileView().environment(AppModel()) }
