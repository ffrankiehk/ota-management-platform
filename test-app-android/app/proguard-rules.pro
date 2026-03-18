# Add project specific ProGuard rules here.
# Keep OTA SDK classes
-keep class com.otaplatform.testapp.ota.** { *; }
-keepclassmembers class com.otaplatform.testapp.ota.** { *; }

# Keep Gson
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }

# Keep OkHttp
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
