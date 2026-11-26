import AVFoundation

/// Payment sounds.
/// - `whoosh`: an airy sweep while the card's pixels stream up into the island (Kenney CC0 + synthesised air).
/// - `success`: played as the tick draws – the chosen chime (warm two-note "ding-ding", or a brighter ding).
/// - `pending` / `failure`: short synthesised tones.
/// Respects the silent switch (`.ambient`) and mixes with whatever the person is listening to.
@MainActor
enum Sounds {
    enum Kind { case whoosh, success, pending, failure, reward, redeem, miss }

    /// Profile ▸ Payment sound.
    enum Chime: String, CaseIterable, Identifiable {
        case warm, bright, off
        var id: String { rawValue }
        var title: String {
            switch self {
            case .warm: "Chime"
            case .bright: "Bright"
            case .off: "Off"
            }
        }
        var file: String? {
            switch self {
            case .warm: "zen_success"
            case .bright: "zen_success_bright"
            case .off: nil
            }
        }
    }

    static var chime: Chime {
        get { Chime(rawValue: UserDefaults.standard.string(forKey: "paymentSound") ?? "") ?? .warm }
        set { UserDefaults.standard.set(newValue.rawValue, forKey: "paymentSound") }
    }

    private static var players: [String: AVAudioPlayer] = [:]
    private static var synthCache: [String: Data] = [:]

    static func play(_ kind: Kind) {
        if chime == .off { return }
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        switch kind {
        case .whoosh: playFile("zen_whoosh", volume: 0.75)
        case .reward: playFile("zen_reward", volume: 0.9)
        case .redeem: playFile("zen_redeem", volume: 0.9)
        case .miss: playFile("zen_miss", volume: 0.8)
        case .success: if let f = chime.file { playFile(f, volume: 0.9) }
        case .pending, .failure: playSynth(kind)
        }
    }

    private static var scratchIndex = 0
    /// A short scratch-off rub (rotates through three CC0 clips; callers throttle).
    static func scratch() {
        if chime == .off { return }
        scratchIndex = (scratchIndex + 1) % 3
        playFile("zen_scratch_\(scratchIndex + 1)", volume: 0.55)
    }

    /// Preview from the picker.
    static func preview(_ c: Chime) {
        guard let f = c.file else { return }
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        playFile(f, volume: 0.9)
    }

    private static func playFile(_ name: String, volume: Float) {
        guard let url = Bundle.main.url(forResource: name, withExtension: "wav") else { return }
        let p = players[name] ?? (try? AVAudioPlayer(contentsOf: url))
        players[name] = p
        p?.volume = volume
        p?.currentTime = 0
        p?.play()
    }

    // MARK: Synth (pending / failure)

    private static func playSynth(_ kind: Kind) {
        let key = "\(kind)"
        let data = synthCache[key] ?? makeWAV(for: kind)
        synthCache[key] = data
        let p = try? AVAudioPlayer(data: data)
        players[key] = p
        p?.volume = 0.7
        p?.play()
    }

    private static func notes(for kind: Kind) -> [(freq: Double, start: Double, len: Double, gain: Double)] {
        switch kind {
        case .pending: [(987.8, 0.00, 0.50, 0.5)]
        case .failure: [(311.1, 0.00, 0.28, 0.6), (233.1, 0.16, 0.45, 0.6)]
        default: []
        }
    }

    private static func makeWAV(for kind: Kind) -> Data {
        let rate = 44_100.0
        let spec = notes(for: kind)
        let duration = (spec.map { $0.start + $0.len }.max() ?? 0.6) + 0.05
        let n = Int(duration * rate)
        var samples = [Int16](repeating: 0, count: n)
        for note in spec {
            let startIdx = Int(note.start * rate), len = Int(note.len * rate)
            for i in 0..<len where startIdx + i < n {
                let t = Double(i) / rate
                let attack = min(1, t / 0.004)
                let decay = exp(-t * 6.8)
                let tone = sin(2 * .pi * note.freq * t) + 0.25 * sin(2 * .pi * note.freq * 2 * t)
                let v = tone * attack * decay * note.gain * 0.5
                let mixed = Double(samples[startIdx + i]) / Double(Int16.max) + v
                samples[startIdx + i] = Int16(max(-1, min(1, mixed)) * Double(Int16.max))
            }
        }
        var d = Data()
        func u32(_ v: UInt32) { var x = v.littleEndian; d.append(Data(bytes: &x, count: 4)) }
        func u16(_ v: UInt16) { var x = v.littleEndian; d.append(Data(bytes: &x, count: 2)) }
        let dataSize = UInt32(n * 2)
        d.append("RIFF".data(using: .ascii)!); u32(36 + dataSize); d.append("WAVE".data(using: .ascii)!)
        d.append("fmt ".data(using: .ascii)!); u32(16); u16(1); u16(1); u32(UInt32(rate)); u32(UInt32(rate) * 2); u16(2); u16(16)
        d.append("data".data(using: .ascii)!); u32(dataSize)
        samples.withUnsafeBufferPointer { d.append(Data(buffer: $0)) }
        return d
    }
}
