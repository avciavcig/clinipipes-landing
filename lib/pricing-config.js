/**
 * Normalizes pricing from content.json (supports legacy sm/sm_f and pricing.* schema).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PricingConfig = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function num(v, fallback) {
    var n = +v;
    return isNaN(n) ? fallback : n;
  }

  function planFromLegacy(prefix, raw) {
    var list = num(raw[prefix], 0);
    var introKey = prefix + '_f';
    var intro = raw[introKey] != null ? num(raw[introKey], list) : list;
    return {
      listPrice: list,
      introductoryPrice: intro,
      introductoryPriceActive: intro < list,
      remainingSlots: null
    };
  }

  function normalizePlan(plan, legacy) {
    if (plan && typeof plan === 'object' && plan.listPrice != null) {
      var listPrice = num(plan.listPrice, 0);
      var introductoryPrice = plan.introductoryPrice != null ? num(plan.introductoryPrice, listPrice) : listPrice;
      return {
        listPrice: listPrice,
        introductoryPrice: introductoryPrice,
        introductoryPriceActive: plan.introductoryPriceActive === true,
        remainingSlots: plan.remainingSlots != null ? num(plan.remainingSlots, 0) : null
      };
    }
    return legacy;
  }

  function normalizePricing(content) {
    content = content || {};
    var raw = content.pricing;
    var legacy = content.prices || {};
    var promo = content.promo || {};
    var founding = content.founding || {};

    var starterLegacy = planFromLegacy('sm', legacy);
    var proLegacy = planFromLegacy('pm', legacy);
    var setupLegacy = {
      listPrice: num(legacy.setup, 149),
      introductoryPrice: legacy.setup_f != null ? num(legacy.setup_f, legacy.setup) : num(legacy.setup, 149),
      introductoryPriceActive: legacy.setup_f != null && num(legacy.setup_f, 0) < num(legacy.setup, 0),
      remainingSlots: null
    };

    if (promo.active === false) {
      starterLegacy.introductoryPriceActive = false;
      proLegacy.introductoryPriceActive = false;
      setupLegacy.introductoryPriceActive = false;
    } else if (promo.active === true && legacy.sm_f != null) {
      starterLegacy.introductoryPriceActive = true;
      proLegacy.introductoryPriceActive = true;
    }

    var pricing = {
      starter: normalizePlan(raw && raw.starter, starterLegacy),
      professional: normalizePlan(raw && raw.professional, proLegacy),
      setup: normalizePlan(raw && raw.setup, setupLegacy),
      bundleDiscount: num(raw && raw.bundleDiscount, num(legacy.bundle, 0))
    };

    if (pricing.starter.remainingSlots == null && founding.slots_remaining != null) {
      pricing.starter.remainingSlots = num(founding.slots_remaining, 0);
      pricing.professional.remainingSlots = num(founding.slots_remaining, 0);
    }

    var campaign = content.introductoryCampaign || {};
    if (!campaign.strip_tr && promo.strip_tr) {
      campaign = Object.assign({}, campaign, {
        strip_tr: promo.strip_tr,
        strip_en: promo.strip_en
      });
    }

    return { pricing: pricing, introductoryCampaign: campaign };
  }

  function yearlyPrice(monthly) {
    return monthly * 10;
  }

  function displayMonthly(plan) {
    return plan.introductoryPriceActive ? plan.introductoryPrice : plan.listPrice;
  }

  function isIntroductoryVisible(pricing) {
    return !!(pricing.starter.introductoryPriceActive
      || pricing.professional.introductoryPriceActive
      || pricing.setup.introductoryPriceActive);
  }

  function remainingSlotsDisplay(pricing) {
    var vals = [];
    if (pricing.starter.introductoryPriceActive && pricing.starter.remainingSlots != null) {
      vals.push(num(pricing.starter.remainingSlots, 0));
    }
    if (pricing.professional.introductoryPriceActive && pricing.professional.remainingSlots != null) {
      vals.push(num(pricing.professional.remainingSlots, 0));
    }
    if (!vals.length) return null;
    return Math.min.apply(null, vals);
  }

  return {
    normalizePricing: normalizePricing,
    yearlyPrice: yearlyPrice,
    displayMonthly: displayMonthly,
    isIntroductoryVisible: isIntroductoryVisible,
    remainingSlotsDisplay: remainingSlotsDisplay
  };
});
