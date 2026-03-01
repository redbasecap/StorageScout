import SwiftUI

// MARK: - App Theme

enum AppTheme {
    // Primary brand colors
    static let accent = Color("AccentColor", bundle: nil)
    static let primary = Color.blue
    static let secondary = Color.indigo
    
    // Semantic colors
    static let cardBackground = Color(.systemBackground)
    static let groupedBackground = Color(.systemGroupedBackground)
    static let subtleBackground = Color(.secondarySystemGroupedBackground)
    
    // Gradients
    static let headerGradient = LinearGradient(
        colors: [Color.blue, Color.indigo],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let softGradient = LinearGradient(
        colors: [Color.blue.opacity(0.08), Color.indigo.opacity(0.05)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Corner radii
    static let cardRadius: CGFloat = 16
    static let buttonRadius: CGFloat = 12
    static let smallRadius: CGFloat = 8
    
    // Shadows
    static let cardShadow: ShadowStyle = .drop(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
}

// MARK: - View Modifiers

struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.cardRadius))
            .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
}

struct PillButtonStyle: ButtonStyle {
    var isPrimary: Bool = true
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(isPrimary ? AnyShapeStyle(AppTheme.headerGradient) : AnyShapeStyle(Color(.tertiarySystemFill)))
            .foregroundStyle(isPrimary ? .white : .primary)
            .clipShape(Capsule())
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}

// MARK: - Empty State View

struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String
    var buttonTitle: String? = nil
    var action: (() -> Void)? = nil
    
    var body: some View {
        VStack(spacing: 20) {
            Spacer()
            
            ZStack {
                Circle()
                    .fill(AppTheme.softGradient)
                    .frame(width: 120, height: 120)
                
                Image(systemName: icon)
                    .font(.system(size: 44, weight: .light))
                    .foregroundStyle(.secondary)
            }
            
            VStack(spacing: 8) {
                Text(title)
                    .font(.title3.weight(.semibold))
                
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 260)
            }
            
            if let buttonTitle, let action {
                Button(action: action) {
                    Label(buttonTitle, systemImage: "plus")
                }
                .buttonStyle(PillButtonStyle())
                .padding(.top, 4)
            }
            
            Spacer()
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .listRowBackground(Color.clear)
        .listRowInsets(EdgeInsets())
    }
}

// MARK: - Animated Counter

struct AnimatedCounter: View {
    let value: Int
    let label: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            
            Text("\(value)")
                .font(.title2.weight(.bold).monospacedDigit())
                .contentTransition(.numericText())
            
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: AppTheme.buttonRadius))
    }
}
