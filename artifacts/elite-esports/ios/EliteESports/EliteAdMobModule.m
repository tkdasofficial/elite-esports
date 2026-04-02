#import "EliteAdMobModule.h"
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EliteAdMobModule ()
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
       [self emitEvent:@"EliteAdMob:loaded" data:nil];
     }];
  }
}

RCT_EXPORT_METHOD(showAd) {
  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *root = [UIApplication sharedApplication]
      .keyWindow.rootViewController;

    if ([self.currentType isEqualToString:@"rewarded"]) {
      if (!self.rewardedAd) {
        [self emitEvent:@"EliteAdMob:failed" data:@"Rewarded ad not loaded"];
        return;
      }
      __weak typeof(self) weakSelf = self;
      self.rewardedAd.fullScreenContentDelegate = nil;
      [self.rewardedAd
        presentFromRootViewController:root
        userDidEarnRewardHandler:^{
          [weakSelf emitEvent:@"EliteAdMob:rewarded" data:nil];
        }];
      self.rewardedAd = nil;
      [self emitEvent:@"EliteAdMob:closed" data:nil];

    } else if ([self.currentType isEqualToString:@"app_open"]) {
      if (!self.appOpenAd) {
        [self emitEvent:@"EliteAdMob:failed" data:@"App open ad not loaded"];
        return;
      }
      [self.appOpenAd presentFromRootViewController:root];
      self.appOpenAd = nil;
      [self emitEvent:@"EliteAdMob:closed" data:nil];

    } else {
      if (!self.interstitialAd) {
        [self emitEvent:@"EliteAdMob:failed" data:@"Interstitial ad not loaded"];
        return;
      }
      [self.interstitialAd presentFromRootViewController:root];
      self.interstitialAd = nil;
      [self emitEvent:@"EliteAdMob:closed" data:nil];
    }
  });
}

RCT_EXPORT_METHOD(addListener:(NSString *)eventName) {}
RCT_EXPORT_METHOD(removeListeners:(double)count) {}

@end
