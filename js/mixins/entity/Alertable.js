Game.EntityMixins.Alertable = {
    name: 'Alertable',
    init: function () {
        this._alerts = [];
    },
    getAlerts: function () {
        return this._alerts;
    },
    clearAlerts: function () {
        this._alerts = [];
    },
    listeners: {
        alert: function (text) {
            this._alerts.push(text);
        }
    }
};