package com.elite.esports.android

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
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
    private var currentType: String             = "interstitial"

    override fun getName(): String = "EliteAdMob"

    @ReactMethod
    fun loadAd(unitId: String, type: String) {
        currentType = type
        val request = AdRequest.Builder().build()

        if (type == "rewarded") {
            RewardedAd.load(
                reactContext, unitId, request,
                object : RewardedAdLoadCallback() {
                    override fun onAdLoaded(ad: RewardedAd) {
                        rewardedAd = ad
                        emit(EVENT_LOADED, null)
                    }
                    override fun onAdFailedToLoad(error: LoadAdError) {
                        emit(EVENT_FAILED, error.message)
                    }
                }
            )
        } else {
            InterstitialAd.load(
                reactContext, unitId, request,
                object : InterstitialAdLoadCallback() {
                    override fun onAdLoaded(ad: InterstitialAd) {
                        interstitialAd = ad
                        emit(EVENT_LOADED, null)
                    }
                    override fun onAdFailedToLoad(error: LoadAdError) {
                        emit(EVENT_FAILED, error.message)
                    }
                }
            )
        }
    }

    @ReactMethod
    fun showAd() {
        val activity = currentActivity ?: run {
            emit(EVENT_FAILED, "No activity available")
            return
        }

        if (currentType == "rewarded") {
            val ad = rewardedAd ?: run { emit(EVENT_FAILED, "Rewarded ad not loaded"); return }
            activity.runOnUiThread {
                ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                    override fun onAdDismissedFullScreenContent() {
                        rewardedAd = null
                        emit(EVENT_CLOSED, null)
                    }
                    override fun onAdFailedToShowFullScreenContent(error: AdError) {
                        rewardedAd = null
                        emit(EVENT_FAILED, error.message)
                    }
                }
                ad.show(activity) {
                    emit(EVENT_REWARDED, null)
                }
            }
        } else {
            val ad = interstitialAd ?: run { emit(EVENT_FAILED, "Interstitial ad not loaded"); return }
            activity.runOnUiThread {
                ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                    override fun onAdDismissedFullScreenContent() {
                        interstitialAd = null
                        emit(EVENT_CLOSED, null)
                    }
                    override fun onAdFailedToShowFullScreenContent(error: AdError) {
                        interstitialAd = null
                        emit(EVENT_FAILED, error.message)
                    }
                }
                ad.show(activity)
            }
        }
    }

    private fun emit(eventName: String, data: String?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
