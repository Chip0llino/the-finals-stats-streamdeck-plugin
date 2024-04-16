/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const playerRank = new Action('com.chip0llino.finalsStats.rank');

/**
 * The first event fired when Stream Deck starts
 */
$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
	console.log('Stream Deck connected!');
});

playerRank.onKeyUp(({ action, context, device, event, payload }) => {
	console.log('Your key code goes here!');
});

playerRank.onWillAppear(({ context,  payload }) => {
	let settings = payload.settings
});

// Action Cache
const MACTIONS = {};

// Action Events
const sampleClockAction = new Action('com.elgato.sample-clock.action');

sampleClockAction.onWillAppear(({context, payload}) => {
    // console.log('will appear', context, payload);
    MACTIONS[context] = new SampleClockAction(context, payload);
});

sampleClockAction.onWillDisappear(({context}) => {
    // console.log('will disappear', context);
    MACTIONS[context].interval && clearInterval(MACTIONS[context].interval);
    delete MACTIONS[context];
});

sampleClockAction.onDidReceiveSettings(({context, payload}) => {
    //  console.log('onDidReceiveSettings', payload?.settings?.hour12, context, payload);
    MACTIONS[context].didReceiveSettings(payload?.settings);
});

sampleClockAction.onTitleParametersDidChange(({context, payload}) => {
    // console.log('wonTitleParametersDidChange', context, payload);
    MACTIONS[context].color = payload.titleParameters.titleColor;
    MACTIONS[context].ticks = ''; // trigger re-rendering of ticks
});

$SD.onConnected(jsn => {
    const [version, major] = jsn.appInfo.application.version.split(".").map(e => parseInt(e, 10));
    const hasDialPress = version == 6 && major < 4;
    if(hasDialPress) {
        sampleClockAction.onDialPress(({context, payload}) => {
            // console.log('dial was pressed', context, payload);
            if(payload.pressed === false) {
                MACTIONS[context].toggleSeconds();
            }
        });
    } else {
        sampleClockAction.onDialUp(({context, payload}) => {
            console.log('onDialUp', context, payload);
                MACTIONS[context].toggleSeconds();
        });
    }
});

sampleClockAction.onTouchTap(({context, payload}) => {
    // console.log('touchpanel was tapped', context, payload);
    if(payload.hold === false) {
        MACTIONS[context].toggleSeconds();
    }
});

class SampleClockAction {
    constructor (context, payload) {
        this.context = context;
        this.payload = payload;
        this.interval = null;
        this.isEncoder = payload?.controller === 'Encoder';
        this.settings = {
            ...{
                hour12: false,
                longDateAndTime: false,
                showTicks: true
            }, ...payload?.settings
        };
        this.ticks = '';
        this.timeOptions = {
            short: {hour: '2-digit', minute: '2-digit'},
            long: {hour: '2-digit', minute: '2-digit', second: '2-digit'}
        };
        this.dateOptions = {
            short: {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'},
            long: {weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric'}
        };
        this.size = 48; // default size of the icon is 48
        this.color = '#EFEFEF';
        this.saveSettings();
        this.init();
        this.update();
    }

    init() {
        this.interval = setInterval(() => {
            this.update();
        }, 1000);
    }

    didReceiveSettings(settings) {
        if(!settings) return;
        let dirty = false;
        if(settings.hasOwnProperty('hour12')) {
            this.settings.hour12 = settings.hour12 === true;
            dirty = true;
        }
        if(settings.hasOwnProperty('longDateAndTime')) {
            this.settings.longDateAndTime = settings.longDateAndTime === true;
            dirty = true;
        }
        if(settings.hasOwnProperty('color')) {
            this.settings.color = settings.color;
            dirty = true;
        }
        if(settings.hasOwnProperty('showTicks')) {
            this.settings.showTicks = settings.showTicks === true;
            this.ticks = ''; // trigger re-rendering of ticks
            dirty = true;
        }
        if(dirty) this.update();
    }

    saveSettings(immediateUpdate = false) {
        $SD.setSettings(this.context, this.settings);
        if(immediateUpdate) this.update();
    };

    toggleSeconds() {
        this.longDateAndTime = !this.longDateAndTime;
        this.update();
    }

    update() {
        const o = this.updateClockSettings();
        const svg = this.makeSvg(o);
        const icon = `data:image/svg+xml;base64,${btoa(svg)}`;
        if(this.isEncoder) {
            const payload = {
                'title': o.date,
                'value': o.time,
                icon
            };
            $SD.setFeedback(this.context, payload);
        }
        $SD.setImage(this.context, icon);
    }
    updateClockSettings() {
        const date = new Date();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const opts = this.longDateAndTime ? this.timeOptions.long : this.timeOptions.short;
        opts.hour12 = this.settings?.hour12 === true;
        const dateOpts = this.longDateAndTime ? this.dateOptions.long : this.dateOptions.short;
        return {
            minDeg: (minutes + seconds / 60) * 6,
            secDeg: seconds * 6,
            hourDeg: ((hours % 12) + minutes / 60) * 360 / 12,
            time: date.toLocaleTimeString([], opts),
            date: date.toLocaleDateString([], dateOpts),
            weekday: date.toLocaleDateString([], {weekday: 'long'}),
            hours,
            minutes,
            seconds
        };
    }
}