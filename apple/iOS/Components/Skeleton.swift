import SwiftUI

// MARK: - Wireframe loading
//
// Skeletons keep the *shape* of what's coming (Doherty: the app feels instant; Goal-gradient: people see
// the structure fill in). Blocks are outlined wireframes with a soft light sweep, not blank spinners.

/// Light sweep across a view.
private struct Sweep: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    func body(content: Content) -> some View {
        content.overlay {
            if !reduceMotion {
                TimelineView(.animation) { ctx in
                    let t = ctx.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 1.5) / 1.5
                    GeometryReader { geo in
                        LinearGradient(colors: [.white.opacity(0), .white.opacity(0.9), .white.opacity(0)], startPoint: .leading, endPoint: .trailing)
                            .frame(width: geo.size.width * 0.32)
                            .offset(x: CGFloat(t) * geo.size.width * 1.4 - geo.size.width * 0.32)
                    }
                }
                .allowsHitTesting(false)
            }
        }
        .clipped()
    }
}

extension View { func wireSweep() -> some View { modifier(Sweep()) } }

/// One wireframe block: outline + faint fill.
struct Wire: View {
    var width: CGFloat? = nil
    var height: CGFloat
    var radius: CGFloat = 12
    var circle = false

    var body: some View {
        Group {
            if circle {
                Circle().fill(ZB.Palette.surface).overlay(Circle().strokeBorder(ZB.Palette.inkTertiary.opacity(0.28), lineWidth: 1.2))
            } else {
                RoundedRectangle(cornerRadius: radius, style: .continuous).fill(ZB.Palette.surface)
                    .overlay(RoundedRectangle(cornerRadius: radius, style: .continuous).strokeBorder(ZB.Palette.inkTertiary.opacity(0.28), lineWidth: 1.2))
            }
        }
        .frame(width: circle ? height : width, height: height)
        .frame(maxWidth: width == nil && !circle ? .infinity : nil)
    }
}

/// App launch: the Home layout as a wireframe.
struct HomeWireframe: View {
    var body: some View {
        ZStack(alignment: .top) {
            ZB.Palette.canvas.ignoresSafeArea()
            VStack(spacing: ZB.Space.xxl) {
                // hero + header controls
                ZStack(alignment: .top) {
                    Wire(height: 300, radius: 0).opacity(0.7)
                    HStack(spacing: ZB.Space.xs) {
                        Wire(height: 44, circle: true)
                        Spacer()
                        Wire(height: 44, circle: true)
                        Wire(height: 44, circle: true)
                        Wire(height: 44, circle: true)
                    }
                    .padding(.horizontal, ZB.Space.md)
                    .padding(.top, IslandGeometry.windowTopInset + 4)
                }
                .ignoresSafeArea(edges: .top)
                .frame(height: 300)

                VStack(spacing: ZB.Space.xxl) {
                    // four actions
                    HStack(alignment: .top, spacing: ZB.Space.xs) {
                        ForEach(0..<4, id: \.self) { _ in
                            VStack(spacing: 10) { Wire(height: 64, circle: true); Wire(width: 56, height: 10, radius: 5) }
                                .frame(maxWidth: .infinity)
                        }
                    }
                    // chips
                    HStack(spacing: ZB.Space.xs) {
                        Wire(width: 118, height: 40, radius: 20)
                        Wire(width: 168, height: 40, radius: 20)
                        Wire(width: 60, height: 40, radius: 20)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    // People
                    VStack(alignment: .leading, spacing: ZB.Space.md) {
                        Wire(width: 90, height: 18, radius: 6)
                        HStack(spacing: ZB.Space.xs) {
                            ForEach(0..<4, id: \.self) { _ in
                                VStack(spacing: 8) { Wire(height: 56, circle: true); Wire(width: 44, height: 9, radius: 4) }
                                    .frame(maxWidth: .infinity)
                            }
                        }
                    }
                    // card
                    Wire(height: 150, radius: 22)
                }
                .padding(.horizontal, ZB.Space.margin)
                Spacer(minLength: 0)
            }
        }
        .wireSweep()
        .accessibilityElement()
        .accessibilityLabel("Loading")
    }
}

/// A page while it loads: title line, a hero block and a few rows.
struct PageWireframe: View {
    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.lg) {
            Wire(width: 160, height: 26, radius: 8)
            Wire(height: 150, radius: 22)
            ForEach(0..<4, id: \.self) { _ in
                HStack(spacing: ZB.Space.md) {
                    Wire(height: 44, circle: true)
                    VStack(alignment: .leading, spacing: 8) {
                        Wire(width: 180, height: 12, radius: 6)
                        Wire(width: 120, height: 10, radius: 5)
                    }
                    Spacer()
                    Wire(width: 48, height: 14, radius: 6)
                }
            }
            Spacer()
        }
        .padding(ZB.Space.margin)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(ZB.Palette.canvas)
        .wireSweep()
        .accessibilityElement()
        .accessibilityLabel("Loading")
    }
}

/// Shows the page wireframe briefly when a page opens, then fades the real content in.
private struct PageLoad: ViewModifier {
    var duration: Double
    @State private var loaded = false

    func body(content: Content) -> some View {
        content
            .opacity(loaded ? 1 : 0)
            .overlay {
                if !loaded { PageWireframe().transition(.opacity) }
            }
            .task {
                #if DEBUG
                if UserDefaults.standard.string(forKey: "ZBScreen") != nil, !UserDefaults.standard.bool(forKey: "ZBSkeleton") {
                    loaded = true; return
                }
                #endif
                try? await Task.sleep(for: .seconds(duration))
                withAnimation(.easeOut(duration: 0.3)) { loaded = true }
            }
    }
}

extension View {
    /// Wireframe → content, for pages that would otherwise pop in.
    func pageLoad(_ duration: Double = 0.55) -> some View { modifier(PageLoad(duration: duration)) }
}
