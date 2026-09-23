// Tumble Match Douyin early entry listener: must run before engine startup.
(function () {
    if (typeof tt === 'undefined' || (typeof TTMinis !== 'undefined' && TTMinis.game)) return;
    if (globalThis.__tumbleDouyinEntry) return;
    var state = globalThis.__tumbleDouyinEntry = { latest: {}, day: '' };
    function capture(options) {
        options = options || {};
        var now = new Date();
        state.latest = { launch_from: options.launch_from, location: options.location, scene: options.scene };
        state.day = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-');
    }
    var received = false;
    if (typeof tt.onShow === 'function') tt.onShow(function (options) { received = true; capture(options); });
    try { if (!received && typeof tt.getLaunchOptionsSync === 'function') capture(tt.getLaunchOptionsSync()); } catch (_) {}
})();
