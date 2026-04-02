package com.elite.esports.android

import android.app.Activity

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.appopen.AppOpenAd
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

class EliteAdMobModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val EVENT_LOADED   = "EliteAdMob:loaded"
        const val EVENT_CLOSED   = "EliteAdMob:closed"
        const val EVENT_REWARDED = "EliteAdMob:rewarded"
        const val EVENT_FAILED   = "EliteAdMob:failed"
    }

    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd?         = null
    private var appOpenAd: AppOpenAd?           = null

    // @Volatile so that reads in showAd() always see the latest write from loadAd()
    @Volatile private var currentType: String = "interstitial"

    override fun getName(): String = "EliteAdMob"

    // ─── helper: resolve the current Activity safely ─────────────────────────
    // reactContext.currentActivity returns Any? in newer RN versions; we must
    // cast it explicitly to android.app.Activity.

    private fun safeActivity(): Activity? {
        val act = reactContext.currentActivity as? Activity ?: return null
        if (act.isFinishing || act.isDestroyed) return null
        return act
    }

    // ─── loadAd ─────────────────────────────────────────────────────────────

    @ReactMethod
    fun loadAd(unitId: String, type: String) {
        currentType = type
        val appContext = reactContext.applicationContext

        val request = try {
            AdRequest.Builder().build()
        } catch (e: Exception) {
            safeEmit(EVENT_FAILED, "AdRequest build failed: ${e.message}")
            return
        }

        try {
            when (type) {
                "rewarded" -> RewardedAd.load(
                    appContext, unitId, request,
                    object : RewardedAdLoadCallback() {
                        override fun onAdLoaded(ad: RewardedAd) {
                            rewardedAd = ad
                            safeEmit(EVENT_LOADED, null)
                        }
                        override fun onAdFailedToLoad(error: LoadAdError) {
                            safeEmit(EVENT_FAILED, error.message)
                        }
                    }
                )

                "app_open" -> AppOpenAd.load(
                    appContext, unitId, request,
                    object : AppOpenAd.AppOpenAdLoadCallback() {
                        override fun onAdLoaded(ad: AppOpenAd) {
                            appOpenAd = ad
                            safeEmit(EVENT_LOADED, null)
                        }
                        override fun onAdFailedToLoad(error: LoadAdError) {
                            safeEmit(EVENT_FAILED, error.message)
                        }
                    }
                )

                else -> InterstitialAd.load(
                    appContext, unitId, request,
                    object : InterstitialAdLoadCallback() {
                        override fun onAdLoaded(ad: InterstitialAd) {
                            interstitialAd = ad
                            safeEmit(EVENT_LOADED, null)
                        }
                        override fun onAdFailedToLoad(error: LoadAdError) {
                            safeEmit(EVENT_FAILED, error.message)
                        }
                    }
                )
            }
        } catch (e: Exception) {
            safeEmit(EVENT_FAILED, "loadAd exception [type=$type]: ${e.message}")
        }
    }

    // ─── showAd ─────────────────────────────────────────────────────────────

    @ReactMethod
    fun showAd() {
        val activity = safeActivity()
        if (activity == null) {
            safeEmit(EVENT_FAILED, "No valid activity to show ad")
            return
        }

        try {
            when (currentType) {

                "rewarded" -> {
                    val ad = rewardedAd
                    if (ad == null) { safeEmit(EVENT_FAILED, "Rewarded ad not loaded"); return }
                    activity.runOnUiThread {
                        try {
                            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                                override fun onAdDismissedFullScreenContent() {
                                    rewardedAd = null
                                    safeEmit(EVENT_CLOSED, null)
                                }
                                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                                    rewardedAd = null
                                    safeEmit(EVENT_FAILED, error.message)
                                }
                            }
                            ad.show(activity) { safeEmit(EVENT_REWARDED, null) }
                        } catch (e: Exception) {
                            rewardedAd = null
                            safeEmit(EVENT_FAILED, "showRewarded UI exception: ${e.message}")
                        }
                    }
                }

                "app_open" -> {
                    val ad = appOpenAd
                    if (ad == null) { safeEmit(EVENT_FAILED, "App open ad not loaded"); return }
                    activity.runOnUiThread {
                        try {
                            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                                override fun onAdDismissedFullScreenContent() {
                                    appOpenAd = null
                                    safeEmit(EVENT_CLOSED, null)
                                }
                                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                                    appOpenAd = null
                                    safeEmit(EVENT_FAILED, error.message)
                                }
                            }
                            ad.show(activity)
                        } catch (e: Exception) {
                            appOpenAd = null
                            safeEmit(EVENT_FAILED, "showAppOpen UI exception: ${e.message}")
                        }
                    }
                }

                else -> {
                    val ad = interstitialAd
                    if (ad == null) { safeEmit(EVENT_FAILED, "Interstitial ad not loaded"); return }
                    activity.runOnUiThread {
                        try {
                            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                                override fun onAdDismissedFullScreenContent() {
                                    interstitialAd = null
                                    safeEmit(EVENT_CLOSED, null)
                                }
                                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                                    interstitialAd = null
                                    safeEmit(EVENT_FAILED, error.message)
                                }
                            }
                            ad.show(activity)
                        } catch (e: Exception) {
                            interstitialAd = null
                            safeEmit(EVENT_FAILED, "showInterstitial UI exception: ${e.message}")
                        }
                    }
                }
            }
        } catch (e: Exception) {
            safeEmit(EVENT_FAILED, "showAd outer exception: ${e.message}")
        }
    }

    // ─── safeEmit ────────────────────────────────────────────────────────────
    // Every event emission is wrapped so that a torn-down / not-yet-ready
    // React context never propagates an unhandled exception into the process.

    private fun safeEmit(eventName: String, data: String?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, data)
        } catch (_: Exception) {
            // Silently discard — React context is unavailable
        }
    }

    // Required by React Native so NativeEventEmitter doesn't warn in JS
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
