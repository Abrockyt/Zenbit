import SwiftUI

/// Navigation = Apple's own iOS 26 tab bar (Liquid Glass), behaving like Apple Music:
/// • `tabBarMinimizeBehavior(.onScrollDown)` – scroll down and the bar shrinks to the current tab;
///   scroll up and it springs back. System physics, so it's as fluid as Music.
/// • `tabViewBottomAccessory` – where Music shows the mini-player we show a rotating sponsored
///   offer. When the bar minimises, the accessory slides *inline* between the tab and Search.
/// • Search uses the system `.search` role (separate circle on the right, not highlighted).
/// iPad / unfolded foldables: the same TabView adapts into a sidebar.
struct MainTabs: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model
        TabView(selection: $model.selectedTab) {
            Tab(value: AppTab.home) { HomeView() } label: { TabLabel(title: "Home", symbol: "house") }
            Tab(value: AppTab.history) { HistoryView() } label: { TabLabel(title: "History", symbol: "list.bullet.rectangle") }
            Tab(value: AppTab.rewards) { NavigationStack { RewardsView() } } label: { TabLabel(title: "Rewards", symbol: "gift") }
            Tab(value: AppTab.profile) { ProfileView() } label: { TabLabel(title: "Profile", symbol: "person") }
            Tab(value: AppTab.pay, role: .search) { PaySearchView() } label: { TabLabel(title: "Search", symbol: "magnifyingglass") }
        }
        .tabViewStyle(.sidebarAdaptable)
        .tabBarMinimizeBehavior(.onScrollDown)
        .tabViewBottomAccessory(isEnabled: model.tabBarMinimized) { TabAdAccessory() }
        .tint(ZB.Palette.greenDeep)
        .onChange(of: model.selectedTab) { old, _ in
            model.previousTab = old
            model.tabBarMinimized = false          // the bar is fully shown on a fresh tab
        }
    }
}

// MARK: - Ad in the gap (only while the tab bar is shrunk)

/// When the tab bar shrinks on scroll down, the gap between the Home circle and the Search circle holds a one-line
/// sponsored strip. Scrolling back up expands the bar and the strip disappears.
private struct TabAdAccessory: View {
    @Environment(\.tabViewBottomAccessoryPlacement) private var placement
    @State private var showOffer = false

    var body: some View {
        Button { showOffer = true } label: {
            HStack(spacing: 8) {
                MerchantLogo(asset: "brand-zomato", size: 26)
                VStack(alignment: .leading, spacing: 0) {
                    Text("₹150 off your first 3 orders").font(.system(size: 12, weight: .semibold)).foregroundStyle(ZB.Palette.ink).lineLimit(1)
                    Text("Zomato · Ad").font(.system(size: 10)).foregroundStyle(ZB.Palette.inkSecondary)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 10)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showOffer) { NavigationStack { OfferPage(offer: .food) }.presentationDetents([.large]) }
        .accessibilityLabel("Sponsored: Zomato, ₹150 off your first 3 orders")
    }
}

/// Smaller, lighter glyphs than the default tab icons (system default is ~25 pt; these are 18 pt medium),
/// filled automatically by the system when selected.
private struct TabLabel: View {
    let title: String
    let symbol: String
    var body: some View {
        Label {
            Text(title)
        } icon: {
            Image(uiImage: UIImage(systemName: symbol,
                                   withConfiguration: UIImage.SymbolConfiguration(pointSize: 18, weight: .medium))!
                .withRenderingMode(.alwaysTemplate))
        }
    }
}

// MARK: - Compatibility shims (old custom bar)

extension View {
    /// The system tab bar now minimises on scroll by itself.
    func minimizesTabBar() -> some View { self }
}

/// Back button for tab roots (returns to where you came from, default Home).
struct TabBackButton: ViewModifier {
    @Environment(AppModel.self) private var model
    func body(content: Content) -> some View {
        content.toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    withAnimation(ZB.Motion.standard) {
                        model.selectedTab = model.previousTab == model.selectedTab ? .home : model.previousTab
                    }
                } label: {
                    Image(systemName: "chevron.left").font(.system(size: 17, weight: .semibold))
                }
                .accessibilityLabel("Back")
            }
        }
    }
}

extension View {
    func tabBackButton() -> some View { modifier(TabBackButton()) }
}

private struct TabBarInsetKey: EnvironmentKey { static let defaultValue: CGFloat = 0 }
extension EnvironmentValues {
    /// Kept for layouts that predate the system bar; always 0 now (the system handles safe areas).
    var zbTabBarInset: CGFloat {
        get { self[TabBarInsetKey.self] }
        set { self[TabBarInsetKey.self] = newValue }
    }
}


// MARK: - Scroll tracking (mirrors the system's shrink / expand of the tab bar)

private struct TracksTabBarScroll: ViewModifier {
    @Environment(AppModel.self) private var model
    func body(content: Content) -> some View {
        content.onScrollGeometryChange(for: CGFloat.self) { $0.contentOffset.y + $0.contentInsets.top } action: { old, new in
            if new < 40 { if model.tabBarMinimized { withAnimation(ZB.Motion.standard) { model.tabBarMinimized = false } } }
            else if new > old + 3, new > 90 { if !model.tabBarMinimized { withAnimation(ZB.Motion.standard) { model.tabBarMinimized = true } } }
            else if new < old - 3 { if model.tabBarMinimized { withAnimation(ZB.Motion.standard) { model.tabBarMinimized = false } } }
        }
    }
}

extension View {
    /// Put on a tab's main scroll view: scrolling down marks the tab bar as shrunk, scrolling up as expanded.
    func tracksTabBarScroll() -> some View { modifier(TracksTabBarScroll()) }
}
