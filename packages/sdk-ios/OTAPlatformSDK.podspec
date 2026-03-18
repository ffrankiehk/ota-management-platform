Pod::Spec.new do |s|
  s.name             = 'OTAPlatformSDK'
  s.version          = '1.0.0'
  s.summary          = 'iOS SDK for OTA Platform - Over-the-Air update management'
  s.description      = <<-DESC
    OTA Platform iOS SDK provides easy integration for iOS applications
    to support over-the-air updates. Features include update checking,
    bundle downloading with progress tracking, SHA256 verification,
    and status reporting.
  DESC

  s.homepage         = 'https://github.com/your-org/ota-platform'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'OTA Platform' => 'contact@ota-platform.com' }
  s.source           = { :git => 'https://github.com/your-org/ota-platform-ios-sdk.git', :tag => s.version.to_s }

  s.ios.deployment_target = '13.0'
  s.osx.deployment_target = '10.15'
  s.swift_version = '5.9'

  s.source_files = 'Sources/OTAPlatformSDK/**/*.swift'
  
  s.frameworks = 'Foundation', 'CryptoKit'
end
