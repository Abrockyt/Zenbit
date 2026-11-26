import SwiftUI
import UIKit

/// The picture layer of an ad.
/// • If a photo named `ad-<offer>` exists in the asset catalog (e.g. `ad-flights`), it is shown full-bleed with a
///   slow Ken-Burns zoom and a legibility scrim.
/// • Otherwise a rich animated scene is drawn in SwiftUI (gliding plane, floating bokeh, shimmering gold, pulsing
///   shield…), so every ad already looks alive before photos are added.
struct AdMedia: View {
    let offer: Offer
    var body: some View {
        if let photo = offer.photoName, UIImage(named: photo) != nil {
            PhotoLayer(name: photo)
        } else {
            SceneLayer(offer: offer)
        }
    }
}

extension Offer {
    /// Asset-catalog name for this offer's photo.
    var photoName: String? { "ad-\(rawValue)" }
}

// MARK: - Photo

private struct PhotoLayer: View {
    let name: String
    @State private var zoom = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        GeometryReader { geo in
            Image(name)
                .resizable()
                .scaledToFill()
                .frame(width: geo.size.width, height: geo.size.height)
                .scaleEffect(zoom ? 1.08 : 1.0)
                .clipped()
                .overlay {
                    LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.55)], startPoint: .center, endPoint: .bottom)
                }
        }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 14).repeatForever(autoreverses: true)) { zoom = true }
        }
    }
}

// MARK: - Animated scenes

private struct SceneLayer: View {
    let offer: Offer
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 30, paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 0 : ctx.date.timeIntervalSinceReferenceDate
            GeometryReader { geo in
                let w = geo.size.width, h = geo.size.height
                ZStack {
                    switch offer {
                    case .flights: flights(w, h, t)
                    case .food: food(w, h, t)
                    case .earbuds: earbuds(w, h, t)
                    case .gold: gold(w, h, t)
                    case .insurance: insurance(w, h, t)
                    }
                }
                .frame(width: w, height: h)
                .clipped()
            }
        }
    }

    // ✈︎ Skyline Travels – sky, drifting clouds, a plane gliding across with a contrail
    private func flights(_ w: CGFloat, _ h: CGFloat, _ t: Double) -> some View {
        let px = CGFloat((t * 22).truncatingRemainder(dividingBy: Double(w + 160))) - 80
        let py = h * 0.42 + CGFloat(sin(t * 0.8)) * 6 - px * 0.10
        return ZStack {
            LinearGradient(colors: [Color(hex: 0x1D6FE0), Color(hex: 0x6FB4FF), Color(hex: 0xCFE8FF)], startPoint: .top, endPoint: .bottom)
            ForEach(0..<5, id: \.self) { i in
                let x = (CGFloat(t * [6, 9, 5, 8, 4][i]) + CGFloat(i) * w * 0.32).truncatingRemainder(dividingBy: w + 200) - 100
                Cloud().fill(.white.opacity(0.75 + 0.05 * Double(i % 3)))
                    .frame(width: [120, 90, 150, 80, 110][i], height: [44, 34, 54, 30, 42][i])
                    .position(x: x, y: h * [0.18, 0.62, 0.78, 0.40, 0.90][i])
            }
            // contrail
            Capsule().fill(LinearGradient(colors: [.white.opacity(0), .white.opacity(0.85)], startPoint: .leading, endPoint: .trailing))
                .frame(width: 140, height: 5).blur(radius: 1.5)
                .rotationEffect(.degrees(-6)).position(x: px - 78, y: py + 10)
            Image(systemName: "airplane").font(.system(size: 44, weight: .regular)).foregroundStyle(.white)
                .shadow(color: .black.opacity(0.18), radius: 8, y: 6)
                .rotationEffect(.degrees(-6)).position(x: px, y: py)
        }
    }

    // 🍜 Tiffin & Co. – warm gradient, drifting bokeh, steam, a bag floating
    private func food(_ w: CGFloat, _ h: CGFloat, _ t: Double) -> some View {
        ZStack {
            LinearGradient(colors: [Color(hex: 0xF25C2A), Color(hex: 0xFF8A4C), Color(hex: 0xFFB36B)], startPoint: .topLeading, endPoint: .bottomTrailing)
            bokeh(w, h, t)
            Image(systemName: "takeoutbag.and.cup.and.straw.fill")
                .font(.system(size: min(h * 0.5, 92))).foregroundStyle(.white.opacity(0.96))
                .shadow(color: .black.opacity(0.18), radius: 10, y: 8)
                .rotationEffect(.degrees(sin(t * 1.1) * 4))
                .offset(y: CGFloat(sin(t * 1.4)) * 5)
                .position(x: w * 0.78, y: h * 0.52)
            // steam
            ForEach(0..<3, id: \.self) { i in
                let q = ((t * 0.5 + Double(i) * 0.33).truncatingRemainder(dividingBy: 1))
                Capsule().fill(.white.opacity(0.5 * (1 - q))).frame(width: 4, height: 18)
                    .blur(radius: 2).position(x: w * 0.74 + CGFloat(i) * 12, y: h * 0.24 - CGFloat(q) * 26)
            }
        }
    }

    private func bokeh(_ w: CGFloat, _ h: CGFloat, _ t: Double) -> some View {
        let sizes: [CGFloat] = [34, 22, 46, 18, 28, 38, 16, 26, 42]
        return ZStack {
            ForEach(0..<9, id: \.self) { i in
                let fi = Double(i)
                let x: CGFloat = w * (0.1 + 0.1 * CGFloat(i)) + CGFloat(sin(t * 0.6 + fi)) * 10
                let rise: Double = (t * (10 + fi * 2) + fi * 30).truncatingRemainder(dividingBy: Double(h) * 1.2)
                let y: CGFloat = h * 1.1 - CGFloat(rise)
                let alpha: Double = 0.10 + 0.05 * Double(i % 3)
                Circle().fill(Color.white.opacity(alpha)).frame(width: sizes[i]).position(x: x, y: y)
            }
        }
    }

    // 🎧 Vybe Audio – dark stage, rotating light ring, floating earbuds
    private func earbuds(_ w: CGFloat, _ h: CGFloat, _ t: Double) -> some View {
        ZStack {
            LinearGradient(colors: [Color(hex: 0x1B1F2A), Color(hex: 0x07080C)], startPoint: .top, endPoint: .bottom)
            Circle().strokeBorder(AngularGradient(colors: [Color(hex: 0x4F7CFF), Color(hex: 0x8B5CF6), Color(hex: 0xFF5FA2), Color(hex: 0x4F7CFF)],
                                                  center: .center, angle: .degrees(t * 40)), lineWidth: 5)
                .frame(width: min(h * 0.8, 150)).blur(radius: 6).opacity(0.9)
                .position(x: w * 0.74, y: h * 0.5)
            Circle().fill(RadialGradient(colors: [.white.opacity(0.18), .clear], center: .center, startRadius: 0, endRadius: 80))
                .frame(width: 170).position(x: w * 0.74, y: h * 0.5)
            Image(systemName: "airpods.pro").font(.system(size: min(h * 0.46, 84))).foregroundStyle(.white)
                .shadow(color: Color(hex: 0x8B5CF6).opacity(0.6), radius: 18)
                .offset(y: CGFloat(sin(t * 1.3)) * 6).rotationEffect(.degrees(sin(t * 0.9) * 5))
                .position(x: w * 0.74, y: h * 0.5)
        }
    }

    // 🪙 AuGold – gold gradient, sweeping shine, stacked coins
    private func gold(_ w: CGFloat, _ h: CGFloat, _ t: Double) -> some View {
        let shine = CGFloat((t * 0.35).truncatingRemainder(dividingBy: 1))
        return ZStack {
            LinearGradient(colors: [Color(hex: 0xFFE9A6), Color(hex: 0xE8B53C), Color(hex: 0xB9801A)], startPoint: .topLeading, endPoint: .bottomTrailing)
            ForEach(0..<4, id: \.self) { i in
                ZStack {
                    Ellipse().fill(Color(hex: 0x9A6A12)).frame(width: 74, height: 26).offset(y: 5)
                    Ellipse().fill(LinearGradient(colors: [Color(hex: 0xFFF1B8), Color(hex: 0xE2A82E)], startPoint: .top, endPoint: .bottom))
                        .frame(width: 74, height: 26)
                    Text("₹").font(.system(size: 13, weight: .heavy, design: .rounded)).foregroundStyle(Color(hex: 0x9A6A12))
                }
                .position(x: w * 0.76, y: h * 0.74 - CGFloat(i) * 17 + CGFloat(sin(t * 1.2 + Double(i))) * 1.5)
            }
            LinearGradient(colors: [.white.opacity(0), .white.opacity(0.5), .white.opacity(0)], startPoint: .leading, endPoint: .trailing)
                .frame(width: w * 0.3).rotationEffect(.degrees(18))
                .offset(x: -w * 0.2 + shine * w * 1.5)
        }
    }

    // 🛡 CoverKart – violet, pulsing rings, a shield
    private func insurance(_ w: CGFloat, _ h: CGFloat, _ t: Double) -> some View {
        ZStack {
            LinearGradient(colors: [Color(hex: 0x4B3AB8), Color(hex: 0x2A1E78), Color(hex: 0x15103F)], startPoint: .topLeading, endPoint: .bottomTrailing)
            ForEach(0..<3, id: \.self) { i in
                let q = (t * 0.45 + Double(i) / 3).truncatingRemainder(dividingBy: 1)
                Circle().strokeBorder(.white.opacity(0.35 * (1 - q)), lineWidth: 2)
                    .frame(width: 60 + CGFloat(q) * 150).position(x: w * 0.76, y: h * 0.5)
            }
            Image(systemName: "checkmark.shield.fill").font(.system(size: min(h * 0.44, 78)))
                .foregroundStyle(LinearGradient(colors: [.white, Color(hex: 0xC9C7FF)], startPoint: .top, endPoint: .bottom))
                .shadow(color: Color(hex: 0x8B5CF6).opacity(0.7), radius: 16)
                .scaleEffect(1 + CGFloat(sin(t * 1.6)) * 0.03)
                .position(x: w * 0.76, y: h * 0.5)
        }
    }
}

#Preview {
    VStack { ForEach(Offer.allCases) { AdMedia(offer: $0).frame(height: 130).clipShape(.rect(cornerRadius: 22)) } }.padding()
}
