(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // src/popup/supabase-init.js
  var import_supabase_js_2 = __require("https://esm.sh/@supabase/supabase-js@2");
  window.createSupabaseClient = import_supabase_js_2.createClient;
  console.log("\u2705 Supabase createClient loaded");
})();
//# sourceMappingURL=supabase-init.js.map
