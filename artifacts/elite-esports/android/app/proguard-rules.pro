# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# ─── EliteAdMob custom native module ─────────────────────────────────────────
-keep class com.elite.esports.android.EliteAdMobModule { *; }
-keep class com.elite.esports.android.EliteAdMobPackage { *; }
# ─────────────────────────────────────────────────────────────────────────────

# Add any project specific keep options here:

# ─── Google AdMob / Mobile Ads SDK ───────────────────────────────────────────
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }
-keep class com.google.android.gms.ads.mediation.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keepclassmembers class * {
    @com.google.android.gms.ads.* <methods>;
}
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes Exceptions
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
# ─────────────────────────────────────────────────────────────────────────────
