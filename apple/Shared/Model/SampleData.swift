import Foundation

/// Deterministic demo data so every launch, preview and screenshot looks identical.
enum SampleData {
    static let profile = UserProfile(
        name: "Aarav Mehta", phone: "9876543210", upiID: "aarav@zenbit",
        email: "aarav.mehta@example.com", kycVerified: true, hue: 0.42)

    static let accounts: [BankAccount] = [
        BankAccount(bankName: "HDFC Bank", last4: "4821", isPrimary: true, balance: 48_250.75, ifsc: "HDFC0001234"),
        BankAccount(bankName: "State Bank of India", last4: "0937", balance: 12_430, ifsc: "SBIN0004567"),
    ]

    static let contacts: [Contact] = [
        Contact(name: "Riya Sharma", upiID: "riya.sharma@okzen", phone: "9810011223", hue: 0.93, isFavorite: true, bankName: "ICICI Bank"),
        Contact(name: "Arjun Nair", upiID: "arjun.nair@okaxis", phone: "9820022334", hue: 0.58, isFavorite: true, bankName: "Axis Bank"),
        Contact(name: "Kabir Singh", upiID: "kabirs@ybl", phone: "9830033445", hue: 0.08, isFavorite: true),
        Contact(name: "Meera Iyer", upiID: "meera.iyer@okhdfc", phone: "9840044556", hue: 0.75, isFavorite: true),
        Contact(name: "Ishaan Gupta", upiID: "ishaan@paytm", phone: "9850055667", hue: 0.33),
        Contact(name: "Ananya Rao", upiID: "ananya.rao@oksbi", phone: "9860066778", hue: 0.66, bankName: "State Bank of India"),
        Contact(name: "Vihaan Das", upiID: "vihaan.d@okicici", phone: "9870077889", hue: 0.15),
        Contact(name: "Sara Khan", upiID: "sarak@ibl", phone: "9880088990", hue: 0.85),
        Contact(name: "Dev Patel", upiID: "", phone: "9890099001", hue: 0.5, isOnUPI: false),
        Contact(name: "Blue Tokai Coffee", upiID: "bluetokai.koramangala@okhdfc", phone: "8000011111", hue: 0.55, bankName: "HDFC Bank", isMerchant: true),
        Contact(name: "Fresh Basket Mart", upiID: "freshbasket@ybl", phone: "8000022222", hue: 0.3, isMerchant: true),
        Contact(name: "BESCOM Electricity", upiID: "bescom@okaxis", phone: "8000033333", hue: 0.12, isMerchant: true),
        Contact(name: "Zomato", upiID: "zomato@icici", phone: "8000044444", hue: 0.98, bankName: "ICICI Bank", isMerchant: true),
        Contact(name: "Swiggy", upiID: "swiggy@axisbank", phone: "8000055555", hue: 0.07, bankName: "Axis Bank", isMerchant: true),
        Contact(name: "Uber", upiID: "uber@hdfcbank", phone: "8000066666", hue: 0.0, isMerchant: true),
        Contact(name: "BookMyShow", upiID: "bookmyshow@icici", phone: "8000077777", hue: 0.99, bankName: "ICICI Bank", isMerchant: true),
        Contact(name: "BigBasket", upiID: "bigbasket@hdfcbank", phone: "8000088888", hue: 0.25, isMerchant: true),
        Contact(name: "Amazon", upiID: "amazonpay@apl", phone: "8000099999", hue: 0.1, isMerchant: true),
        Contact(name: "Airtel", upiID: "airtel@axisbank", phone: "8000010101", hue: 0.99, bankName: "Axis Bank", isMerchant: true),
        Contact(name: "Spotify", upiID: "spotify@icici", phone: "8000020202", hue: 0.38, isMerchant: true),
    ]

    /// Extra faces for onboarding illustrations (not contacts).
    static let orbitPeople: [Contact] = contacts.filter { !$0.isMerchant } + [
        Contact(name: "Nisha", upiID: "", phone: "", hue: 0.1),
        Contact(name: "Tara", upiID: "", phone: "", hue: 0.2),
        Contact(name: "Zoya", upiID: "", phone: "", hue: 0.3),
        Contact(name: "Aarav Mehta", upiID: "", phone: "", hue: 0.42),
    ]

    /// A normal request – only shown after the person has made their first payment.
    static let requests: [MoneyRequest] = [
        MoneyRequest(from: contacts.first { $0.firstName == "Kabir" }!, amount: 500, note: "Cab split",
                     date: Date().addingTimeInterval(-3_600 * 5)),
    ]
    /// A scam-pattern collect request. Lives in Notifications (with a warning), never on Home.
    static let flaggedRequests: [MoneyRequest] = [
        MoneyRequest(from: Contact(name: "Rewards Desk", upiID: "cashback.reward77@ybl", phone: "", hue: 0.02),
                     amount: 4_999, note: "You won ₹5,000! Enter PIN to receive", date: Date().addingTimeInterval(-900),
                     isSuspicious: true),
    ]

    // MARK: Rewards
    static let rewards: [Reward] = {
        let now = Date()
        func d(_ days: Double) -> Date { now.addingTimeInterval(-days * 86_400) }
        return [
            Reward(kind: .cashback, title: "0.5% cashback", source: "Paid ₹340 to Blue Tokai Coffee", amount: 1.70, date: d(0.1)),
            Reward(kind: .cashback, title: "0.5% cashback", source: "Paid ₹250 to Riya Sharma", amount: 1.25, date: d(0.3)),
            Reward(kind: .scratch, title: "Scratch card", source: "Won on your 10th payment this month", amount: 21, date: d(1)),
            Reward(kind: .referral, title: "Referral bonus", source: "Arjun Nair made his first payment", amount: 250, date: d(3)),
            Reward(kind: .milestone, title: "First split bonus", source: "Split ₹1,200 with Arjun & Kabir", amount: 100, date: d(6)),
            Reward(kind: .cashback, title: "0.5% cashback", source: "Paid ₹2,340 to BESCOM Electricity", amount: 11.70, date: d(3.2)),
            Reward(kind: .voucher, title: "Voucher unlocked", source: "Paid 3 bills on time", amount: 0, date: d(8)),
        ]
    }()

    static let scratchCards: [ScratchCard] = [
        ScratchCard(amount: 15, from: "Payment to Riya", brand: "Zomato"),
        ScratchCard(amount: 0, from: "Weekend streak",
                    coupon: Voucher(brand: "Swiggy", offer: "₹75 off your next order", code: "ZENYUM", symbol: "fork.knife", hue: 0.06,
                                    expires: Date().addingTimeInterval(86_400 * 9)), brand: "Swiggy"),
        ScratchCard(amount: 0, from: "Paid a bill", brand: "BookMyShow"),
        ScratchCard(amount: 50, from: "Paid 3 bills", brand: "Uber"),
    ]

    static let vouchers: [Voucher] = [
        Voucher(brand: "Zomato", offer: "₹100 off food orders above ₹299", code: "ZEN100", symbol: "fork.knife", hue: 0.98, expires: Date().addingTimeInterval(86_400 * 6)),
        Voucher(brand: "BookMyShow", offer: "Buy 1 get 1 on movie tickets", code: "ZENB1G1", symbol: "film.fill", hue: 0.99, expires: Date().addingTimeInterval(86_400 * 12)),
        Voucher(brand: "Flipkart", offer: "15% off fashion, up to ₹500", code: "ZEN15", symbol: "tshirt.fill", hue: 0.6, expires: Date().addingTimeInterval(86_400 * 20)),
        Voucher(brand: "Uber", offer: "₹50 off your next ride", code: "ZENRIDE", symbol: "car.fill", hue: 0, expires: Date().addingTimeInterval(86_400 * 9)),
        Voucher(brand: "Spotify", offer: "1 month of Premium free", code: "ZENMUSIC", symbol: "music.note", hue: 0.38, expires: Date().addingTimeInterval(86_400 * 30)),
        Voucher(brand: "Amazon", offer: "₹200 off on orders above ₹1,499", code: "ZENSHOP", symbol: "bag.fill", hue: 0.1, expires: Date().addingTimeInterval(86_400 * 15)),
    ]

    static let earnTasks: [EarnTask] = [
        EarnTask(title: "Refer a friend", detail: "Get ₹250 when they make their first payment", reward: "₹250", symbol: "person.badge.plus", progress: 0),
        EarnTask(title: "Your first split", detail: "Split a bill and earn up to ₹100", reward: "Up to ₹100", symbol: "person.2", progress: 1),
        EarnTask(title: "Pay 3 bills this month", detail: "Electricity, mobile, broadband… any 3", reward: "₹50", symbol: "bolt", progress: 0.34),
        EarnTask(title: "Turn on UPI Lite", detail: "Tap-and-go payments under ₹500", reward: "₹25", symbol: "bolt.fill", progress: 1),
        EarnTask(title: "Pay at 5 new shops", detail: "Scan any QR at a store you haven't paid before", reward: "Scratch card", symbol: "storefront", progress: 0.6),
    ]

    static func contact(_ first: String) -> Contact {
        contacts.first { $0.firstName == first }!
    }

    static let transactions: [Transaction] = {
        let cal = Calendar.current
        let now = Date()
        func ago(days: Int, hour: Int, minute: Int = 0) -> Date {
            let day = cal.date(byAdding: .day, value: -days, to: now)!
            return cal.date(bySettingHour: hour, minute: minute, second: 0, of: day) ?? day
        }
        var seq = 0
        func tx(_ who: String, _ amount: Decimal, _ dir: TxDirection, _ status: TxStatus = .success,
                days: Int, hour: Int, minute: Int = 12, note: String = "", cat: TxCategory = .transfer,
                reason: String? = nil) -> Transaction {
            seq += 1
            let c = contacts.first { $0.firstName == who || $0.name == who }!
            return Transaction(counterparty: c, amount: amount, direction: dir, status: status,
                               date: ago(days: days, hour: hour, minute: minute), note: note, category: cat,
                               upiRef: "4" + String(format: "%03d", 218) + String(format: "%08d", 73_400_000 + seq * 7_919),
                               txnID: String(format: "ZB2611%08dQX", 4_000_000 + seq * 613),
                               failureReason: reason)
        }
        return [
            tx("Blue Tokai Coffee", 340, .sent, days: 0, hour: 9, minute: 41, note: "Cold brew", cat: .food),
            tx("Riya", 250, .sent, days: 0, hour: 13, minute: 5, note: "Lunch 🍜", cat: .food),
            tx("Arjun", 1_200, .received, days: 1, hour: 20, minute: 30, note: "Movie tickets", cat: .entertainment),
            tx("Fresh Basket Mart", 1_486.5, .sent, days: 1, hour: 18, minute: 2, cat: .groceries),
            tx("Zomato", 489, .sent, days: 1, hour: 21, minute: 14, note: "Dinner order", cat: .food),
            tx("Uber", 312, .sent, days: 2, hour: 8, minute: 40, note: "Ride to office", cat: .transport),
            tx("BookMyShow", 760, .sent, days: 2, hour: 17, minute: 5, note: "2 movie tickets", cat: .entertainment),
            tx("Amazon", 1_899, .sent, days: 3, hour: 14, minute: 22, note: "Order #4021", cat: .shopping),
            tx("Swiggy", 356, .sent, days: 5, hour: 20, minute: 8, note: "Lunch", cat: .food),
            tx("Airtel", 599, .sent, days: 7, hour: 11, minute: 30, note: "Mobile recharge", cat: .bills),
            tx("BigBasket", 1_120, .sent, days: 10, hour: 19, minute: 2, cat: .groceries),
            tx("Spotify", 119, .sent, days: 14, hour: 7, minute: 55, note: "Premium", cat: .entertainment),
            tx("Kabir", 500, .sent, .pending, days: 1, hour: 11, minute: 47, note: "Cab split", cat: .transport),
            tx("BESCOM Electricity", 2_340, .sent, days: 3, hour: 10, cat: .bills),
            tx("Meera", 3_000, .sent, .failed, days: 4, hour: 22, minute: 15, note: "Concert",
               cat: .entertainment, reason: "The recipient's bank didn't respond. No money was debited."),
            tx("Meera", 3_000, .sent, days: 4, hour: 22, minute: 18, note: "Concert", cat: .entertainment),
            tx("Ishaan", 780, .received, days: 5, hour: 15, note: "Snacks", cat: .food),
            tx("Blue Tokai Coffee", 290, .sent, days: 6, hour: 9, minute: 20, cat: .food),
            tx("Ananya", 15_000, .sent, days: 8, hour: 9, note: "Rent share – Nov", cat: .rent),
            tx("Vihaan", 640, .sent, .refunded, days: 9, hour: 19, note: "Order cancelled", cat: .shopping),
            tx("Sara", 2_000, .received, days: 11, hour: 12, note: "Birthday gift 🎁", cat: .transfer),
            tx("Fresh Basket Mart", 932, .sent, days: 12, hour: 18, cat: .groceries),
            tx("Riya", 450, .sent, days: 13, hour: 21, note: "Dinner", cat: .food),
            tx("Kabir", 220, .sent, days: 15, hour: 8, note: "Auto", cat: .transport),
            tx("Arjun", 5_000, .received, days: 18, hour: 17, note: "Paying back", cat: .transfer),
        ].sorted { $0.date > $1.date }
    }()
}
