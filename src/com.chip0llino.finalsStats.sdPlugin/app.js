/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
	console.log('Stream Deck connected!');
});

// Action Cache
const MACTIONS = {};

// Action Events
const playerRank = new Action('com.chip0llino.finalsStats.rank');

playerRank.onKeyUp(({ action, context, device, event, payload }) => {
	//open leaderboard in browser
});

playerRank.onWillAppear(({ context,  payload }) => {
	MACTIONS[context] = new FinalsLeaderboardAction(context, payload)
});

playerRank.onWillDisappear(({context}) => {
    MACTIONS[context].interval && clearInterval(MACTIONS[context].interval);
    delete MACTIONS[context];
});

playerRank.onDidReceiveSettings(({context, payload}) => {
    MACTIONS[context].didReceiveSettings(payload?.settings);
});

class FinalsLeaderboardAction {
    constructor (context, payload) {
        this.context = context;
        this.payload = payload;
        this.interval = null;
        this.settings = {
            ...{
                embarkId: "EmbarkID here",
                platform: "steam",
                leaderboardVersion: "live",
                upInterval: 5
            }, ...payload?.settings
        };
        this.saveSettings();
        this.init();
        this.update();
    }

    init() {
        this.interval = setInterval(() => {
            this.update();
        }, this.settings.upInterval * 1000);
    }

    didReceiveSettings(settings) {
        if(!settings) return;
        let dirty = false;
        if(settings.hasOwnProperty('embarkId')) {
            this.settings.embarkId = settings.embarkId;
            dirty = true;
        }
        if(settings.hasOwnProperty('platform')) {
            this.settings.platform = settings.platform;
            dirty = true;
        }
        if(settings.hasOwnProperty('leaderboardVersion')) {
            this.settings.leaderboardVersion = settings.leaderboardVersion;
            dirty = true;
        }
        if(settings.hasOwnProperty('upInterval')) {
            this.settings.upInterval = settings.upInterval;
            dirty = true;
        }
        if(dirty) this.update();
    }

    saveSettings(immediateUpdate = true) {
        $SD.setSettings(this.context, this.settings);
        if(immediateUpdate) this.update();
    };

    update() {
        /* Retrieve stats and set icon for current rank
        
        const icon = `data:image/svg+xml;base64,${btoa(svg)}`;
        $SD.setImage(this.context, icon);
        */
    }
}