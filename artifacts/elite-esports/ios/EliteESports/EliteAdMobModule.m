#import "EliteAdMobModule.h"
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EliteAdMobModule () <GADFullScreenContentDelegate>
@property (nonatomic, strong) GADInterstitialAd  *interstitialAd;
@property (nonatomic, strong) GADRewardedAd      *rewardedAd;
@property (nonatomic, strong) GADAppOpenAd       *appOpenAd;
@property (nonatomic, copy)   NSString           *currentType;
@property (nonatomic, assign) BOOL               hasListeners;
@end

@implementation EliteAdMobModule

RCT_EXPORT_MODULE(EliteAdMob)

- (instancetype)init {
  self = [super init];
  if (self) {
    _currentType = @"interstitial";
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup { return NO; }

- (NSArray<NSString *> *)supportedEvents {
  return @[
    @"EliteAdMob:loaded",
    @"EliteAdMob:closed",
    @"EliteAdMob:rewarded",
    @"EliteAdMob:failed",
  ];
}

- (void)startObserving  { self.hasListeners = YES; }
- (void)stopObserving   { self.hasListeners = NO;  }

- (void)emitEvent:(NSString *)name data:(id)data {
  if (self.hasListeners) {
    [self sendEventWithName:name body:data];
  }
}

// MARK: - GADFullScreenContentDelegate

- (void)adDidDismissFullScreenContent:(id<GADFullScreenPresentingAd>)ad {
  self.interstitialAd = nil;
  self.rewardedAd     = nil;
  self.appOpenAd      = nil;
  [self emitEvent:@"EliteAdMob:closed" data:nil];
}

- (void)ad:(id<GADFullScreenPresentingAd>)ad
    didFailToPresentFullScreenContentWithError:(NSError *)error {
  self.interstitialAd = nil;
  self.rewardedAd     = nil;
  self.appOpenAd      = nil;
  [self emitEvent:@"EliteAdMob:failed" data:error.localizedDescription];
}

// MARK: - Load

RCT_EXPORT_METHOD(loadAd:(NSString *)unitId type:(NSString *)type) {
  self.currentType = type;
  GADRequest *request = [GADRequest request];

  if ([type isEqualToString:@"rewarded"]) {
    [GADRewardedAd
      loadWithAdUnitID:unitId
               request:request
     completionHandler:^(GADRewardedAd *ad, NSError *error) {
       if (error) {
         [self emitEvent:@"EliteAdMob:failed" data:error.localizedDescription];
         return;
       }
       self.rewardedAd = ad;
       self.rewardedAd.fullScreenContentDelegate = self;
       [self emitEvent:@"EliteAdMob:loaded" data:nil];
     }];

  } else if ([type isEqualToString:@"app_open"]) {
    [GADAppOpenAd
      loadWithAdUnitID:unitId
               request:request
     completionHandler:^(GADAppOpenAd *ad, NSError *error) {
       if (error) {
         [self emitEvent:@"EliteAdMob:failed" data:error.localizedDescription];
         return;
       }
       self.appOpenAd = ad;
       self.appOpenAd.fullScreenContentDelegate = self;
       [self emitEvent:@"EliteAdMob:loaded" data:nil];
     }];

  } else {
    [GADInterstitialAd
      loadWithAdUnitID:unitId
               request:request
     completionHandler:^(GADInterstitialAd *ad, NSError *error) {
       if (error) {
         [self emitEvent:@"EliteAdMob:failed" data:error.localizedDescription];
         return;
       }
       self.interstitialAd = ad;
       self.interstitialAd.fullScreenContentDelegate = self;
       [self emitEvent:@"EliteAdMob:loaded" data:nil];
     }];
  }
}

// MARK: - Show
// Uses UIWindowScene API (iOS 15+) — replaces deprecated keyWindow.

RCT_EXPORT_METHOD(showAd) {
  dispatch_async(dispatch_get_main_queue(), ^{
    // Resolve the active root view controller using the modern UIWindowScene API.
    UIViewController *root = nil;
    for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
      if (scene.activationState == UISceneActivationStateForegroundActive &&
          [scene isKindOfClass:[UIWindowScene class]]) {
        UIWindowScene *windowScene = (UIWindowScene *)scene;
        for (UIWindow *window in windowScene.windows) {
          if (window.isKeyWindow) {
            root = window.rootViewController;
            break;
          }
        }
        if (root) break;
      }
    }

    if (!root) {
      [self emitEvent:@"EliteAdMob:failed" data:@"No active root view controller"];
      return;
    }

    if ([self.currentType isEqualToString:@"rewarded"]) {
      if (!self.rewardedAd) {
        [self emitEvent:@"EliteAdMob:failed" data:@"Rewarded ad not loaded"];
        return;
      }
      __weak typeof(self) weakSelf = self;
      [self.rewardedAd
        presentFromRootViewController:root
        userDidEarnRewardHandler:^{
          [weakSelf emitEvent:@"EliteAdMob:rewarded" data:nil];
        }];

    } else if ([self.currentType isEqualToString:@"app_open"]) {
      if (!self.appOpenAd) {
        [self emitEvent:@"EliteAdMob:failed" data:@"App open ad not loaded"];
        return;
      }
      [self.appOpenAd presentFromRootViewController:root];

    } else {
      if (!self.interstitialAd) {
        [self emitEvent:@"EliteAdMob:failed" data:@"Interstitial ad not loaded"];
        return;
      }
      [self.interstitialAd presentFromRootViewController:root];
    }
  });
}

RCT_EXPORT_METHOD(addListener:(NSString *)eventName) {}
RCT_EXPORT_METHOD(removeListeners:(double)count) {}

@end
