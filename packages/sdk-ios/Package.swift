// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "OTAPlatformSDK",
    platforms: [
        .iOS(.v13),
        .macOS(.v10_15)
    ],
    products: [
        .library(
            name: "OTAPlatformSDK",
            targets: ["OTAPlatformSDK"]
        )
    ],
    dependencies: [],
    targets: [
        .target(
            name: "OTAPlatformSDK",
            dependencies: [],
            path: "Sources/OTAPlatformSDK"
        ),
        .testTarget(
            name: "OTAPlatformSDKTests",
            dependencies: ["OTAPlatformSDK"],
            path: "Tests"
        )
    ]
)
