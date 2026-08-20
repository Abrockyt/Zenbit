import StatusBar from "../navigation/StatusBar";
import HomeIndicator from "../navigation/HomeIndicator";

// Presentation shell for the app — not part of the product itself, per the
// design system's "intentional additions" note. Desktop browsers get a
// bezelled device frame; narrow viewports (see base.css) go edge-to-edge.
export default function PhoneFrame({ children, tabBar, statusBar = true, indicator = true }) {
  return (
    <div className="zb-app-shell">
      <div className="zb-phone">
        <div className="zb-phone-screen">
          {statusBar ? <StatusBar /> : null}
          {children}
          {tabBar}
          {indicator ? <HomeIndicator /> : null}
        </div>
      </div>
    </div>
  );
}
