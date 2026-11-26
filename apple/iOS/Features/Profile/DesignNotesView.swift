import SwiftUI

/// In-app design rationale so reviewers/clients can see *why* each screen is the way it is.
/// The long-form version lives in apple/DESIGN.md.
struct DesignNote: Identifiable {
    let id = UUID()
    let screen: String
    let symbol: String
    let decisions: [(law: String, why: String)]
}

enum DesignNotes {
    static let all: [DesignNote] = [
        DesignNote(screen: "Welcome", symbol: "sparkles", decisions: [
            ("Aesthetic–Usability", "A real 3D coin and calm fluid background build trust before the first tap."),
            ("Hick's law", "One primary action (Get started); sign-in is a quiet secondary."),
        ]),
        DesignNote(screen: "Sign-up", symbol: "person.badge.key", decisions: [
            ("Goal-gradient", "A 4-step progress bar keeps the finish line visible."),
            ("Postel's law", "Phone accepts +91, spaces, dashes and pasted text; OTP autofills from Messages."),
            ("Tesler's law", "Bank discovery is automatic from the phone number — the system takes the complexity."),
        ]),
        DesignNote(screen: "Home", symbol: "house", decisions: [
            ("Pareto", "Scan, Pay contact, To bank and Request cover most sessions, so they lead."),
            ("Fitts's law", "60 pt action tiles and the people grid sit in the thumb zone."),
            ("Von Restorff", "Only Scan & Pay is filled green; scam requests are the only red element."),
            ("Privacy", "Balance is hidden until UPI PIN and hides itself again after 30 s."),
        ]),
        DesignNote(screen: "Amount", symbol: "indianrupeesign", decisions: [
            ("Jakob's law", "Payee, big amount and keypad mirror GPay/PhonePe/Paytm so nothing must be relearned."),
            ("Postel's law", "Leading zeros, double dots and >2 decimals are quietly rejected with a haptic, not an alert."),
            ("Error prevention", "Limits, balance and non-UPI contacts are explained inline before Pay is enabled."),
            ("Trust", "Banking name and verified seal are shown — the #1 defence against wrong-payee mistakes."),
        ]),
        DesignNote(screen: "UPI PIN", symbol: "lock.shield", decisions: [
            ("Doherty threshold", "PIN feedback in under 400 ms; wrong PIN shakes with attempts left."),
            ("Safety", "3 wrong attempts lock the PIN with a live countdown."),
        ]),
        DesignNote(screen: "Payment journey", symbol: "arrow.up.forward.circle", decisions: [
            ("Peak–End rule", "The coin flies into the payee inside a Dynamic-Island capsule — the memorable end."),
            ("Doherty / perceived value", "Motion starts instantly but resolves after ≥0.9 s so success feels deliberate."),
            ("Accessibility", "Reduce Motion swaps the flight for a cross-fade; status is never colour-only."),
        ]),
        DesignNote(screen: "Activity", symbol: "list.bullet.rectangle", decisions: [
            ("Common region", "Payments are grouped by day in inset cards."),
            ("Postel's law", "Search matches name, note, amount or UPI reference."),
            ("Zeigarnik", "Processing payments stay visible with a timeline until they settle."),
        ]),
        DesignNote(screen: "Zen AI", symbol: "sparkles", decisions: [
            ("Apple HIG – AI", "AI is labelled, runs on-device when available, and never sends money by itself."),
            ("Hick's law", "Suggested prompts show what's possible instead of a blank box."),
            ("Glow = working", "The green glow appears only while the model is thinking, like Siri's edge light."),
        ]),
        DesignNote(screen: "Profile", symbol: "person.crop.circle", decisions: [
            ("Jakob's law", "Settings-style grouped list people already know."),
            ("Miller's law", "Chunked into Payments, Security, Preferences, About."),
            ("Data minimisation", "Name and phone come from the bank; only an optional email is asked."),
        ]),
    ]
}

struct DesignNotesView: View {
    var body: some View {
        List {
            ForEach(DesignNotes.all) { note in
                Section {
                    ForEach(note.decisions.indices, id: \.self) { i in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(note.decisions[i].law).font(.subheadline.weight(.semibold)).foregroundStyle(ZB.Palette.greenInk)
                            Text(note.decisions[i].why).font(.subheadline)
                        }
                        .padding(.vertical, 2)
                    }
                } header: {
                    Label(note.screen, systemImage: note.symbol)
                }
            }
        }
        .navigationTitle("Design notes")
    }
}
