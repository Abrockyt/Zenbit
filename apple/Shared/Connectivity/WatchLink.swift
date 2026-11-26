import Foundation
import WatchConnectivity
import Observation

// MARK: - Wire types

/// What the watch is allowed to know. No account numbers, no PIN, no tokens that can move money.
struct WatchSnapshot: Codable, Equatable {
    struct Tx: Codable, Equatable, Identifiable {
        var id: String
        var name: String
        var amount: Double
        var received: Bool
        var status: String      // success | failed | pending
        var date: Date
        var ref: String
    }
    var name: String
    var upiID: String
    var balance: Double
    var txs: [Tx]
    var updated: Date
}

/// A watch asking the phone to connect. Shown to the person on the phone, who must approve it.
struct WatchPairRequest: Identifiable, Equatable {
    let id = UUID()
    var code: String
    var watchName: String
    var at: Date
}

// MARK: - Link

/// Connects the Zenbit Watch app to the Zenbit iPhone app (WatchConnectivity), like signing a device in:
///
/// 1. The **watch** shows a 6-digit code and asks the phone to connect.
/// 2. The **phone** shows "Connect Apple Watch?" with the same code. The person checks it matches and approves
///    with Face ID – *or* types the code into the phone by hand (works even if the watch can't reach the phone).
/// 3. The phone replies "approved for code X"; the watch only accepts an approval for the code it is showing.
/// 4. The phone then pushes a small snapshot (name, balance, recent payments) whenever something changes.
///
/// Codes expire after 5 minutes. Sending money is never possible from the watch.
@Observable
final class WatchLink: NSObject {
    static let shared = WatchLink()

    enum State: String { case unpaired, waiting, paired }

    // Shared
    var state: State = .unpaired
    var isReachable = false
    var lastSync: Date?
    /// Watch: the code on screen. Phone: unused.
    var pendingCode: String?
    var codeExpires: Date?
    /// Watch: phone's name ("Aarav's iPhone"). Phone: the watch's name.
    var peerName: String?
    /// Watch: the latest data from the phone.
    var snapshot: WatchSnapshot?
    /// Phone: a request waiting for approval.
    var incoming: WatchPairRequest?
    /// Phone: is a watch paired with this iPhone at all (hardware), and does it have our app?
    var hardwarePaired = false
    var watchAppInstalled = false

    private let defaults = UserDefaults.standard
    private var session: WCSession? { WCSession.isSupported() ? WCSession.default : nil }
    private var outgoingContext: [String: Any] = [:]

    // MARK: Lifecycle

    func activate() {
        restore()
        guard let session else { return }
        session.delegate = self
        session.activate()
    }

    private func restore() {
        state = State(rawValue: defaults.string(forKey: "wl.state") ?? "") ?? .unpaired
        peerName = defaults.string(forKey: "wl.peer")
        if state == .waiting { state = .unpaired }           // a code never survives a relaunch
        if let data = defaults.data(forKey: "wl.snapshot"), let s = try? JSONDecoder().decode(WatchSnapshot.self, from: data) {
            snapshot = s
        }
    }

    private func persist() {
        defaults.set(state.rawValue, forKey: "wl.state")
        defaults.set(peerName, forKey: "wl.peer")
        if let snapshot, let d = try? JSONEncoder().encode(snapshot) { defaults.set(d, forKey: "wl.snapshot") }
    }

    // MARK: Sending

    private func send(_ payload: [String: Any]) {
        guard let session, session.activationState == .activated else { return }
        outgoingContext.merge(payload) { $1 }
        outgoingContext["ts"] = Date().timeIntervalSince1970
        try? session.updateApplicationContext(outgoingContext)           // reliable, latest wins
        if session.isReachable { session.sendMessage(outgoingContext, replyHandler: nil, errorHandler: nil) }  // instant
    }

    // MARK: Watch actions

    func startPairing(watchName: String = "Apple Watch") {
        let code = String(format: "%06d", Int.random(in: 0...999_999))
        pendingCode = code
        codeExpires = Date().addingTimeInterval(300)
        state = .waiting
        send(["pairRequestCode": code, "watch": watchName, "unpair": false])
    }

    func cancelPairing() {
        pendingCode = nil
        state = .unpaired
        send(["pairRequestCode": ""])
    }

    /// Watch → forget the phone (and tell it).
    func disconnectFromWatch() {
        state = .unpaired
        snapshot = nil
        peerName = nil
        pendingCode = nil
        defaults.removeObject(forKey: "wl.snapshot")
        persist()
        send(["unpair": true, "pairRequestCode": ""])
    }

    // MARK: Phone actions

    /// Approve (Face ID has already happened). `code` must be the code the watch is showing.
    func approve(code: String, watchName: String = "Apple Watch") {
        state = .paired
        peerName = watchName
        incoming = nil
        persist()
        send(["paired": true, "code": code, "unpair": false])
    }

    func decline() { incoming = nil }

    /// Phone → disconnect the watch.
    func disconnectFromPhone() {
        state = .unpaired
        peerName = nil
        incoming = nil
        persist()
        send(["paired": false, "code": ""])
    }

    func push(_ s: WatchSnapshot, name: String? = nil) {
        guard state == .paired else { return }
        if let d = try? JSONEncoder().encode(s) { send(["snapshot": d, "name": name ?? s.name]) }
        lastSync = .now
    }

    // MARK: Receiving

    @MainActor fileprivate func handle(_ d: [String: Any]) {
        let ts = d["ts"] as? Double ?? 0
        let fresh = Date().timeIntervalSince1970 - ts < 300
        #if os(watchOS)
        if let paired = d["paired"] as? Bool {
            if paired, let code = d["code"] as? String, !code.isEmpty,
               code == pendingCode || state == .paired {
                state = .paired
                if let n = d["name"] as? String { peerName = "\(n)'s iPhone" }
                else if peerName == nil { peerName = "your iPhone" }
                pendingCode = nil
                persist()
            } else if !paired, state == .paired, fresh {
                state = .unpaired; snapshot = nil; peerName = nil; persist()
            }
        }
        if let data = d["snapshot"] as? Data, let s = try? JSONDecoder().decode(WatchSnapshot.self, from: data) {
            snapshot = s; lastSync = .now
            if peerName == nil || peerName == "your iPhone" { peerName = "\(s.name.split(separator: " ").first.map(String.init) ?? s.name)'s iPhone" }
            persist()
        }
        #else
        if let code = d["pairRequestCode"] as? String {
            if code.isEmpty { incoming = nil }
            else if state != .paired, fresh {
                incoming = WatchPairRequest(code: code, watchName: d["watch"] as? String ?? "Apple Watch", at: .now)
            }
        }
        if d["unpair"] as? Bool == true, fresh, state == .paired {
            state = .unpaired; peerName = nil; persist()
        }
        #endif
    }
}

// MARK: - WCSessionDelegate

extension WatchLink: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let ctx = session.receivedApplicationContext
        let reachable = session.isReachable
        #if os(iOS)
        let paired = session.isPaired, installed = session.isWatchAppInstalled
        #endif
        Task { @MainActor in
            self.isReachable = reachable
            #if os(iOS)
            self.hardwarePaired = paired; self.watchAppInstalled = installed
            #endif
            if !ctx.isEmpty { self.handle(ctx) }
        }
    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        let r = session.isReachable
        Task { @MainActor in self.isReachable = r }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        Task { @MainActor in self.handle(message) }
    }

    nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        Task { @MainActor in self.handle(applicationContext) }
    }

    #if os(iOS)
    nonisolated func sessionDidBecomeInactive(_ session: WCSession) {}
    nonisolated func sessionDidDeactivate(_ session: WCSession) { session.activate() }
    nonisolated func sessionWatchStateDidChange(_ session: WCSession) {
        let paired = session.isPaired, installed = session.isWatchAppInstalled
        Task { @MainActor in self.hardwarePaired = paired; self.watchAppInstalled = installed }
    }
    #endif
}
